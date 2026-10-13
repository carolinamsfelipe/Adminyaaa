/**
 * table.js — Componente de tabla reutilizable y helpers de renderizado de celdas para AdminYAAA
 */

import { escHtml, formatMoney, formatDate } from '../core/utils.js'

/**
 * Renderiza un badge de estado con colores acordes al diseño industrial
 */
export function renderStatusBadge(estado) {
  const map = {
    // Tareas / Trabajos
    'pendiente':  { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    'realizado':  { label: 'Realizado',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    'facturado':  { label: 'Facturado',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    'cobrado':    { label: 'Cobrado',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    // Facturas / General
    'vencida':    { label: 'Vencida',    cls: 'bg-red-50 text-red-700 border-red-200' },
    'vencido':    { label: 'Vencido',    cls: 'bg-red-50 text-red-700 border-red-200' },
    'borrador':   { label: 'Borrador',   cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    'enviado':    { label: 'Enviado',    cls: 'bg-sky-50 text-sky-700 border-sky-200' },
    'aprobado':   { label: 'Aprobado',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'rechazado':  { label: 'Rechazado',  cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    'pagado':     { label: 'Pagado',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'activo':     { label: 'Activo',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'inactivo':   { label: 'Inactivo',   cls: 'bg-slate-100 text-slate-500 border-slate-200' },
    'vigente':    { label: 'Vigente',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'saldado':    { label: 'Saldado',    cls: 'bg-slate-100 text-slate-600 border-slate-300' },
  }

  const norm = String(estado || '').toLowerCase().trim()
  const info = map[norm] || { label: estado || '—', cls: 'bg-slate-100 text-slate-600 border-slate-200' }
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${info.cls}">${escHtml(info.label)}</span>`
}

export function renderMoneyCell(amount, colorize = false) {
  const num = Number(amount || 0)
  const formatted = formatMoney(num)
  if (!colorize) return `<span class="font-mono font-medium">${formatted}</span>`
  if (num > 0) return `<span class="font-mono font-medium text-emerald-600">+${formatted}</span>`
  if (num < 0) return `<span class="font-mono font-medium text-rose-600">${formatted}</span>`
  return `<span class="font-mono text-slate-400">${formatted}</span>`
}

export function renderDateCell(isoDate) {
  if (!isoDate) return `<span class="text-slate-400">—</span>`
  return `<span class="text-slate-600 text-xs font-mono">${formatDate(isoDate)}</span>`
}

/**
 * Tabla interactiva con búsqueda, ordenamiento y paginación
 */
export function DataTable(config) {
  const {
    container,
    columns = [],
    data = [],
    searchable = true,
    sortBy = null,
    sortDir = 'desc',
    pageSize = 15,
    emptyMessage = 'No se encontraron registros.',
  } = config

  let _data = [...data]
  let _filter = ''
  let _currentSort = sortBy
  let _currentDir = sortDir
  let _currentPage = 1

  function getFilteredData() {
    let result = _data
    if (_filter) {
      const q = _filter.toLowerCase()
      result = result.filter(row =>
        Object.values(row).some(val =>
          String(val || '').toLowerCase().includes(q)
        )
      )
    }
    if (_currentSort) {
      result.sort((a, b) => {
        let va = a[_currentSort]
        let vb = b[_currentSort]
        if (va == null) va = ''
        if (vb == null) vb = ''
        if (typeof va === 'number' && typeof vb === 'number') {
          return _currentDir === 'asc' ? va - vb : vb - va
        }
        return _currentDir === 'asc'
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va))
      })
    }
    return result
  }

  function render() {
    const filtered = getFilteredData()
    const totalPages = Math.ceil(filtered.length / pageSize) || 1
    if (_currentPage > totalPages) _currentPage = totalPages
    const startIdx = (_currentPage - 1) * pageSize
    const pageRows = filtered.slice(startIdx, startIdx + pageSize)

    let html = `
      <div class="ay-datatable space-y-3">
        ${searchable ? `
        <div class="flex items-center justify-between gap-4">
          <div class="relative flex-1 max-w-sm">
            <input type="text"
                   id="dt-search-input"
                   placeholder="Buscar en la tabla..."
                   value="${escHtml(_filter)}"
                   class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div class="text-xs text-slate-500">
            Mostrando <span class="font-semibold text-slate-700">${filtered.length}</span> registros
          </div>
        </div>
        ` : ''}

        <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                ${columns.map(col => `
                  <th class="py-3 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-100 select-none' : ''}"
                      data-sort-key="${col.key || ''}">
                    <div class="inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end w-full' : ''}">
                      <span>${col.label}</span>
                      ${col.key && _currentSort === col.key ? `
                        <span class="text-emerald-600 font-bold">${_currentDir === 'asc' ? '↑' : '↓'}</span>
                      ` : ''}
                    </div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${pageRows.length === 0 ? `
                <tr>
                  <td colspan="${columns.length}" class="py-8 text-center text-slate-400">
                    ${emptyMessage}
                  </td>
                </tr>
              ` : pageRows.map(row => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  ${columns.map(col => `
                    <td class="py-3 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}">
                      ${col.render ? col.render(row[col.key], row) : escHtml(row[col.key] ?? '—')}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${totalPages > 1 ? `
        <div class="flex items-center justify-between text-xs text-slate-500 px-1">
          <div>Página ${_currentPage} de ${totalPages}</div>
          <div class="flex gap-1">
            <button class="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
                    id="dt-prev-page" ${_currentPage <= 1 ? 'disabled' : ''}>Anterior</button>
            <button class="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
                    id="dt-next-page" ${_currentPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
          </div>
        </div>
        ` : ''}
      </div>
    `

    container.innerHTML = html

    // Bind search
    const searchInput = container.querySelector('#dt-search-input')
    searchInput?.addEventListener('input', (e) => {
      _filter = e.target.value
      _currentPage = 1
      render()
      // refocus
      const freshInput = container.querySelector('#dt-search-input')
      if (freshInput) {
        freshInput.focus()
        freshInput.setSelectionRange(freshInput.value.length, freshInput.value.length)
      }
    })

    // Bind sorting
    container.querySelectorAll('th[data-sort-key]').forEach(th => {
      const key = th.getAttribute('data-sort-key')
      if (!key) return
      th.addEventListener('click', () => {
        if (_currentSort === key) {
          _currentDir = _currentDir === 'asc' ? 'desc' : 'asc'
        } else {
          _currentSort = key
          _currentDir = 'asc'
        }
        render()
      })
    })

    // Bind pagination
    container.querySelector('#dt-prev-page')?.addEventListener('click', () => {
      if (_currentPage > 1) {
        _currentPage--
        render()
      }
    })
    container.querySelector('#dt-next-page')?.addEventListener('click', () => {
      if (_currentPage < totalPages) {
        _currentPage++
        render()
      }
    })
  }

  render()

  return {
    update(newData) {
      _data = [...newData]
      render()
    },
    destroy() {
      container.innerHTML = ''
    }
  }
}
