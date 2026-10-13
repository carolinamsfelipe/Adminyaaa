/**
 * auth.js — Módulo de Autenticación, Roles y Permisos para AdminYAAA
 *
 * Soporta 3 roles estrictamente diferenciados:
 *   - ADMIN: Acceso total (Joaquín, Socios, Ralukita/Carolina - SuperAdmin y Dueña)
 *   - OPERADOR: Acceso a tareas asignadas, clientes designados, presupuestos y logística
 *   - CLIENTE: Portal exclusivo para el cliente (su cuenta corriente, documentos compartidos y pedidos)
 */

import { AppState } from './state.js'
import { toast } from './utils.js'

// ─── Roles del sistema ────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:    'admin',
  OPERADOR: 'operador',
  CLIENTE:  'cliente',
}

// ─── Permisos por módulo ──────────────────────────────────────────────────────
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
    'mayorista',
    'boveda',
  ],
  operador: [
    'tareas',
    'planilla-gastro',
    'presupuestador',
    'presentismo',
    'fondos',
    'mayorista',
  ],
  cliente: [
    'portal-cliente',
  ],
}

// ─── Usuarios de acceso y demostración ────────────────────────────────────────
export const DEMO_USERS = [
  {
    id:                 'u_ralukita',
    nombre:             'Carolina Felipe (Ralukita)',
    email:              'ralukita101@gmail.com',
    password:           'ralukita2026!',
    role:               'admin',
    iniciales:          'CF',
    avatar_color:       'emerald',
    is_owner:           true,
    clientes_asignados: null, // null = acceso a toda la cartera
  },
  {
    id:                 'u1',
    nombre:             'Joaquín Ibáñez',
    email:              'joaquin@adminyaaa.com',
    password:           'admin123',
    role:               'admin',
    iniciales:          'JI',
    avatar_color:       'emerald',
    is_owner:           false,
    clientes_asignados: null,
  },
  {
    id:                 'u2',
    nombre:             'Máximo Ferreyra',
    email:              'maximo@adminyaaa.com',
    password:           'oper123',
    role:               'operador',
    iniciales:          'MF',
    avatar_color:       'blue',
    clientes_asignados: ['c1', 'c2', 'c3'],
  },
  {
    id:                 'u3',
    nombre:             'Carolina Sánchez',
    email:              'carolina@adminyaaa.com',
    password:           'oper123',
    role:               'operador',
    iniciales:          'CS',
    avatar_color:       'violet',
    clientes_asignados: ['c4', 'c5'],
  },
  {
    id:                 'u_cliente_robles',
    nombre:             'Hugo Robles (Parrilla Los Robles)',
    email:              'cliente@losrobles.com.ar',
    password:           'cliente123',
    role:               'cliente',
    iniciales:          'HR',
    avatar_color:       'amber',
    cliente_id:         'c2',
    nombre_comercial:   'Parrilla Los Robles',
  },
  {
    id:                 'u_cliente_maximo',
    nombre:             'Distribuidora Máximo (Contacto)',
    email:              'cliente@distribuidoramaximo.com.ar',
    password:           'cliente123',
    role:               'cliente',
    iniciales:          'DM',
    avatar_color:       'rose',
    cliente_id:         'c4',
    nombre_comercial:   'Distribuidora Máximo',
  },
]

// ─── Constantes internas ──────────────────────────────────────────────────────
const SESSION_KEY = 'ay_session'
const LOGIN_PAGE  = 'auth.html'

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const Auth = {

  /**
   * Intenta iniciar sesión con email + password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} Usuario autenticado
   */
  async login(email, password) {
    await new Promise(r => setTimeout(r, 200))

    const normalized = (email || '').trim().toLowerCase()
    const user = DEMO_USERS.find(
      u => u.email.toLowerCase() === normalized && u.password === password
    )

    if (!user) {
      toast('Credenciales incorrectas. Verificá tu correo y contraseña.', 'error')
      throw new Error('Credenciales inválidas')
    }

    const sessionUser = { ...user }
    delete sessionUser.password

    Auth.setSession(sessionUser)

    try {
      if (AppState && typeof AppState.set === 'function') {
        AppState.set('currentUser', sessionUser)
      }
    } catch (_) {}

    toast(`Bienvenido/a, ${sessionUser.nombre.split(' ')[0]} 👋`, 'success')
    return sessionUser
  },

  /**
   * Cierra la sesión actual y redirige a la pantalla de login.
   */
  logout() {
    const user = Auth.currentUser()
    Auth.clearSession()

    try {
      if (AppState && typeof AppState.set === 'function') {
        AppState.set('currentUser', null)
      }
    } catch (_) {}

    toast(`Hasta pronto, ${user?.nombre?.split(' ')[0] || ''}`, 'info')

    setTimeout(() => {
      window.location.href = LOGIN_PAGE
    }, 400)
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
   * Requiere sesión activa; redirige a auth.html si no está autenticado.
   * @returns {object} Usuario actual
   */
  requireAuth() {
    const user = Auth.getSession()
    if (!user) {
      window.location.href = LOGIN_PAGE
      throw new Error('No autenticado')
    }
    return user
  },

  /**
   * Requiere rol admin; muestra toast y bloquea si no tiene permisos.
   * @returns {object}
   */
  requireAdmin() {
    const user = Auth.requireAuth()
    if (user.role !== ROLES.ADMIN) {
      toast('Acceso restringido a administradores.', 'error')
      setTimeout(() => {
        window.location.hash = user.role === ROLES.CLIENTE ? '#/portal-cliente' : '#/tareas'
      }, 500)
      throw new Error('Permisos insuficientes')
    }
    return user
  },

  isAdmin() {
    return Auth.currentUser()?.role === ROLES.ADMIN
  },

  isOperador() {
    return Auth.currentUser()?.role === ROLES.OPERADOR
  },

  isCliente() {
    return Auth.currentUser()?.role === ROLES.CLIENTE
  },

  isOwner() {
    const u = Auth.currentUser()
    return u?.role === ROLES.ADMIN && (u.is_owner === true || u.email === 'ralukita101@gmail.com')
  },

  currentUser() {
    return Auth.getSession()
  },

  /**
   * Valida si el rol del usuario puede acceder a un módulo específico.
   * @param {string} module
   * @param {string|null} [clienteId]
   * @returns {boolean}
   */
  canAccess(module, clienteId = null) {
    const user = Auth.currentUser()
    if (!user) return false

    const allowedModules = PERMISSIONS[user.role] ?? []
    if (!allowedModules.includes(module)) return false

    if (user.role === ROLES.ADMIN) return true

    if (user.role === ROLES.CLIENTE) {
      return module === 'portal-cliente'
    }

    if (clienteId && user.clientes_asignados !== null) {
      return Array.isArray(user.clientes_asignados)
        ? user.clientes_asignados.includes(clienteId)
        : true
    }

    return true
  },
}

export function initAuth(requiredRole = 'any') {
  if (requiredRole === 'admin') {
    return Auth.requireAdmin()
  }
  return Auth.requireAuth()
}

export default Auth
