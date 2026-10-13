/**
 * sidebar.js — Componente de barra lateral para AdminYAAA
 *
 * Navegación dinámica con control estricto de roles:
 *   - Admin (Ralukita / Joaquín): Acceso total a finanzas, bóveda de claves y mayorista
 *   - Operador (Máximo): Tareas, planilla gastro, presupuestos y logística mayorista
 *   - Cliente (Hugo Robles / PyMEs): Portal exclusivo de cliente y cuenta corriente
 */

import { Auth, PERMISSIONS, DEMO_USERS, ROLES } from '../core/auth.js'
import { Router } from '../core/router.js'
import { AppState } from '../core/state.js'

const NAV_ITEMS = [
  // ─── GENERAL / ADMIN ────────────────────────────────────────────────────────
  {
    id:    'dashboard',
    label: 'Dashboard Principal',
    route: '#/dashboard',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    adminOnly: true,
  },
  {
    id:    'clientes',
    label: 'Cartera de Clientes',
    route: '#/clientes',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3m4-3v3m4-3v3"/></svg>`,
  },
  {
    id:    'tareas',
    label: 'Registro de Tareas',
    route: '#/tareas',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
  },

  // ─── OPERACIONES ESPECIALES ─────────────────────────────────────────────────
  {
    id:    'planilla-gastro',
    label: 'Planilla Gastronómica',
    route: '#/planilla-gastro',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
  },
  {
    id:    'presupuestador',
    label: 'Presupuestador & Depósito',
    route: '#/presupuestador',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/><path stroke-linecap="round" stroke-linejoin="round" d="M14 17l1.5 1.5L18 16"/></svg>`,
  },
  {
    id:    'cuentas-corrientes',
    label: 'Cuentas Corrientes',
    route: '#/cuentas-corrientes',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  },

  // ─── MÓDULO MAYORISTA INTEGRADO ─────────────────────────────────────────────
  {
    id:    'mayorista',
    label: 'Gestión Mayorista',
    route: '#/mayorista',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`,
  },

  // ─── PORTAL CLIENTE (EXCLUSIVO CLIENTE) ─────────────────────────────────────
  {
    id:    'portal-cliente',
    label: 'Portal Mi Empresa',
    route: '#/portal-cliente',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
  },

  // ─── BÓVEDA CONFIDENCIAL (SOLO ADMIN / RALUKITA) ────────────────────────────
  {
    id:    'boveda',
    label: 'Bóveda de Claves',
    route: '#/boveda',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`,
    adminOnly: true,
  },

  // ─── PERSONAS & EQUIPO ──────────────────────────────────────────────────────
  {
    id:    'alianzas',
    label: 'Alianzas Contables',
    route: '#/alianzas',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>`,
    adminOnly: true,
  },
  {
    id:    'sueldos',
    label: 'Sueldos & RRHH',
    route: '#/sueldos',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
    operadorSelf: true,
  },
  {
    id:    'fondos',
    label: 'Fondos y Cajas Chicas',
    route: '#/fondos',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,
  },
  {
    id:    'presentismo',
    label: 'Presentismo',
    route: '#/presentismo',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 16l2 2 4-4"/></svg>`,
  },

  // ─── FINANZAS & CONTROL EJECUTIVO (ADMIN) ──────────────────────────────────
  {
    id:    'gastos',
    label: 'Gastos Operativos',
    route: '#/gastos',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>`,
    adminOnly: true,
  },
  {
    id:    'socios',
    label: 'Finanzas de Socios',
    route: '#/socios',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
    adminOnly: true,
  },
  {
    id:    'cobranzas',
    label: 'Cobranzas & Morosidad',
    route: '#/cobranzas',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    adminOnly: true,
  },
  {
    id:    'tesoreria',
    label: 'Tesorería & Cuentas',
    route: '#/tesoreria',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,
    adminOnly: true,
  },
  {
    id:    'configuracion',
    label: 'Configuración',
    route: '#/configuracion',
    icon:  `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    adminOnly: true,
  },
]

const SECTIONS = [
  {
    label: 'General',
    ids:   ['dashboard', 'portal-cliente', 'clientes', 'tareas'],
  },
  {
    label: 'Operaciones & Distribución',
    ids:   ['planilla-gastro', 'presupuestador', 'cuentas-corrientes', 'mayorista'],
  },
  {
    label: 'Equipo & Caja',
    ids:   ['alianzas', 'sueldos', 'fondos', 'presentismo'],
  },
  {
    label: 'Finanzas & Seguridad',
    ids:   ['gastos', 'socios', 'cobranzas', 'tesoreria', 'boveda'],
  },
  {
    label: 'Sistema',
    ids:   ['configuracion'],
  },
]

