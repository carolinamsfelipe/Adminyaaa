/**
 * auth.js — Módulo de autenticación para AdminYAAA
 * Maneja sesión, roles y permisos por módulo.
 * Diseñado para ser reemplazado por Supabase Auth en producción.
 */

import { AppState } from './state.js'
import { toast } from './utils.js'

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:    'admin',
  OPERADOR: 'operador',
}

// ─── Permisos por módulo ──────────────────────────────────────────────────────
// Define qué módulos puede ver cada rol.
export const PERMISSIONS = {
  admin: [
    'dashboard',
    'clientes',
    'tareas',
    'planilla-gastro',
    'presupuestador',
    'cuentas-corrientes',
    'alianzas',
    'sueldos',
    'fondos',
    'presentismo',
    'gastos',
    'socios',
    'cobranzas',
    'tesoreria',
    'configuracion',
  ],
  operador: [
    'tareas',
    'planilla-gastro',
    'presupuestador',
    'presentismo',
    'fondos',
  ],
}

// ─── Usuarios demo ────────────────────────────────────────────────────────────
// Reemplazar con Supabase Auth en producción.
export const DEMO_USERS = [
  {
    id:           'u1',
    nombre:       'Joaquín Ibáñez',
    email:        'joaquin@adminyaaa.com',
    password:     'admin123',
    role:         'admin',
    iniciales:    'JI',
    avatar_color: 'emerald',
    // Admins pueden ver todos los clientes; sin restricción por cliente_id
    clientes_asignados: null,
  },
  {
    id:           'u2',
    nombre:       'Máximo Ferreyra',
    email:        'maximo@adminyaaa.com',
    password:     'oper123',
    role:         'operador',
    iniciales:    'MF',
    avatar_color: 'blue',
    // Operadores sólo ven sus clientes asignados (null = todos, array = restricto)
    clientes_asignados: ['c1', 'c2', 'c3'],
  },
  {
    id:           'u3',
    nombre:       'Carolina Sánchez',
    email:        'carolina@adminyaaa.com',
    password:     'oper123',
    role:         'operador',
    iniciales:    'CS',
    avatar_color: 'violet',
    clientes_asignados: ['c4', 'c5'],
  },
]

// ─── Constantes internas ──────────────────────────────────────────────────────
const SESSION_KEY = 'ay_session'
const LOGIN_PAGE  = '/panel/login.html'

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const Auth = {

  /**
   * Intenta iniciar sesión con email + password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} Usuario autenticado
   * @throws {Error} Si las credenciales son inválidas
   */
  async login(email, password) {
    // Simula latencia de red (quitar con Supabase)
    await new Promise(r => setTimeout(r, 300))

    const normalized = (email || '').trim().toLowerCase()
    const user = DEMO_USERS.find(
      u => u.email.toLowerCase() === normalized && u.password === password
    )

    if (!user) {
      toast('Credenciales incorrectas. Verificá tu email y contraseña.', 'error')
      throw new Error('Credenciales inválidas')
    }

    // Guardamos sin exponer la contraseña en sesión
    const sessionUser = { ...user }
    delete sessionUser.password

    Auth.setSession(sessionUser)

    // Sincronizar con AppState si está disponible
    try {
      if (AppState && typeof AppState.set === 'function') {
        AppState.set('currentUser', sessionUser)
      }
    } catch (_) { /* AppState opcional */ }

    toast(`Bienvenido, ${sessionUser.nombre.split(' ')[0]} 👋`, 'success')
    return sessionUser
  },

  /**
   * Cierra la sesión actual y redirige al login.
   */
  logout() {
    const user = Auth.currentUser()
    Auth.clearSession()

    try {
      if (AppState && typeof AppState.set === 'function') {
        AppState.set('currentUser', null)
      }
    } catch (_) { /* AppState opcional */ }

    toast(`Hasta luego, ${user?.nombre?.split(' ')[0] || ''}`, 'info')

    // Pequeño delay para que se vea el toast antes de redirigir
    setTimeout(() => {
      window.location.href = Auth._loginUrl()
    }, 800)
  },

  /**
   * Devuelve el usuario actual desde sessionStorage.
   * @returns {object|null}
   */
  getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  /**
   * Guarda el usuario en sessionStorage.
   * @param {object} user
   */
  setSession(user) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } catch (e) {
      console.error('[Auth] Error guardando sesión:', e)
    }
  },

  /**
   * Elimina la sesión de sessionStorage.
   */
  clearSession() {
    sessionStorage.removeItem(SESSION_KEY)
  },

  /**
   * Verifica autenticación. Si no hay sesión, redirige al login.
   * Usar al inicio de cada página protegida.
   * @returns {object} Usuario actual
   */
  requireAuth() {
    const user = Auth.getSession()
    if (!user) {
      window.location.href = Auth._loginUrl()
      throw new Error('No autenticado')
    }
    // Sincronizar AppState en cada carga de página
    try {
      if (AppState && typeof AppState.set === 'function') {
        AppState.set('currentUser', user)
      }
    } catch (_) { /* AppState opcional */ }
    return user
  },

  /**
   * Verifica que el usuario sea admin. Si no, muestra error y redirige.
   * @returns {object} Usuario admin
   */
  requireAdmin() {
    const user = Auth.requireAuth()
    if (user.role !== ROLES.ADMIN) {
      toast('Acceso denegado. Se requieren permisos de administrador.', 'error')
      setTimeout(() => {
        window.location.href = '/panel/tareas.html'
      }, 1200)
      throw new Error('Permisos insuficientes')
    }
    return user
  },

  /**
   * @returns {boolean}
   */
  isAdmin() {
    return Auth.currentUser()?.role === ROLES.ADMIN
  },

  /**
   * @returns {boolean}
   */
  isOperador() {
    return Auth.currentUser()?.role === ROLES.OPERADOR
  },

  /**
   * @returns {object|null}
   */
  currentUser() {
    return Auth.getSession()
  },

  /**
   * Verifica si el usuario actual puede acceder a un módulo.
   * Para operadores, también verifica restricción por cliente si se pasa clienteId.
   *
   * @param {string} module - Nombre del módulo (ej: 'clientes', 'tareas')
   * @param {string|null} [clienteId] - Opcional: ID de cliente para verificar acceso
   * @returns {boolean}
   */
  canAccess(module, clienteId = null) {
    const user = Auth.currentUser()
    if (!user) return false

    // Verificar permiso por módulo
    const allowedModules = PERMISSIONS[user.role] ?? []
    if (!allowedModules.includes(module)) return false

    // Para admins: acceso total
    if (user.role === ROLES.ADMIN) return true

    // Para operadores: verificar restricción por cliente
    if (clienteId && user.clientes_asignados !== null) {
      return Array.isArray(user.clientes_asignados)
        ? user.clientes_asignados.includes(clienteId)
        : true
    }

    return true
  },

  /**
   * Construye la URL del login relativa al origen actual.
   * @private
   */
  _loginUrl() {
    // Soporta tanto /panel/login.html como index en raíz
    return LOGIN_PAGE
  },
}

// ─── Helper: Inicializar auth en páginas protegidas ───────────────────────────
/**
 * Conveniencia para inicializar auth en cualquier página protegida.
 * Uso: `const user = initAuth()` al inicio del módulo de la página.
 * Opcionalmente pasar 'admin' para requerir rol admin.
 *
 * @param {'any'|'admin'} [requiredRole='any']
 * @returns {object} Usuario actual
 */
export function initAuth(requiredRole = 'any') {
  if (requiredRole === 'admin') {
    return Auth.requireAdmin()
  }
  return Auth.requireAuth()
}

export default Auth
