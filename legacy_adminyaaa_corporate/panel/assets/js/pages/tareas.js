/**
 * tareas.js — Página "Registro de Tareas Operativas" de AdminYAAA
 *
 * Funcionalidades:
 *  - Barra de alta rápida (inline, Enter para guardar)
 *  - Filtros activos: cliente, operador, estado, rango de fechas
 *  - Tabla densa con estado editable inline (dropdown directo en celda)
 *  - Selección múltiple + acciones en lote
 *  - Vista restringida por rol (ADMIN ve todo; OPERADOR sólo lo suyo)
 */

import { TareasAPI, ClientesAPI, ColaboradoresAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, toast, today } from '../core/utils.js'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS = [
  'Liquidación Sueldos',
  'Cierre de Caja',
  'Confección Recibos',
  'Inventario/Stock',
  'Presupuesto',
  'Asesoramiento',
  'Admin General',
  'Otro',
]

const ESTADOS = [
  { value: 'pendiente',  label: 'Pendiente',  color: 'text-amber-400  bg-amber-400/10  border-amber-400/30'  },
  { value: 'realizada',  label: 'Realizada',  color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  { value: 'facturada',  label: 'Facturada',  color: 'text-blue-400   bg-blue-400/10   border-blue-400/30'   },
  { value: 'cancelada',  label: 'Cancelada',  color: 'text-slate-500  bg-slate-500/10  border-slate-500/30'  },
]

const TIPO_COLORS = {
  'Liquidación Sueldos': 'bg-violet-500/15 text-violet-300',
  'Cierre de Caja':      'bg-blue-500/15   text-blue-300',
  'Confección Recibos':  'bg-cyan-500/15   text-cyan-300',
  'Inventario/Stock':    'bg-orange-500/15 text-orange-300',
  'Presupuesto':         'bg-indigo-500/15 text-indigo-300',
  'Asesoramiento':       'bg-teal-500/15   text-teal-300',
  'Admin General':       'bg-slate-500/15  text-slate-300',
  'Otro':                'bg-pink-500/15   text-pink-300',
}

const AVATAR_COLORS = {
  emerald: 'bg-emerald-600',
  blue:    'bg-blue-600',
  violet:  'bg-violet-600',
  amber:   'bg-amber-600',
  rose:    'bg-rose-600',
}

// ─── Estado local del módulo ──────────────────────────────────────────────────

let _container  = null
let _user       = null
let _clientes   = []
let _operadores = []
let _tareas     = []          // fuente de verdad local (sin eliminar)
let _selected   = new Set()  // IDs seleccionados para bulk actions

/** Filtros activos */
let _filters = {
  cliente:      '',
  operador:     '',
  estado:       '',
  fechaDesde:   '',
  fechaHasta:   '',
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Renderiza la página completa de Tareas en el contenedor dado.
 * @param {HTMLElement} container
 * @param {Object} [params]
 */
export async function renderTareas(container, params = {}) {
  _container = container
  _user      = Auth.currentUser()
  _selected  = new Set()

  // Resetear filtros si es carga inicial
  if (!params.preserveFilters) {
    _filters = { cliente: '', operador: '', estado: '', fechaDesde: '', fechaHasta: '' }
    // Preseleccionar operador si es OPERADOR
    if (_user?.role === 'operador') _filters.operador = _user.id
  }

  container.innerHTML = `
    <div class="flex items-center justify-center h-32 text-slate-400 text-sm">
      <svg class="animate-spin w-5 h-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Cargando tareas…
    </div>`

  try {
    await _loadData()
  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-red-400 text-sm">Error al cargar datos: ${_esc(err.message)}</div>`
    return
  }

  _render()
}

// ─── Carga de datos ───────────────────────────────────────────────────────────

async function _loadData() {
  const isAdmin = _user?.role === 'admin'

  const [clientes, operadores, tareas] = await Promise.all([
    ClientesAPI.listar(),
    ColaboradoresAPI.listar(),
    TareasAPI.listar({ operadorId: isAdmin ? null : _user?.id }),
  ])

  _clientes   = clientes   || []
  _operadores = operadores || []
  _tareas     = tareas     || []

  // Si es operador, filtrar clientes asignados
  if (!isAdmin && _user?.clientes_asignados) {
    _clientes = _clientes.filter(c => _user.clientes_asignados.includes(c.id))
  }
}

// ─── Render principal ─────────────────────────────────────────────────────────

function _render() {
  const isAdmin = _user?.role === 'admin'

  _container.innerHTML = `
    <!-- Encabezado -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-xl font-semibold text-slate-100 tracking-tight">Registro de Tareas Operativas</h1>
        <p class="text-xs text-slate-400 mt-0.5">Alta rápida, seguimiento por estado y facturación</p>
      </div>
      <div class="flex items-center gap-2" id="bulk-actions" style="display:none!important">
        <span class="text-xs text-slate-400" id="bulk-count"></span>
        <button id="btn-bulk-realizada"
          class="px-3 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium border border-emerald-500/30 transition-colors">
          ✓ Marcar Realizadas
        </button>
        <button id="btn-bulk-facturada"
          class="px-3 py-1.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-medium border border-blue-500/30 transition-colors">
          ◈ Marcar Facturadas
        </button>
        <button id="btn-bulk-cancel"
          class="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs transition-colors">
          ✕ Deseleccionar
        </button>
      </div>
    </div>

    <!-- Barra de alta rápida -->
    <div class="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 mb-4" id="quick-add-bar">
      <p class="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-medium">Alta rápida — presioná Enter para guardar</p>
      <div class="flex flex-wrap gap-2 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-[10px] text-slate-500">Fecha</label>
          <input id="qa-fecha" type="date" value="${today()}"
            class="h-8 px-2 rounded bg-slate-700/70 border border-slate-600 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 w-36"/>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[10px] text-slate-500">Cliente</label>
          <select id="qa-cliente"
            class="h-8 px-2 rounded bg-slate-700/70 border border-slate-600 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 w-44">
            <option value="">— Cliente —</option>
            ${_clientes.map(c => `<option value="${_esc(c.id)}">${_esc(c.nombre)}</option>`).join('')}
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[10px] text-slate-500">Operador</label>
          <select id="qa-operador"
            class="h-8 px-2 rounded bg-slate-700/70 border border-slate-600 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 w-36">
            ${_operadores.map(o =>
              `<option value="${_esc(o.id)}" ${o.id === _user?.id ? 'selected' : ''}>${_esc(o.nombre)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label class="text-[10px] text-slate-500">Descripción *</label>
          <input id="qa-descripcion" type="text" placeholder="Descripción de la tarea…"
            class="h-8 px-2 rounded bg-slate-700/70 border border-slate-600 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 w-full"/>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[10px] text-slate-500">Tipo</label>
          <select id="qa-tipo"
            class="h-8 px-2 rounded bg-slate-700/70 border border-slate-600 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 w-44">
            ${TIPOS.map(t => `<option value="${_esc(t)}">${_esc(t)}</option>`).join('')}
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[10px] text-slate-500">Horas</label>
          <input id="qa-horas" type="number" min="0" step="0.5" placeholder="0"
            class="h-8 px-2 rounded bg-slate-700/70 border border-slate-600 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 w-16 text-right"/>
        </div>
        <div class="flex flex-col gap-1 items-center">
          <label class="text-[10px] text-slate-500">En abono</label>
          <input id="qa-en-abono" type="checkbox"
            class="w-4 h-4 mt-2 rounded accent-emerald-500 cursor-pointer"/>
        </div>
        <div class="flex flex-col gap-1" id="qa-precio-wrap">
          <label class="text-[10px] text-slate-500">Precio</label>
          <input id="qa-precio" type="number" min="0" step="100" placeholder="0"
            class="h-8 px-2 rounded bg-slate-700/70 border border-slate-600 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 w-24 text-right"/>
        </div>
        <button id="btn-qa-agregar"
          class="h-8 px-4 rounded bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold transition-colors whitespace-nowrap">
          + Agregar
        </button>
      </div>
    </div>

    <!-- Filtros activos -->
    <div class="bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2 mb-4 flex flex-wrap gap-2 items-end">
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-slate-500">Por cliente</label>
        <select id="f-cliente"
          class="h-7 px-2 rounded bg-slate-700/60 border border-slate-600 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 w-40">
          <option value="">Todos</option>
          ${_clientes.map(c =>
            `<option value="${_esc(c.id)}" ${_filters.cliente === c.id ? 'selected' : ''}>${_esc(c.nombre)}</option>`
          ).join('')}
        </select>
      </div>
      ${isAdmin ? `
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-slate-500">Por operador</label>
        <select id="f-operador"
          class="h-7 px-2 rounded bg-slate-700/60 border border-slate-600 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 w-36">
          <option value="">Todos</option>
          ${_operadores.map(o =>
            `<option value="${_esc(o.id)}" ${_filters.operador === o.id ? 'selected' : ''}>${_esc(o.nombre)}</option>`
          ).join('')}
        </select>
      </div>` : ''}
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-slate-500">Por estado</label>
        <select id="f-estado"
          class="h-7 px-2 rounded bg-slate-700/60 border border-slate-600 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 w-32">
          <option value="">Todos</option>
          ${ESTADOS.map(e =>
            `<option value="${_esc(e.value)}" ${_filters.estado === e.value ? 'selected' : ''}>${_esc(e.label)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-slate-500">Desde</label>
        <input id="f-fecha-desde" type="date" value="${_esc(_filters.fechaDesde)}"
          class="h-7 px-2 rounded bg-slate-700/60 border border-slate-600 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 w-32"/>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-slate-500">Hasta</label>
        <input id="f-fecha-hasta" type="date" value="${_esc(_filters.fechaHasta)}"
          class="h-7 px-2 rounded bg-slate-700/60 border border-slate-600 text-slate-300 text-xs focus:outline-none focus:border-emerald-500 w-32"/>
      </div>
      <button id="btn-reset-filters"
        class="h-7 px-3 rounded bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs transition-colors ml-auto">
        ↺ Limpiar filtros
      </button>
      <span class="text-xs text-slate-500 self-end ml-1" id="filter-count"></span>
    </div>

    <!-- Tabla principal -->
    <div class="bg-slate-800/40 border border-slate-700/50 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm" id="tareas-table">
          <thead>
            <tr class="border-b border-slate-700/70 text-[10px] uppercase tracking-wider text-slate-500">
              <th class="w-8 px-3 py-2.5">
                <input type="checkbox" id="chk-all" class="rounded accent-emerald-500 cursor-pointer"/>
              </th>
              <th class="px-3 py-2.5 text-left font-medium">Fecha</th>
              <th class="px-3 py-2.5 text-left font-medium">Cliente</th>
              <th class="px-3 py-2.5 text-left font-medium">Operador</th>
              <th class="px-3 py-2.5 text-left font-medium">Descripción</th>
              <th class="px-3 py-2.5 text-left font-medium">Tipo</th>
              <th class="px-3 py-2.5 text-right font-medium">Horas</th>
              <th class="px-3 py-2.5 text-right font-medium">Monto</th>
              <th class="px-3 py-2.5 text-center font-medium">Estado</th>
              <th class="px-3 py-2.5 text-center font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody id="tareas-tbody" class="divide-y divide-slate-700/40">
            <tr><td colspan="10" class="py-8 text-center text-slate-500 text-xs">Cargando…</td></tr>
          </tbody>
        </table>
      </div>
      <div class="border-t border-slate-700/50 px-4 py-2 flex items-center justify-between" id="table-footer">
        <span class="text-xs text-slate-500" id="row-count"></span>
        <span class="text-xs font-medium text-slate-300" id="total-amount"></span>
      </div>
    </div>
  `

  _bindEvents()
  _renderTable()
}

// ─── Bind de eventos globales ─────────────────────────────────────────────────

function _bindEvents() {
  const isAdmin = _user?.role === 'admin'

  // ── Quick-add: toggle precio según "en abono"
  const chkAbono = _q('#qa-en-abono')
  const precioWrap = _q('#qa-precio-wrap')
  chkAbono?.addEventListener('change', () => {
    if (precioWrap) precioWrap.style.display = chkAbono.checked ? 'none' : ''
  })

  // ── Quick-add: auto-detectar si cliente tiene abono
  _q('#qa-cliente')?.addEventListener('change', e => {
    const cliente = _clientes.find(c => c.id === e.target.value)
    if (cliente && chkAbono) {
      const tieneAbono = !!cliente.tiene_abono
      chkAbono.checked = tieneAbono
      if (precioWrap) precioWrap.style.display = tieneAbono ? 'none' : ''
    }
  })

  // ── Quick-add: Enter en descripción
  _q('#qa-descripcion')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); _submitQuickAdd() }
  })

  // ── Botón Agregar
  _q('#btn-qa-agregar')?.addEventListener('click', _submitQuickAdd)

  // ── Filtros: cualquier cambio recalcula tabla
  const filterIds = ['f-cliente', 'f-estado', 'f-fecha-desde', 'f-fecha-hasta']
  if (isAdmin) filterIds.push('f-operador')

  filterIds.forEach(id => {
    _q(`#${id}`)?.addEventListener('change', _applyFilters)
  })

  // ── Reset filtros
  _q('#btn-reset-filters')?.addEventListener('click', () => {
    _filters = { cliente: '', operador: '', estado: '', fechaDesde: '', fechaHasta: '' }
    if (!isAdmin) _filters.operador = _user?.id || ''
    _render() // re-renderizar para resetear los inputs
  })

  // ── Checkbox "seleccionar todos"
  _q('#chk-all')?.addEventListener('change', e => {
    const filtered = _getFiltered()
    filtered.forEach(t => {
      if (e.target.checked) _selected.add(t.id)
      else _selected.delete(t.id)
    })
    _renderTable()
    _updateBulkBar()
  })

  // ── Acciones bulk
  _q('#btn-bulk-realizada')?.addEventListener('click', () => _bulkEstado('realizada'))
  _q('#btn-bulk-facturada')?.addEventListener('click', () => _bulkEstado('facturada'))
  _q('#btn-bulk-cancel')?.addEventListener('click', () => {
    _selected.clear()
    _renderTable()
    _updateBulkBar()
  })
}

// ─── Quick-add submit ─────────────────────────────────────────────────────────

async function _submitQuickAdd() {
  const fecha       = _q('#qa-fecha')?.value?.trim()
  const clienteId   = _q('#qa-cliente')?.value?.trim()
  const operadorId  = _q('#qa-operador')?.value?.trim()
  const descripcion = _q('#qa-descripcion')?.value?.trim()
  const tipo        = _q('#qa-tipo')?.value?.trim()
  const horas       = parseFloat(_q('#qa-horas')?.value) || 0
  const enAbono     = _q('#qa-en-abono')?.checked ?? false
  const precio      = enAbono ? 0 : (parseFloat(_q('#qa-precio')?.value) || 0)

  if (!descripcion) {
    toast('La descripción es obligatoria.', 'error')
    _q('#qa-descripcion')?.focus()
    return
  }

  const cliente   = _clientes.find(c => c.id === clienteId)
  const operador  = _operadores.find(o => o.id === operadorId)

  const nueva = {
    id:          _uid(),
    fecha:       fecha || today(),
    cliente_id:  clienteId || null,
    cliente_nombre: cliente?.nombre || '—',
    operador_id:    operadorId || null,
    operador_nombre: operador?.nombre || _user?.nombre || '—',
    operador_iniciales: operador?.iniciales || _user?.iniciales || '??',
    operador_color:     operador?.avatar_color || _user?.avatar_color || 'slate',
    descripcion,
    tipo:        tipo || 'Otro',
    horas,
    en_abono:    enAbono,
    precio,
    estado:      'pendiente',
    deleted:     false,
  }

  // Optimistic UI: insertar al inicio de la lista local
  _tareas.unshift(nueva)
  _renderTable()

  // Limpiar campos rápidos (mantener fecha, cliente, operador, tipo)
  const desc = _q('#qa-descripcion')
  const precioInp = _q('#qa-precio')
  const horasInp  = _q('#qa-horas')
  if (desc)     desc.value  = ''
  if (precioInp) precioInp.value = ''
  if (horasInp)  horasInp.value  = ''
  desc?.focus()

  try {
    const saved = await TareasAPI.crear(nueva)
    // Reemplazar el optimistic con el guardado real
    const idx = _tareas.findIndex(t => t.id === nueva.id)
    if (idx !== -1 && saved) _tareas[idx] = { ...nueva, ...saved }
    toast(`Tarea agregada: ${descripcion}`, 'success')
  } catch (err) {
    // Revertir si falla
    _tareas = _tareas.filter(t => t.id !== nueva.id)
    _renderTable()
    toast(`Error al guardar: ${err.message}`, 'error')
  }
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

function _applyFilters() {
  const isAdmin = _user?.role === 'admin'
  _filters.cliente    = _q('#f-cliente')?.value  || ''
  _filters.estado     = _q('#f-estado')?.value   || ''
  _filters.fechaDesde = _q('#f-fecha-desde')?.value || ''
  _filters.fechaHasta = _q('#f-fecha-hasta')?.value || ''
  if (isAdmin) _filters.operador = _q('#f-operador')?.value || ''
  _renderTable()
}

function _getFiltered() {
  return _tareas.filter(t => {
    if (t.deleted) return false
    if (_filters.cliente    && t.cliente_id  !== _filters.cliente)    return false
    if (_filters.operador   && t.operador_id !== _filters.operador)   return false
    if (_filters.estado     && t.estado      !== _filters.estado)     return false
    if (_filters.fechaDesde && t.fecha < _filters.fechaDesde)         return false
    if (_filters.fechaHasta && t.fecha > _filters.fechaHasta)         return false
    return true
  })
}

// ─── Render tabla ─────────────────────────────────────────────────────────────

function _renderTable() {
  const tbody = _q('#tareas-tbody')
  if (!tbody) return

  const filtered = _getFiltered()
  const total    = filtered.reduce((s, t) => s + (t.precio || 0), 0)
  const count    = filtered.length

  // Actualizar footer
  const rowCountEl    = _q('#row-count')
  const totalAmountEl = _q('#total-amount')
  if (rowCountEl)    rowCountEl.textContent    = `${count} tarea${count !== 1 ? 's' : ''}`
  if (totalAmountEl) totalAmountEl.textContent = `Total: ${formatMoney(total)}`

  // Actualizar badge de filtro-count
  const active = Object.values(_filters).filter(Boolean).length
  const fcEl = _q('#filter-count')
  if (fcEl) fcEl.textContent = active ? `${active} filtro${active > 1 ? 's' : ''} activo${active > 1 ? 's' : ''}` : ''

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="py-10 text-center text-slate-500 text-xs">
          No hay tareas que coincidan con los filtros actuales.
        </td>
      </tr>`
    return
  }

  tbody.innerHTML = filtered.map(t => _renderRow(t)).join('')

  // Bind eventos por fila
  filtered.forEach(t => {
    // Checkbox de fila
    _q(`#chk-${t.id}`, tbody)?.addEventListener('change', e => {
      if (e.target.checked) _selected.add(t.id)
      else _selected.delete(t.id)
      _updateBulkBar()
    })

    // Estado inline dropdown
    _q(`#estado-${t.id}`, tbody)?.addEventListener('change', async e => {
      const newEstado = e.target.value
      await _changeEstado(t.id, newEstado)
    })

    // Botón eliminar (soft delete)
    _q(`#btn-del-${t.id}`, tbody)?.addEventListener('click', () => _deleteTask(t.id))
  })

  // Sync checkboxes con selección actual
  filtered.forEach(t => {
    const chk = _q(`#chk-${t.id}`, tbody)
    if (chk) chk.checked = _selected.has(t.id)
  })

  // Sync "select all" checkbox
  const chkAll = _q('#chk-all')
  if (chkAll) {
    const selCount = filtered.filter(t => _selected.has(t.id)).length
    chkAll.checked       = selCount === count && count > 0
    chkAll.indeterminate = selCount > 0 && selCount < count
  }
}

