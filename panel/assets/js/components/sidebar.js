/**
 * sidebar.js — Componente de barra lateral para AdminYAAA
 * Renderiza la navegación principal, info de usuario y switcher de rol demo.
 */

import { Auth, PERMISSIONS, DEMO_USERS, ROLES } from '../core/auth.js'
import { Router }   from '../core/router.js'
import { AppState } from '../core/state.js'

// ─── Definición de módulos de navegación ──────────────────────────────────────

/** @typedef {{ id:string, label:string, route:string, icon:string, adminOnly?:boolean, operadorSelf?:boolean }} NavItem */

/** @type {NavItem[]} */
const NAV_ITEMS = [
  {
    id:    'dashboard',
    label: 'Dashboard',
    route: '/panel/dashboard.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>`,
    adminOnly: true,
  },
  {
    id:    'clientes',
    label: 'Clientes',
    route: '/panel/clientes.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3m4-3v3m4-3v3"/>
            </svg>`,
  },
  {
    id:    'tareas',
    label: 'Tareas',
    route: '/panel/tareas.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>`,
  },
  {
    id:    'planilla-gastro',
    label: 'Planilla Gastronómica',
    route: '/panel/planilla-gastro.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>`,
  },
  {
    id:    'presupuestador',
    label: 'Presupuestador',
    route: '/panel/presupuestador.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
              <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/>
              <line x1="8" y1="14" x2="12" y2="14"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 17l1.5 1.5L18 16"/>
            </svg>`,
  },
  {
    id:    'cuentas-corrientes',
    label: 'Cuentas Corrientes',
    route: '/panel/cuentas-corrientes.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>`,
  },
  {
    id:    'alianzas',
    label: 'Alianzas',
    route: '/panel/alianzas.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>`,
    adminOnly: true,
  },
  {
    id:    'sueldos',
    label: 'Sueldos & RRHH',
    route: '/panel/sueldos.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>`,
    operadorSelf: true,
  },
  {
    id:    'fondos',
    label: 'Fondos y Cajas',
    route: '/panel/fondos.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>`,
  },
  {
    id:    'presentismo',
    label: 'Presentismo',
    route: '/panel/presentismo.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 16l2 2 4-4"/>
            </svg>`,
  },
  {
    id:    'gastos',
    label: 'Gastos Operativos',
    route: '/panel/gastos.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>`,
    adminOnly: true,
  },
  {
    id:    'socios',
    label: 'Finanzas de Socios',
    route: '/panel/socios.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>`,
    adminOnly: true,
  },
  {
    id:    'cobranzas',
    label: 'Cobranzas',
    route: '/panel/cobranzas.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>`,
    adminOnly: true,
  },
  {
    id:    'tesoreria',
    label: 'Tesorería',
    route: '/panel/tesoreria.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4"/>
            </svg>`,
    adminOnly: true,
  },
  {
    id:    'configuracion',
    label: 'Configuración',
    route: '/panel/configuracion.html',
    icon:  `<svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>`,
  },
]

// ─── Secciones de navegación ──────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'General',
    ids:   ['dashboard', 'clientes', 'tareas'],
  },
  {
    label: 'Operaciones',
    ids:   ['planilla-gastro', 'presupuestador', 'cuentas-corrientes', 'alianzas'],
  },
  {
    label: 'Personas & Caja',
    ids:   ['sueldos', 'fondos', 'presentismo', 'gastos'],
  },
  {
    label: 'Finanzas',
    ids:   ['socios', 'cobranzas', 'tesoreria'],
  },
  {
    label: 'Sistema',
    ids:   ['configuracion'],
  },
]

// ─── Colores de avatar por usuario ────────────────────────────────────────────

const AVATAR_COLORS = {
  emerald: 'bg-emerald-500 text-white',
  blue:    'bg-blue-500 text-white',
  violet:  'bg-violet-500 text-white',
  amber:   'bg-amber-500 text-white',
  rose:    'bg-rose-500 text-white',
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Determina si el ítem de nav es visible para el usuario actual.
 * @param {NavItem} item
 * @param {object} user
 * @returns {boolean}
 */
function _canSeeItem(item, user) {
  if (!user) return false
  const allowed = PERMISSIONS[user.role] ?? []
  return allowed.includes(item.id)
}

/**
 * Construye el HTML de una sección de navegación.
 * @param {{ label:string, ids:string[] }} section
 * @param {object} user
 * @param {string} currentRoute
 * @returns {string}
 */
function _buildSection(section, user, currentRoute) {
  const items = section.ids
    .map(id => NAV_ITEMS.find(n => n.id === id))
    .filter(item => item && _canSeeItem(item, user))

  if (items.length === 0) return ''

  const links = items.map(item => {
    const isActive = currentRoute.includes(item.id)
    const activeClass = isActive
      ? 'bg-slate-700 text-emerald-400'
      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/60'

    return `
      <a href="${item.route}"
         class="nav-link flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer ${activeClass}"
         data-route="${item.route}"
         aria-current="${isActive ? 'page' : 'false'}">
        <span class="flex-shrink-0 w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}">${item.icon}</span>
        <span class="truncate">${item.label}</span>
        ${isActive ? '<span class="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>' : ''}
      </a>`
  }).join('')

  return `
    <div class="sidebar-section mb-1">
      <p class="px-3 mb-1 text-[10px] font-semibold tracking-widest uppercase text-slate-500 select-none">
        ${section.label}
      </p>
      <nav class="space-y-0.5">${links}</nav>
    </div>`
}

/**
 * Construye el badge de rol.
 * @param {string} role
 * @returns {string}
 */
function _roleBadge(role) {
  const map = {
    admin:    { label: 'Admin',    cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    operador: { label: 'Operador', cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  }
  const { label, cls } = map[role] ?? { label: role, cls: 'bg-slate-700 text-slate-400' }
  return `<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded ${cls}">${label}</span>`
}

/**
 * Construye el switcher de roles (sólo para admin en modo demo).
 * @param {object} currentUser
 * @returns {string}
 */
function _buildRoleSwitcher(currentUser) {
  if (currentUser.role !== ROLES.ADMIN) return ''

  const options = DEMO_USERS.map(u => {
    const selected = u.id === currentUser.id ? 'selected' : ''
    return `<option value="${u.id}" ${selected}>${u.nombre} (${u.role})</option>`
  }).join('')

  return `
    <div class="px-3 pb-2">
      <p class="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-semibold">Vista demo como:</p>
      <div class="relative">
        <select id="ay-role-switcher"
                class="w-full text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-md py-1.5 pl-2 pr-7 appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer">
          ${options}
        </select>
        <svg class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500"
             xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </div>`
}

// ─── Estilos inline para svg de iconos de nav ─────────────────────────────────

function _injectNavIconStyles() {
  if (document.getElementById('ay-nav-icon-styles')) return
  const style = document.createElement('style')
  style.id = 'ay-nav-icon-styles'
  style.textContent = `.nav-icon { width: 1.25rem; height: 1.25rem; }`
  document.head.appendChild(style)
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Renderiza el sidebar completo dentro del elemento #ay-sidebar.
 * Debe llamarse tras DOMContentLoaded.
 */
export function buildSidebar() {
  const container = document.getElementById('ay-sidebar')
  if (!container) return

  _injectNavIconStyles()

  const user = Auth.currentUser()
  if (!user) return

  const currentRoute = window.location.pathname

  const sections = NAV_SECTIONS.map(s => _buildSection(s, user, currentRoute)).join('')
  const avatarColor = AVATAR_COLORS[user.avatar_color] ?? 'bg-slate-600 text-white'

  container.innerHTML = `
    <!-- Encabezado / Brand -->
    <div class="flex items-center justify-between h-14 px-4 border-b border-slate-700/60 flex-shrink-0">
      <a href="/panel/dashboard.html" class="flex items-center gap-2 select-none" title="AdminYAAA">
        <span class="text-lg font-bold tracking-tight text-white">Admin<span class="text-emerald-400">YAAA</span></span>
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
      </a>
      <!-- Botón cerrar sidebar en mobile -->
      <button id="ay-sidebar-close"
              class="lg:hidden p-1 text-slate-400 hover:text-slate-100 rounded transition-colors"
              aria-label="Cerrar menú">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Navegación con scroll -->
    <div class="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
      ${sections}
    </div>

    <!-- Footer: switcher demo + usuario -->
    <div class="flex-shrink-0 border-t border-slate-700/60 pt-2">

      <!-- Role switcher (solo admin) -->
      ${_buildRoleSwitcher(user)}

      <!-- Info de usuario -->
      <div id="ay-sidebar-user" class="flex items-center gap-3 px-3 py-3">
        <!-- Avatar con iniciales -->
        <div class="w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-xs font-bold flex-shrink-0 select-none">
          ${user.iniciales}
        </div>
        <!-- Nombre y rol -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-100 truncate leading-tight">${user.nombre}</p>
          <div class="mt-0.5">${_roleBadge(user.role)}</div>
        </div>
        <!-- Botón logout -->
        <button id="ay-logout-btn"
                class="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors flex-shrink-0"
                title="Cerrar sesión">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </div>`

  _attachSidebarEvents()
}

/**
 * Actualiza únicamente el bloque de usuario en el footer del sidebar.
 * Útil cuando cambia el usuario (ej: role switcher demo).
 */
export function updateSidebarUser() {
  const user = Auth.currentUser()
  if (!user) return

  const el = document.getElementById('ay-sidebar-user')
  if (!el) return

  const avatarColor = AVATAR_COLORS[user.avatar_color] ?? 'bg-slate-600 text-white'
  el.innerHTML = `
    <div class="w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-xs font-bold flex-shrink-0 select-none">
      ${user.iniciales}
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-slate-100 truncate leading-tight">${user.nombre}</p>
      <div class="mt-0.5">${_roleBadge(user.role)}</div>
    </div>
    <button id="ay-logout-btn"
            class="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors flex-shrink-0"
            title="Cerrar sesión">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
      </svg>
    </button>`

  // Re-attach logout listener
  document.getElementById('ay-logout-btn')?.addEventListener('click', () => Auth.logout())
}

/**
 * Abre el sidebar en mobile (agrega clase de visibilidad).
 */
export function toggleSidebar() {
  const sidebar = document.getElementById('ay-sidebar')
  const overlay = document.getElementById('ay-sidebar-overlay')
  if (!sidebar) return

  const isOpen = sidebar.classList.contains('translate-x-0')
  if (isOpen) {
    closeSidebar()
  } else {
    sidebar.classList.remove('-translate-x-full')
    sidebar.classList.add('translate-x-0')
    overlay?.classList.remove('hidden')
    document.body.classList.add('overflow-hidden')
  }
}

/**
 * Cierra el sidebar en mobile.
 */
export function closeSidebar() {
  const sidebar = document.getElementById('ay-sidebar')
  const overlay = document.getElementById('ay-sidebar-overlay')
  if (!sidebar) return

  sidebar.classList.add('-translate-x-full')
  sidebar.classList.remove('translate-x-0')
  overlay?.classList.add('hidden')
  document.body.classList.remove('overflow-hidden')
}

// ─── Eventos internos ─────────────────────────────────────────────────────────

function _attachSidebarEvents() {
  // Logout
  document.getElementById('ay-logout-btn')?.addEventListener('click', () => Auth.logout())

  // Cerrar sidebar mobile desde botón X
  document.getElementById('ay-sidebar-close')?.addEventListener('click', () => closeSidebar())

  // Role switcher demo (solo admin)
  const switcher = document.getElementById('ay-role-switcher')
  if (switcher) {
    switcher.addEventListener('change', (e) => {
      const targetId = e.target.value
      const targetUser = DEMO_USERS.find(u => u.id === targetId)
      if (!targetUser) return

      const sessionUser = { ...targetUser }
      delete sessionUser.password
      Auth.setSession(sessionUser)

      // Rebuild sidebar con nuevo usuario
      buildSidebar()
      updateSidebarUser()

      // Emitir evento personalizado para que el resto de la app reaccione
      window.dispatchEvent(new CustomEvent('ay:user-changed', { detail: sessionUser }))
    })
  }

  // Links de navegación: cerrar sidebar en mobile al navegar
  document.querySelectorAll('#ay-sidebar .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) closeSidebar()
    })
  })
}