function _canSeeItem(item, user) {
  if (!user) return false
  const allowed = PERMISSIONS[user.role] ?? []
  return allowed.includes(item.id)
}

function _buildSection(section, user, currentRoute) {
  const items = section.ids
    .map(id => NAV_ITEMS.find(n => n.id === id))
    .filter(item => item && _canSeeItem(item, user))

  if (items.length === 0) return ''

  const links = items.map(item => {
    const isActive = currentRoute === item.route || currentRoute.startsWith(item.route + '?')
    const activeClass = isActive
      ? 'bg-slate-800 text-emerald-400 font-bold border-l-2 border-emerald-500'
      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'

    return `
      <a href="${item.route}"
         class="nav-link flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer ${activeClass}"
         data-route="${item.id}"
         aria-current="${isActive ? 'page' : 'false'}">
        <span class="flex-shrink-0 w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}">${item.icon}</span>
        <span class="truncate">${item.label}</span>
        ${isActive ? '<span class="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>' : ''}
      </a>`
  }).join('')

  return `
    <div class="sidebar-section mb-2">
      <p class="px-3 mb-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 select-none">
        ${section.label}
      </p>
      <nav class="space-y-0.5">${links}</nav>
    </div>`
}

export function buildSidebar() {
  const sidebar = document.getElementById('ay-sidebar')
  if (!sidebar) return

  const user = Auth.currentUser()
  const currentRoute = window.location.hash || '#/dashboard'

  const sectionsHtml = SECTIONS
    .map(sec => _buildSection(sec, user, currentRoute))
    .filter(Boolean)
    .join('')

  sidebar.innerHTML = `
    <div class="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100 w-64">
      <!-- Brand Header -->
      <div class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
        <a href="#/dashboard" class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white shadow-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
          </div>
          <div>
            <div class="font-extrabold text-sm tracking-tight leading-tight">Admin<span class="text-emerald-400">YAAA</span></div>
            <div class="text-[10px] text-slate-400 font-medium">Gestión &bull; Mayorista</div>
          </div>
        </a>
        <button id="ay-sidebar-close" class="lg:hidden p-1 text-slate-400 hover:text-white rounded" aria-label="Cerrar menú">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 overflow-y-auto px-2 py-3 custom-scrollbar">
        ${sectionsHtml}
      </div>

      <!-- User Info & Switcher Footer -->
      <div class="p-3 border-t border-slate-800 bg-slate-950/60 text-xs">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2 overflow-hidden">
            <div class="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              ${user?.iniciales || 'U'}
            </div>
            <div class="truncate">
              <div class="font-semibold text-slate-200 truncate text-[11px]">${escHtml(user?.nombre || 'Usuario')}</div>
              <div class="text-[10px] text-slate-400 capitalize">${escHtml(user?.role || 'operador')}</div>
            </div>
          </div>
          <button id="ay-logout-btn" class="p-1 text-slate-400 hover:text-rose-400 transition" title="Cerrar Sesión">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>

        <!-- Role Switcher Rápido (Demo) -->
        <div class="pt-2 border-t border-slate-800/80">
          <label class="block text-[9px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Simular Vista Como:</label>
          <select id="ay-role-switcher" class="w-full bg-slate-800 border border-slate-700 rounded py-1 px-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-emerald-500">
            ${DEMO_USERS.map(u => `
              <option value="${u.id}" ${u.id === user?.id ? 'selected' : ''}>
                ${escHtml(u.nombre)} (${escHtml(u.role)})
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    </div>
  `

  _attachEvents()
}

function _attachEvents() {
  document.getElementById('ay-logout-btn')?.addEventListener('click', () => Auth.logout())
  document.getElementById('ay-sidebar-close')?.addEventListener('click', () => closeSidebar())

  document.getElementById('ay-role-switcher')?.addEventListener('change', (e) => {
    const target = DEMO_USERS.find(u => u.id === e.target.value)
    if (target) {
      const sessionUser = { ...target }
      delete sessionUser.password
      Auth.setSession(sessionUser)
      // Redirigir según el rol
      if (sessionUser.role === ROLES.CLIENTE) {
        window.location.hash = '#/portal-cliente'
      } else if (sessionUser.role === ROLES.OPERADOR) {
        window.location.hash = '#/tareas'
      } else {
        window.location.hash = '#/dashboard'
      }
      window.location.reload()
    }
  })
}

export function updateSidebarUser() {
  buildSidebar()
}

export function toggleSidebar() {
  const sidebar = document.getElementById('ay-sidebar')
  sidebar?.classList.toggle('hidden')
}

export function closeSidebar() {
  const sidebar = document.getElementById('ay-sidebar')
  sidebar?.classList.add('hidden')
}
