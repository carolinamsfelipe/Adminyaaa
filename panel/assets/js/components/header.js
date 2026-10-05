/**
 * header.js — Componente de cabecera para AdminYAAA
 * Renderiza breadcrumb, búsqueda global, notificaciones y avatar de usuario.
 */

import { Auth }      from '../core/auth.js'
import { toggleSidebar } from './sidebar.js'

// ─── Estado interno del buscador ──────────────────────────────────────────────

let _searchOpen   = false
let _searchTimer  = null

// ─── Datos de búsqueda en demo (reemplazar con Supabase en prod) ──────────────

const SEARCH_DEMO_DATA = [
  { type: 'cliente',  label: 'La Birreria del Centro',  route: '/panel/clientes.html?id=c1',  icon: '🏢' },
  { type: 'cliente',  label: 'Parrilla Los Robles',     route: '/panel/clientes.html?id=c2',  icon: '🏢' },
  { type: 'cliente',  label: 'Café & Resto El Portal',  route: '/panel/clientes.html?id=c3',  icon: '🏢' },
  { type: 'tarea',    label: 'Presentar DDJJ Julio',    route: '/panel/tareas.html?id=t1',    icon: '✅' },
  { type: 'tarea',    label: 'Liquidar sueldos Agosto', route: '/panel/tareas.html?id=t2',    icon: '✅' },
  { type: 'tarea',    label: 'Renovar inscripción AFIP',route: '/panel/tareas.html?id=t3',    icon: '✅' },
  { type: 'factura',  label: 'FC 001-00001234',         route: '/panel/cuentas-corrientes.html?id=f1', icon: '📄' },
  { type: 'factura',  label: 'FC 001-00001235',         route: '/panel/cuentas-corrientes.html?id=f2', icon: '📄' },
]

const RECENT_KEY = 'ay_recent_searches'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Devuelve la fecha actual formateada en DD/MM/AAAA */
function _formatDate(date = new Date()) {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

/** Devuelve el día de la semana en español */
function _dayName(date = new Date()) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return days[date.getDay()]
}

/** Lee ítems recientes de localStorage */
function _getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]').slice(0, 5)
  } catch {
    return []
  }
}

/** Guarda ítem en recientes */
function _saveRecentSearch(item) {
  try {
    const recents = _getRecentSearches().filter(r => r.route !== item.route)
    recents.unshift(item)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, 8)))
  } catch {}
}

/** Filtra resultados por query */
function _searchItems(query) {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return SEARCH_DEMO_DATA.filter(item =>
    item.label.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)
  ).slice(0, 8)
}

/** Construye HTML de un resultado de búsqueda */
function _buildResultItem(item, isRecent = false) {
  const typeLabel = {
    cliente: 'Cliente',
    tarea:   'Tarea',
    factura: 'Factura',
  }[item.type] ?? item.type

  const typeCls = {
    cliente: 'bg-blue-500/15 text-blue-400',
    tarea:   'bg-emerald-500/15 text-emerald-400',
    factura: 'bg-amber-500/15 text-amber-400',
  }[item.type] ?? 'bg-slate-700 text-slate-400'

  return `
    <a href="${item.route}"
       class="search-result-item flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/60 cursor-pointer transition-colors rounded-md"
       data-route="${item.route}"
       data-label="${item.label}"
       data-type="${item.type}"
       data-icon="${item.icon}">
      <span class="text-lg leading-none flex-shrink-0">${item.icon}</span>
      <span class="flex-1 min-w-0 text-sm text-slate-200 truncate">${item.label}</span>
      <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeCls}">${typeLabel}</span>
      ${isRecent ? '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' : ''}
    </a>`
}

/** Colores de avatar por usuario */
const AVATAR_COLORS = {
  emerald: 'bg-emerald-500',
  blue:    'bg-blue-500',
  violet:  'bg-violet-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
}

// ─── Construcción del HTML ────────────────────────────────────────────────────

/**
 * Renderiza el header completo dentro del elemento #ay-header.
 * Debe llamarse tras DOMContentLoaded.
 */