function _renderRow(t) {
  const estadoObj = ESTADOS.find(e => e.value === t.estado) || ESTADOS[0]
  const tipoCls   = TIPO_COLORS[t.tipo] || 'bg-slate-500/15 text-slate-300'
  const avatarCls = AVATAR_COLORS[t.operador_color] || 'bg-slate-600'
  const isSelected = _selected.has(t.id)

  return `
    <tr class="hover:bg-slate-700/20 transition-colors text-xs ${isSelected ? 'bg-emerald-500/5' : ''}" data-id="${_esc(t.id)}">
      <td class="px-3 py-2.5">
        <input type="checkbox" id="chk-${_esc(t.id)}" class="rounded accent-emerald-500 cursor-pointer"/>
      </td>
      <td class="px-3 py-2.5 text-slate-400 whitespace-nowrap">${_esc(formatDate(t.fecha))}</td>
      <td class="px-3 py-2.5">
        <span class="text-slate-200 font-medium">${_esc(t.cliente_nombre || '—')}</span>
      </td>
      <td class="px-3 py-2.5">
        <div class="flex items-center gap-1.5">
          <div class="w-6 h-6 rounded-full ${avatarCls} flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
            ${_esc(t.operador_iniciales || '??')}
          </div>
          <span class="text-slate-300 truncate max-w-[80px]">${_esc(t.operador_nombre || '—')}</span>
        </div>
      </td>
      <td class="px-3 py-2.5 max-w-[240px]">
        <span class="text-slate-200 line-clamp-2 leading-snug">${_esc(t.descripcion)}</span>
        ${t.en_abono ? '<span class="inline-block mt-0.5 text-[9px] bg-teal-500/15 text-teal-400 px-1 rounded">abono</span>' : ''}
      </td>
      <td class="px-3 py-2.5">
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${tipoCls}">
          ${_esc(t.tipo || 'Otro')}
        </span>
      </td>
      <td class="px-3 py-2.5 text-right text-slate-400">
        ${t.horas ? `${t.horas}h` : '—'}
      </td>
      <td class="px-3 py-2.5 text-right font-medium ${t.en_abono ? 'text-teal-400' : 'text-slate-200'}">
        ${t.en_abono ? '<span class="text-[10px]">incl.</span>' : _esc(formatMoney(t.precio || 0))}
      </td>
      <td class="px-3 py-2.5 text-center">
        <select id="estado-${_esc(t.id)}"
          class="rounded border px-1.5 py-0.5 text-[10px] font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${estadoObj.color} bg-transparent">
          ${ESTADOS.map(e =>
            `<option value="${_esc(e.value)}" ${t.estado === e.value ? 'selected' : ''}
              class="bg-slate-800 text-slate-200">${_esc(e.label)}</option>`
          ).join('')}
        </select>
      </td>
      <td class="px-3 py-2.5 text-center">
        <button id="btn-del-${_esc(t.id)}"
          title="Eliminar tarea"
          class="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </td>
    </tr>`
}