export function buildHeader() {
  const container = document.getElementById('ay-header')
  if (!container) return

  const user        = Auth.currentUser()
  const today       = new Date()
  const dateStr     = _formatDate(today)
  const dayStr      = _dayName(today)
  const avatarColor = AVATAR_COLORS[user?.avatar_color] ?? 'bg-slate-600'
  const initials    = user?.iniciales ?? '?'
  const userName    = user?.nombre ?? 'Usuario'

  container.innerHTML = `
    <!-- Header principal -->
    <header class="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 flex items-center gap-3 px-4 flex-shrink-0 z-20">

      <!-- Hamburger (mobile) -->
      <button id="ay-hamburger"
              class="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-md transition-colors flex-shrink-0"
              aria-label="Abrir menú">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <!-- Breadcrumb -->
      <nav id="ay-breadcrumb" class="flex items-center gap-1.5 flex-1 min-w-0 text-sm" aria-label="Breadcrumb">
        <span class="text-slate-400 dark:text-slate-500 font-medium truncate">Cargando…</span>
      </nav>

      <!-- Espaciado flexible -->
      <div class="flex-1 hidden md:block"></div>

      <!-- Barra de búsqueda (desktop trigger) -->
      <button id="ay-search-trigger"
              class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-400 text-sm rounded-lg hover:border-emerald-400 transition-colors group w-52"
              title="Buscar (Ctrl+K)">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <span class="flex-1 text-left">Buscar…</span>
        <kbd class="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-600 text-slate-500 rounded">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>

      <!-- Fecha actual -->
      <div class="hidden lg:flex flex-col items-end leading-tight flex-shrink-0">
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">${dateStr}</span>
        <span class="text-[10px] text-slate-400">${dayStr}</span>
      </div>

      <!-- Notificaciones -->
      <div class="relative flex-shrink-0">
        <button id="ay-notif-btn"
                class="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-md transition-colors relative"
                aria-label="Notificaciones">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span id="ay-notif-badge"
                class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none hidden">
            3
          </span>
        </button>

        <!-- Dropdown notificaciones -->
        <div id="ay-notif-dropdown"
             class="hidden absolute right-0 top-full mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100">Alertas</h3>
            <button id="ay-notif-clear" class="text-xs text-emerald-500 hover:underline">Limpiar todo</button>
          </div>
          <div id="ay-notif-list" class="py-1 max-h-64 overflow-y-auto">
            <div class="px-4 py-3 flex gap-3 items-start hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span class="text-base mt-0.5">🔴</span>
              <div>
                <p class="text-xs font-medium text-slate-700 dark:text-slate-200">3 tareas vencidas hoy</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Hace 10 min</p>
              </div>
            </div>
            <div class="px-4 py-3 flex gap-3 items-start hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span class="text-base mt-0.5">🟡</span>
              <div>
                <p class="text-xs font-medium text-slate-700 dark:text-slate-200">Vencimiento de contrato próximo</p>
                <p class="text-[10px] text-slate-400 mt-0.5">La Birreria del Centro — 5 días</p>
              </div>
            </div>
            <div class="px-4 py-3 flex gap-3 items-start hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span class="text-base mt-0.5">💰</span>
              <div>
                <p class="text-xs font-medium text-slate-700 dark:text-slate-200">Saldo de caja bajo en sucursal Centro</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Hace 1 hora</p>
              </div>
            </div>
          </div>
          <div class="px-4 py-2 border-t border-slate-100 dark:border-slate-700">
            <a href="/panel/tareas.html" class="text-xs text-emerald-500 hover:underline">Ver todas las tareas →</a>
          </div>
        </div>
      </div>

      <!-- Avatar / dropdown usuario -->
      <div class="relative flex-shrink-0">
        <button id="ay-user-menu-btn"
                class="flex items-center gap-2 pl-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                aria-label="Menú de usuario">
          <div class="w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-[11px] font-bold text-white select-none">
            ${initials}
          </div>
          <span class="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
            ${userName.split(' ')[0]}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-slate-400 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <!-- Dropdown usuario -->
        <div id="ay-user-dropdown"
             class="hidden absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">${userName}</p>
            <p class="text-xs text-slate-400 truncate">${user?.email ?? ''}</p>
          </div>
          <a href="/panel/configuracion.html"
             class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Configuración
          </a>
          <button id="ay-header-logout"
                  class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>

    <!-- Search overlay (full-screen) -->
    <div id="ay-search-overlay"
         class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] hidden flex items-start justify-center pt-20 px-4"
         role="dialog" aria-modal="true" aria-label="Búsqueda global">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <!-- Input de búsqueda -->
        <div class="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input id="ay-search-input"
                 type="text"
                 placeholder="Buscar clientes, tareas, facturas…"
                 class="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                 autocomplete="off"
                 spellcheck="false"/>
          <kbd class="px-2 py-1 text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-400 rounded">Esc</kbd>
        </div>
        <!-- Resultados -->
        <div id="ay-search-results" class="py-2 max-h-80 overflow-y-auto">
          <p class="px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Búsquedas recientes</p>
          <div id="ay-search-results-list" class="px-2"></div>
        </div>
        <!-- Footer del buscador -->
        <div class="border-t border-slate-100 dark:border-slate-700 px-4 py-2 flex items-center gap-4 text-[10px] text-slate-400">
          <span><kbd class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">↵</kbd> Ir</span>
          <span><kbd class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">↑↓</kbd> Navegar</span>
          <span><kbd class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">Esc</kbd> Cerrar</span>
        </div>
      </div>
    </div>`

  _attachHeaderEvents()
  _showNotifBadge()
}

// ─── Actualización de breadcrumb ──────────────────────────────────────────────

/**
 * Actualiza el breadcrumb del header.
 * @param {{ label: string, route?: string }[]} items
 */
export function updateBreadcrumb(items = []) {
  const nav = document.getElementById('ay-breadcrumb')
  if (!nav) return

  if (!items.length) {
    nav.innerHTML = '<span class="text-slate-400 text-sm">Panel</span>'
    return
  }

  const homeLink = `
    <a href="/panel/dashboard.html" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
    </a>`

  const separator = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
    </svg>`

  const crumbs = items.map((item, i) => {
    const isLast = i === items.length - 1
    if (isLast) {
      return `<span class="text-sm font-semibold text-slate-700 dark:text-slate-100 truncate">${item.label}</span>`
    }
    return `
      <a href="${item.route ?? '#'}" class="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors truncate">
        ${item.label}
      </a>`
  }).join(separator)

  nav.innerHTML = homeLink + separator + crumbs
}

// ─── Búsqueda global ──────────────────────────────────────────────────────────

/**
 * Abre o cierra la búsqueda global.
 */
export function toggleGlobalSearch() {
  _searchOpen ? _closeSearch() : _openSearch()
}

function _openSearch() {
  const overlay = document.getElementById('ay-search-overlay')
  const input   = document.getElementById('ay-search-input')
  if (!overlay) return

  _searchOpen = true
  overlay.classList.remove('hidden')
  overlay.classList.add('flex')
  requestAnimationFrame(() => input?.focus())
  _renderSearchResults('')
}

function _closeSearch() {
  const overlay = document.getElementById('ay-search-overlay')
  if (!overlay) return

  _searchOpen = false
  overlay.classList.add('hidden')
  overlay.classList.remove('flex')

  const input = document.getElementById('ay-search-input')
  if (input) input.value = ''
}

/**
 * Renderiza los resultados en el panel de búsqueda.
 * @param {string} query
 */
function _renderSearchResults(query) {
  const list  = document.getElementById('ay-search-results-list')
  const label = document.querySelector('#ay-search-results > p')
  if (!list) return

  const trimmed = query.trim()

  if (!trimmed) {
    // Mostrar recientes
    if (label) label.textContent = 'Búsquedas recientes'
    const recents = _getRecentSearches()
    if (!recents.length) {
      list.innerHTML = `<p class="px-4 py-6 text-center text-sm text-slate-400">Sin búsquedas recientes</p>`
      return
    }
    list.innerHTML = recents.map(r => _buildResultItem(r, true)).join('')
  } else {
    // Mostrar resultados filtrados
    if (label) label.textContent = 'Resultados'
    const results = _searchItems(trimmed)
    if (!results.length) {
      list.innerHTML = `
        <div class="px-4 py-8 text-center">
          <p class="text-sm text-slate-400">Sin resultados para "<strong>${trimmed}</strong>"</p>
        </div>`
      return
    }
    list.innerHTML = results.map(r => _buildResultItem(r)).join('')
  }

  // Adjuntar listeners a resultados
  list.querySelectorAll('.search-result-item').forEach(el => {
    el.addEventListener('click', (e) => {
      const item = {
        route: el.dataset.route,
        label: el.dataset.label,
        type:  el.dataset.type,
        icon:  el.dataset.icon,
      }
      _saveRecentSearch(item)
      _closeSearch()
    })
  })
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

function _showNotifBadge() {
  const badge = document.getElementById('ay-notif-badge')
  if (badge) badge.classList.remove('hidden')
}

// ─── Eventos del header ───────────────────────────────────────────────────────

function _attachHeaderEvents() {
  // Hamburger mobile
  document.getElementById('ay-hamburger')?.addEventListener('click', () => toggleSidebar())

  // Trigger búsqueda (desktop)
  document.getElementById('ay-search-trigger')?.addEventListener('click', () => _openSearch())

  // Overlay: clic en fondo cierra
  const overlay = document.getElementById('ay-search-overlay')
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) _closeSearch()
  })

  // Input de búsqueda
  const searchInput = document.getElementById('ay-search-input')
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(_searchTimer)
    _searchTimer = setTimeout(() => _renderSearchResults(e.target.value), 200)
  })

  // Navegación con teclado en resultados de búsqueda
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      _closeSearch()
      return
    }
    if (e.key === 'Enter') {
      const first = document.querySelector('#ay-search-results-list .search-result-item')
      if (first) first.click()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const items = [...document.querySelectorAll('#ay-search-results-list .search-result-item')]
      if (!items.length) return
      const focused = document.activeElement
      const idx = items.indexOf(focused)
      if (e.key === 'ArrowDown') {
        const next = items[idx + 1] ?? items[0]
        next?.focus()
      } else {
        const prev = items[idx - 1] ?? items[items.length - 1]
        prev?.focus()
      }
    }
  })

  // Atajo de teclado global Ctrl+K / Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      toggleGlobalSearch()
    }
    if (e.key === 'Escape' && _searchOpen) {
      _closeSearch()
    }
  })

  // Notificaciones dropdown toggle
  const notifBtn = document.getElementById('ay-notif-btn')
  const notifDd  = document.getElementById('ay-notif-dropdown')
  notifBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    notifDd?.classList.toggle('hidden')
    // Cerrar user dropdown si está abierto
    document.getElementById('ay-user-dropdown')?.classList.add('hidden')
  })

  // Limpiar notificaciones
  document.getElementById('ay-notif-clear')?.addEventListener('click', () => {
    const list  = document.getElementById('ay-notif-list')
    const badge = document.getElementById('ay-notif-badge')
    if (list) list.innerHTML = '<p class="px-4 py-4 text-center text-sm text-slate-400">Sin alertas pendientes</p>'
    badge?.classList.add('hidden')
    notifDd?.classList.add('hidden')
  })

  // User dropdown toggle
  const userBtn = document.getElementById('ay-user-menu-btn')
  const userDd  = document.getElementById('ay-user-dropdown')
  userBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    userDd?.classList.toggle('hidden')
    // Cerrar notif dropdown si está abierto
    notifDd?.classList.add('hidden')
  })

  // Logout desde header
  document.getElementById('ay-header-logout')?.addEventListener('click', () => Auth.logout())

  // Cerrar dropdowns al hacer clic fuera
  document.addEventListener('click', () => {
    userDd?.classList.add('hidden')
    notifDd?.classList.add('hidden')
  })
}