// ─── Cambio de estado inline ──────────────────────────────────────────────────

async function _changeEstado(id, newEstado) {
  const tarea = _tareas.find(t => t.id === id)
  if (!tarea) return
  const oldEstado = tarea.estado
  tarea.estado = newEstado   // optimistic
  _renderTable()

  try {
    await TareasAPI.actualizarEstado(id, newEstado)
    const estadoLabel = ESTADOS.find(e => e.value === newEstado)?.label || newEstado
    toast(`Estado → ${estadoLabel}`, 'success')
  } catch (err) {
    tarea.estado = oldEstado  // revertir
    _renderTable()
    toast(`Error al cambiar estado: ${err.message}`, 'error')
  }
}

// ─── Bulk actions ─────────────────────────────────────────────────────────────

async function _bulkEstado(nuevoEstado) {
  if (_selected.size === 0) return
  const ids     = [..._selected]
  const label   = ESTADOS.find(e => e.value === nuevoEstado)?.label || nuevoEstado

  // Optimistic
  ids.forEach(id => {
    const t = _tareas.find(x => x.id === id)
    if (t) t.estado = nuevoEstado
  })
  _selected.clear()
  _renderTable()
  _updateBulkBar()

  try {
    await Promise.all(ids.map(id => TareasAPI.actualizarEstado(id, nuevoEstado)))
    toast(`${ids.length} tarea${ids.length > 1 ? 's' : ''} marcada${ids.length > 1 ? 's' : ''} como ${label}`, 'success')
  } catch (err) {
    toast(`Error en acción masiva: ${err.message}`, 'error')
  }
}

function _updateBulkBar() {
  const bar = _q('#bulk-actions')
  if (!bar) return

  if (_selected.size > 0) {
    bar.style.removeProperty('display')
    const countEl = _q('#bulk-count')
    if (countEl) countEl.textContent = `${_selected.size} seleccionada${_selected.size > 1 ? 's' : ''}`
  } else {
    bar.style.display = 'none'
  }
}

// ─── Soft delete ──────────────────────────────────────────────────────────────

async function _deleteTask(id) {
  const tarea = _tareas.find(t => t.id === id)
  if (!tarea) return

  if (!confirm(`¿Eliminar la tarea "${tarea.descripcion}"? Esta acción se puede revertir.`)) return

  tarea.deleted = true
  _selected.delete(id)
  _renderTable()
  _updateBulkBar()

  try {
    await TareasAPI.eliminar(id)
    toast('Tarea eliminada.', 'info')
  } catch (err) {
    tarea.deleted = false
    _renderTable()
    toast(`Error al eliminar: ${err.message}`, 'error')
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** querySelector dentro de _container (o raíz si se pasa scope) */
function _q(sel, scope) {
  return (scope || _container)?.querySelector(sel) ?? null
}

function _esc(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function _uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
