import { StockAPI, PresupuestosAPI, ClientesAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, toast } from '../core/utils.js'

// ─── Estado local ─────────────────────────────────────────────────────────────
let state = {
  activeTab: 'presupuestos',
  presupuestos: [],
  clientes: [],
  stockItems: [],
  selectedClientId: null,
  currentQuote: null,
  filters: { cliente: '', estado: '', fechaDesde: '', fechaHasta: '' },
  stockFilters: { clienteId: '', search: '' },
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export async function renderPresupuestador(container, params) {
  container.innerHTML = `
    <div class="flex flex-col h-full" id="presupuestador-root">
      ${renderHeader()}
      ${renderTabs()}
      <div id="tab-content" class="flex-1 overflow-auto p-6"></div>
    </div>
  `
  bindTabEvents(container)
  await loadInitialData()
  renderActiveTab(container)
}

// ─── Header ───────────────────────────────────────────────────────────────────
function renderHeader() {
  return `
    <div class="px-6 pt-6 pb-0">
      <h1 class="text-2xl font-bold text-slate-100">Presupuestador & Stock</h1>
      <p class="text-slate-400 text-sm mt-1">Gestión de presupuestos digitales y catálogo de inventario</p>
    </div>
  `
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function renderTabs() {
  return `
    <div class="px-6 mt-4 border-b border-slate-700">
      <nav class="flex gap-1" id="main-tabs">
        <button data-tab="presupuestos"
          class="tab-btn px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                 ${state.activeTab === 'presupuestos' ? 'bg-slate-700 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200'}">
          📄 Presupuestos
        </button>
        <button data-tab="stock"
          class="tab-btn px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                 ${state.activeTab === 'stock' ? 'bg-slate-700 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200'}">
          📦 Catálogo de Stock
        </button>
      </nav>
    </div>
  `
}

function bindTabEvents(container) {
  container.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab-btn')
    if (tabBtn) {
      state.activeTab = tabBtn.dataset.tab
      // Re-render tabs + content
      container.querySelector('#main-tabs').innerHTML = renderTabs().replace(/<.*?id="main-tabs".*?>/s, '').split('</nav>')[0]
      // Simpler: just re-render the full component without full DOM reset
      const tabs = container.querySelectorAll('.tab-btn')
      tabs.forEach(btn => {
        const isActive = btn.dataset.tab === state.activeTab
        btn.className = `tab-btn px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
          isActive ? 'bg-slate-700 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200'
        }`
      })
      renderActiveTab(container)
    }
  })
}

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadInitialData() {
  const [presupuestos, clientes] = await Promise.all([
    PresupuestosAPI.getAll().catch(() => getMockPresupuestos()),
    ClientesAPI.getAll().catch(() => getMockClientes()),
  ])
  state.presupuestos = presupuestos
  state.clientes = clientes
}

// ─── Tab routing ──────────────────────────────────────────────────────────────
function renderActiveTab(container) {
  const content = container.querySelector('#tab-content')
  if (!content) return
  if (state.activeTab === 'presupuestos') {
    renderPresupuestosTab(content, container)
  } else {
    renderStockTab(content, container)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 1: PRESUPUESTOS
// ══════════════════════════════════════════════════════════════════════════════

function renderPresupuestosTab(content, root) {
  content.innerHTML = `
    <div class="space-y-4">
      ${renderPresupuestosToolbar()}
      ${renderPresupuestosFilters()}
      ${renderPresupuestosTable()}
    </div>
  `
  bindPresupuestosEvents(content, root)
}

function renderPresupuestosToolbar() {
  return `
    <div class="flex items-center justify-between">
      <span class="text-slate-300 text-sm">${state.presupuestos.length} presupuestos registrados</span>
      <button id="btn-nuevo-presupuesto"
        class="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
        + Nuevo Presupuesto
      </button>
    </div>
  `
}

function renderPresupuestosFilters() {
  const clienteOptions = state.clientes.map(c =>
    `<option value="${c.id}">${c.razon_social || c.nombre}</option>`
  ).join('')
  return `
    <div class="flex flex-wrap gap-3 bg-slate-800 border border-slate-700 rounded-lg p-3">
      <select id="filter-cliente" class="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5 min-w-[180px]">
        <option value="">Todos los clientes</option>
        ${clienteOptions}
      </select>
      <select id="filter-estado" class="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5">
        <option value="">Todos los estados</option>
        <option value="borrador">Borrador</option>
        <option value="enviado">Enviado</option>
        <option value="aprobado">Aprobado</option>
        <option value="rechazado">Rechazado</option>
      </select>
      <input type="date" id="filter-fecha-desde" value="${state.filters.fechaDesde}"
        class="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5" placeholder="Desde">
      <input type="date" id="filter-fecha-hasta" value="${state.filters.fechaHasta}"
        class="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5" placeholder="Hasta">
      <button id="btn-limpiar-filtros" class="text-sm text-slate-400 hover:text-slate-200 px-2">✕ Limpiar</button>
    </div>
  `
}

function renderPresupuestosTable() {
  const filtered = getFilteredPresupuestos()
  if (!filtered.length) {
    return `<div class="text-center text-slate-500 py-16">No se encontraron presupuestos con los filtros aplicados.</div>`
  }
  const rows = filtered.map(p => {
    const cliente = state.clientes.find(c => c.id === p.cliente_id)
    return `
      <tr class="border-t border-slate-700 hover:bg-slate-750 transition-colors">
        <td class="px-4 py-3 text-slate-300 font-mono text-sm">#${String(p.id).padStart(4, '0')}</td>
        <td class="px-4 py-3 text-slate-300 text-sm">${formatDate(p.fecha)}</td>
        <td class="px-4 py-3 text-slate-200 text-sm font-medium">${cliente?.razon_social || cliente?.nombre || '—'}</td>
        <td class="px-4 py-3 text-slate-400 text-sm text-center">${p.items?.length || 0}</td>
        <td class="px-4 py-3 text-slate-100 text-sm font-semibold">${formatMoney(p.total)}</td>
        <td class="px-4 py-3">${renderEstadoBadge(p.estado)}</td>
        <td class="px-4 py-3">
          <div class="flex gap-2">
            <button class="btn-ver-pres text-xs text-slate-400 hover:text-emerald-400 transition-colors" data-id="${p.id}" title="Ver / Editar">✏️</button>
            <button class="btn-print-pres text-xs text-slate-400 hover:text-blue-400 transition-colors" data-id="${p.id}" title="Imprimir">🖨️</button>
            <button class="btn-del-pres text-xs text-slate-400 hover:text-red-400 transition-colors" data-id="${p.id}" title="Eliminar">🗑️</button>
          </div>
        </td>
      </tr>
    `
  }).join('')

  return `
    <div class="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-750 text-slate-400 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 text-left">N°</th>
            <th class="px-4 py-3 text-left">Fecha</th>
            <th class="px-4 py-3 text-left">Cliente</th>
            <th class="px-4 py-3 text-center">Ítems</th>
            <th class="px-4 py-3 text-left">Total</th>
            <th class="px-4 py-3 text-left">Estado</th>
            <th class="px-4 py-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody id="presupuestos-tbody">
          ${rows}
        </tbody>
      </table>
    </div>
  `
}

function renderEstadoBadge(estado) {
  const badges = {
    borrador:   'bg-slate-600 text-slate-300',
    enviado:    'bg-blue-900 text-blue-300',
    aprobado:   'bg-emerald-900 text-emerald-300',
    rechazado:  'bg-red-900 text-red-300',
  }
  const labels = {
    borrador: 'Borrador', enviado: 'Enviado',
    aprobado: 'Aprobado', rechazado: 'Rechazado',
  }
  const cls = badges[estado] || 'bg-slate-600 text-slate-300'
  return `<span class="px-2 py-0.5 rounded text-xs font-medium ${cls}">${labels[estado] || estado}</span>`
}

function getFilteredPresupuestos() {
  return state.presupuestos.filter(p => {
    if (state.filters.cliente && p.cliente_id !== state.filters.cliente) return false
    if (state.filters.estado && p.estado !== state.filters.estado) return false
    if (state.filters.fechaDesde && p.fecha < state.filters.fechaDesde) return false
    if (state.filters.fechaHasta && p.fecha > state.filters.fechaHasta) return false
    return true
  })
}

function bindPresupuestosEvents(content, root) {
  // Nuevo presupuesto
  content.querySelector('#btn-nuevo-presupuesto')?.addEventListener('click', () => {
    openNuevoPresupuestoModal(root)
  })

  // Filters
  content.querySelector('#filter-cliente')?.addEventListener('change', e => {
    state.filters.cliente = e.target.value
    refreshPresupuestosTable(content, root)
  })
  content.querySelector('#filter-estado')?.addEventListener('change', e => {
    state.filters.estado = e.target.value
    refreshPresupuestosTable(content, root)
  })
  content.querySelector('#filter-fecha-desde')?.addEventListener('change', e => {
    state.filters.fechaDesde = e.target.value
    refreshPresupuestosTable(content, root)
  })
  content.querySelector('#filter-fecha-hasta')?.addEventListener('change', e => {
    state.filters.fechaHasta = e.target.value
    refreshPresupuestosTable(content, root)
  })
  content.querySelector('#btn-limpiar-filtros')?.addEventListener('click', () => {
    state.filters = { cliente: '', estado: '', fechaDesde: '', fechaHasta: '' }
    renderPresupuestosTab(content, root)
  })

  // Table row actions
  content.addEventListener('click', e => {
    const id = e.target.closest('[data-id]')?.dataset.id
    if (!id) return
    if (e.target.closest('.btn-ver-pres')) {
      const pres = state.presupuestos.find(p => p.id == id)
      if (pres) openNuevoPresupuestoModal(root, pres)
    }
    if (e.target.closest('.btn-print-pres')) {
      const pres = state.presupuestos.find(p => p.id == id)
      if (pres) openPrintView(pres)
    }
    if (e.target.closest('.btn-del-pres')) {
      if (confirm('¿Eliminar este presupuesto?')) {
        state.presupuestos = state.presupuestos.filter(p => p.id != id)
        toast('Presupuesto eliminado', 'warning')
        renderPresupuestosTab(content, root)
      }
    }
  })
}

function refreshPresupuestosTable(content, root) {
  const tableWrapper = content.querySelector('.bg-slate-800.border')
  if (tableWrapper) {
    const tmp = document.createElement('div')
    tmp.innerHTML = renderPresupuestosTable()
    tableWrapper.replaceWith(tmp.firstElementChild)
    bindPresupuestosEvents(content, root)
  }
}

// ─── Nuevo Presupuesto Modal ───────────────────────────────────────────────────
function openNuevoPresupuestoModal(root, existing = null) {
  state.currentQuote = existing ? JSON.parse(JSON.stringify(existing)) : {
    id: null,
    fecha: new Date().toISOString().split('T')[0],
    cliente_id: '',
    items: [],
    iva: true,
    descuento: 0,
    notas: '',
    estado: 'borrador',
  }

  const modal = Modal.open({
    title: existing ? `Presupuesto #${String(existing.id).padStart(4, '0')}` : 'Nuevo Presupuesto',
    size: 'xl',
    content: buildQuoteFormHTML(),
    footer: `
      <button id="btn-cancelar-quote" class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancelar</button>
      <button id="btn-guardar-borrador" class="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors">Guardar Borrador</button>
      <button id="btn-emitir-quote" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">Guardar y Emitir</button>
    `,
  })

  bindQuoteFormEvents(modal, root)
}

function buildQuoteFormHTML() {
  const clienteOptions = state.clientes.map(c =>
    `<option value="${c.id}" ${state.currentQuote.cliente_id == c.id ? 'selected' : ''}>${c.razon_social || c.nombre}</option>`
  ).join('')

  return `
    <div class="space-y-5" id="quote-form">
      <!-- Cliente y fecha -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Cliente *</label>
          <select id="q-cliente" class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
            <option value="">Seleccionar cliente...</option>
            ${clienteOptions}
          </select>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Fecha</label>
          <input type="date" id="q-fecha" value="${state.currentQuote.fecha}"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
      </div>

      <!-- Tabla de ítems -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs text-slate-400 uppercase tracking-wide">Ítems</label>
          <button id="btn-agregar-item"
            class="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-600 hover:border-emerald-400 rounded px-2 py-1 transition-colors">
            + Agregar ítem
          </button>
        </div>
        <div class="border border-slate-600 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-750 text-slate-400 text-xs">
                <th class="px-3 py-2 text-left">Producto</th>
                <th class="px-3 py-2 text-left">Descripción</th>
                <th class="px-3 py-2 w-20 text-center">Cant.</th>
                <th class="px-3 py-2 w-28 text-right">Precio Unit.</th>
                <th class="px-3 py-2 w-28 text-right">Subtotal</th>
                <th class="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody id="q-items-tbody">
              ${renderItemRows()}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Totales -->
      <div class="bg-slate-750 border border-slate-600 rounded-lg p-4 space-y-3">
        <div class="flex justify-between text-sm text-slate-300">
          <span>Subtotal</span>
          <span id="q-subtotal" class="font-mono">$ 0</span>
        </div>
        <div class="flex items-center justify-between text-sm text-slate-300">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="q-iva" ${state.currentQuote.iva ? 'checked' : ''}
              class="rounded border-slate-500 text-emerald-500">
            <span>IVA 21%</span>
          </label>
          <span id="q-iva-monto" class="font-mono">$ 0</span>
        </div>
        <div class="flex items-center justify-between text-sm text-slate-300">
          <label class="flex items-center gap-2">
            <span>Descuento</span>
            <div class="flex items-center gap-1">
              <input type="number" id="q-descuento" value="${state.currentQuote.descuento || 0}" min="0" max="100"
                class="w-16 bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-0.5 text-sm text-center">
              <span class="text-slate-500">%</span>
            </div>
          </label>
          <span id="q-descuento-monto" class="font-mono text-red-400">-$ 0</span>
        </div>
        <div class="border-t border-slate-600 pt-3 flex justify-between items-center">
          <span class="text-slate-200 font-semibold">TOTAL</span>
          <span id="q-total" class="text-2xl font-bold text-emerald-400 font-mono">$ 0</span>
        </div>
      </div>

      <!-- Notas -->
      <div>
        <label class="block text-xs text-slate-400 mb-1">Notas / Observaciones</label>
        <textarea id="q-notas" rows="2" placeholder="Condiciones de pago, validez, aclaraciones..."
          class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm resize-none">${state.currentQuote.notas || ''}</textarea>
      </div>
    </div>
  `
}

function renderItemRows() {
  if (!state.currentQuote.items.length) {
    return `<tr id="q-empty-row"><td colspan="6" class="px-3 py-4 text-center text-slate-500 text-xs">Sin ítems. Hacé clic en "+ Agregar ítem".</td></tr>`
  }
  return state.currentQuote.items.map((item, idx) => renderItemRow(item, idx)).join('')
}

function renderItemRow(item, idx) {
  const subtotal = (item.cant || 0) * (item.precio || 0)
  return `
    <tr class="border-t border-slate-700 q-item-row" data-idx="${idx}">
      <td class="px-2 py-1.5">
        <input type="text" class="q-producto w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1 text-xs"
          value="${item.producto || ''}" placeholder="Código / nombre..." data-idx="${idx}">
      </td>
      <td class="px-2 py-1.5">
        <input type="text" class="q-descripcion w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1 text-xs"
          value="${item.descripcion || ''}" placeholder="Descripción..." data-idx="${idx}">
      </td>
      <td class="px-2 py-1.5">
        <input type="number" class="q-cant w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1 text-xs text-center"
          value="${item.cant || 1}" min="1" data-idx="${idx}">
      </td>
      <td class="px-2 py-1.5">
        <input type="number" class="q-precio w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1 text-xs text-right"
          value="${item.precio || ''}" placeholder="0" data-idx="${idx}">
      </td>
      <td class="px-2 py-1.5 text-right text-slate-200 font-mono text-xs q-row-subtotal">${formatMoney(subtotal)}</td>
      <td class="px-2 py-1.5 text-center">
        <button class="btn-del-item text-red-400 hover:text-red-300 text-xs" data-idx="${idx}">✕</button>
      </td>
    </tr>
  `
}

function bindQuoteFormEvents(modal, root) {
  const form = modal.querySelector('#quote-form')
  if (!form) return

  // Add item
  modal.querySelector('#btn-agregar-item')?.addEventListener('click', () => {
    state.currentQuote.items.push({ producto: '', descripcion: '', cant: 1, precio: 0 })
    refreshItemTable(modal)
    recalcTotals(modal)
  })

  // Delegated events on items
  modal.querySelector('#q-items-tbody')?.addEventListener('input', e => {
    const idx = parseInt(e.target.dataset.idx)
    if (isNaN(idx)) return
    const item = state.currentQuote.items[idx]
    if (!item) return
    if (e.target.classList.contains('q-producto')) item.producto = e.target.value
    if (e.target.classList.contains('q-descripcion')) item.descripcion = e.target.value
    if (e.target.classList.contains('q-cant')) item.cant = parseFloat(e.target.value) || 0
    if (e.target.classList.contains('q-precio')) item.precio = parseFloat(e.target.value) || 0
    // Update subtotal cell
    const row = e.target.closest('.q-item-row')
    if (row) {
      row.querySelector('.q-row-subtotal').textContent = formatMoney(item.cant * item.precio)
    }
    recalcTotals(modal)
  })

  modal.querySelector('#q-items-tbody')?.addEventListener('click', e => {
    if (e.target.closest('.btn-del-item')) {
      const idx = parseInt(e.target.closest('.btn-del-item').dataset.idx)
      state.currentQuote.items.splice(idx, 1)
      refreshItemTable(modal)
      recalcTotals(modal)
    }
  })

  // IVA / Descuento
  modal.querySelector('#q-iva')?.addEventListener('change', e => {
    state.currentQuote.iva = e.target.checked
    recalcTotals(modal)
  })
  modal.querySelector('#q-descuento')?.addEventListener('input', e => {
    state.currentQuote.descuento = parseFloat(e.target.value) || 0
    recalcTotals(modal)
  })

  // Footer buttons
  modal.querySelector('#btn-cancelar-quote')?.addEventListener('click', () => Modal.close())
  modal.querySelector('#btn-guardar-borrador')?.addEventListener('click', () => saveQuote('borrador', root))
  modal.querySelector('#btn-emitir-quote')?.addEventListener('click', () => saveQuote('enviado', root))

  recalcTotals(modal)
}

function refreshItemTable(modal) {
  const tbody = modal.querySelector('#q-items-tbody')
  if (tbody) tbody.innerHTML = renderItemRows()
}

function recalcTotals(modal) {
  const items = state.currentQuote.items
  const subtotal = items.reduce((s, i) => s + (i.cant || 0) * (i.precio || 0), 0)
  const ivaMonto = state.currentQuote.iva ? subtotal * 0.21 : 0
  const descPct = state.currentQuote.descuento || 0
  const descMonto = (subtotal + ivaMonto) * (descPct / 100)
  const total = subtotal + ivaMonto - descMonto

  modal.querySelector('#q-subtotal')&&(modal.querySelector('#q-subtotal').textContent = formatMoney(subtotal))
  modal.querySelector('#q-iva-monto')&&(modal.querySelector('#q-iva-monto').textContent = formatMoney(ivaMonto))
  modal.querySelector('#q-descuento-monto')&&(modal.querySelector('#q-descuento-monto').textContent = `-${formatMoney(descMonto)}`)
  modal.querySelector('#q-total')&&(modal.querySelector('#q-total').textContent = formatMoney(total))
  state.currentQuote.total = total
}

function saveQuote(estado, root) {
  const modal = document.querySelector('#modal-overlay')
  if (!modal) return
  const clienteId = modal.querySelector('#q-cliente')?.value
  if (!clienteId) { toast('Seleccioná un cliente', 'error'); return }
  state.currentQuote.cliente_id = clienteId
  state.currentQuote.fecha = modal.querySelector('#q-fecha')?.value || state.currentQuote.fecha
  state.currentQuote.notas = modal.querySelector('#q-notas')?.value || ''
  state.currentQuote.estado = estado

  if (!state.currentQuote.id) {
    state.currentQuote.id = Date.now()
    state.presupuestos.unshift({ ...state.currentQuote })
  } else {
    const idx = state.presupuestos.findIndex(p => p.id === state.currentQuote.id)
    if (idx >= 0) state.presupuestos[idx] = { ...state.currentQuote }
  }

  Modal.close()

  if (estado === 'enviado') {
    toast('Presupuesto emitido ✓', 'success')
    // Prompt to deduct from stock
    const hasStock = state.stockItems.some(s => s.cliente_id == state.currentQuote.cliente_id)
    if (hasStock) {
      setTimeout(() => {
        if (confirm('¿Descontás los ítems del stock del cliente?')) {
          deductFromStock(state.currentQuote)
        }
      }, 300)
    }
    setTimeout(() => openPrintView(state.currentQuote), 600)
  } else {
    toast('Borrador guardado', 'info')
  }

  renderActiveTab(root)
}

// ─── Print View ───────────────────────────────────────────────────────────────
function openPrintView(pres) {
  const cliente = state.clientes.find(c => c.id == pres.cliente_id)
  const itemsRows = (pres.items || []).map(i => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${i.producto || ''}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${i.descripcion || ''}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.cant}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(i.precio)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(i.cant * i.precio)}</td>
    </tr>
  `).join('')

  const subtotal = (pres.items || []).reduce((s, i) => s + i.cant * i.precio, 0)
  const ivaMonto = pres.iva ? subtotal * 0.21 : 0
  const descPct = pres.descuento || 0
  const descMonto = (subtotal + ivaMonto) * (descPct / 100)

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Presupuesto #${String(pres.id).padStart(4,'0')}</title>
<style>
  body{font-family:Arial,sans-serif;color:#111;max-width:800px;margin:40px auto;padding:0 20px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
  .company{font-size:22px;font-weight:700;color:#059669}
  .meta{text-align:right;font-size:13px;color:#6b7280}
  table{width:100%;border-collapse:collapse;margin:20px 0}
  th{background:#f9fafb;padding:8px;text-align:left;border-bottom:2px solid #e5e7eb;font-size:12px;text-transform:uppercase;color:#6b7280}
  .totals{margin-left:auto;width:300px}
  .totals td{padding:4px 8px;font-size:14px}
  .total-row td{font-size:18px;font-weight:700;color:#059669;border-top:2px solid #e5e7eb;padding-top:8px}
  .notas{margin-top:24px;padding:12px;background:#f9fafb;border-radius:6px;font-size:13px;color:#374151}
  @media print{.no-print{display:none}}
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="company">AdminYAAA</div>
    <div style="font-size:13px;color:#6b7280;margin-top:4px">Servicios Administrativos</div>
  </div>
  <div class="meta">
    <div style="font-size:18px;font-weight:700">PRESUPUESTO N° ${String(pres.id).padStart(4,'0')}</div>
    <div>Fecha: ${formatDate(pres.fecha)}</div>
    <div>Estado: ${pres.estado?.toUpperCase()}</div>
  </div>
</div>

<div style="margin-bottom:20px">
  <strong>Cliente:</strong> ${cliente?.razon_social || cliente?.nombre || '—'}<br>
  ${cliente?.cuit ? `<strong>CUIT:</strong> ${cliente.cuit}` : ''}
</div>

<table>
  <thead>
    <tr>
      <th>Producto</th><th>Descripción</th><th style="text-align:center">Cant.</th>
      <th style="text-align:right">Precio Unit.</th><th style="text-align:right">Subtotal</th>
    </tr>
  </thead>
  <tbody>${itemsRows}</tbody>
</table>

<table class="totals">
  <tr><td>Subtotal</td><td style="text-align:right">${formatMoney(subtotal)}</td></tr>
  ${pres.iva ? `<tr><td>IVA 21%</td><td style="text-align:right">${formatMoney(ivaMonto)}</td></tr>` : ''}
  ${descPct ? `<tr><td>Descuento ${descPct}%</td><td style="text-align:right;color:#dc2626">-${formatMoney(descMonto)}</td></tr>` : ''}
  <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${formatMoney(pres.total)}</td></tr>
</table>

${pres.notas ? `<div class="notas"><strong>Observaciones:</strong> ${pres.notas}</div>` : ''}

<div class="no-print" style="margin-top:32px;display:flex;gap:12px">
  <button onclick="window.print()" style="padding:10px 20px;background:#059669;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">🖨️ Imprimir</button>
  <button onclick="navigator.clipboard.writeText(document.body.innerText).then(()=>alert('Copiado al portapapeles'))"
    style="padding:10px 20px;background:#374151;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">📋 Copiar texto</button>
</div>
</body></html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

function deductFromStock(pres) {
  pres.items.forEach(item => {
    const stock = state.stockItems.find(s =>
      s.cliente_id == pres.cliente_id &&
      (s.codigo === item.producto || s.descripcion?.toLowerCase().includes(item.producto?.toLowerCase()))
    )
    if (stock) {
      stock.stock_actual = Math.max(0, (stock.stock_actual || 0) - (item.cant || 0))
    }
  })
  toast('Stock actualizado', 'success')
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 2: CATÁLOGO DE STOCK
// ══════════════════════════════════════════════════════════════════════════════

async function renderStockTab(content, root) {
  if (!state.stockFilters.clienteId && state.clientes.length) {
    state.stockFilters.clienteId = state.clientes[0].id
  }
  await loadStockForClient(state.stockFilters.clienteId)

  content.innerHTML = `
    <div class="space-y-4">
      ${renderStockToolbar()}
      ${renderStockTable()}
    </div>
  `
  bindStockEvents(content, root)
}

function renderStockToolbar() {
  const clienteOptions = state.clientes.map(c =>
    `<option value="${c.id}" ${state.stockFilters.clienteId == c.id ? 'selected' : ''}>${c.razon_social || c.nombre}</option>`
  ).join('')

  return `
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <label class="text-sm text-slate-400">Cliente:</label>
        <select id="stock-cliente" class="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5 min-w-[200px]">
          ${clienteOptions}
        </select>
      </div>
      <input type="text" id="stock-search" value="${state.stockFilters.search}"
        placeholder="Buscar por código o descripción..."
        class="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5 flex-1 min-w-[200px]">
      <button id="btn-agregar-producto"
        class="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors ml-auto">
        + Agregar Producto
      </button>
    </div>
  `
}

function renderStockTable() {
  const filtered = getFilteredStock()
  if (!filtered.length) {
    return `<div class="text-center text-slate-500 py-16">No hay productos en el catálogo de este cliente.</div>`
  }

  const rows = filtered.map(item => {
    const stockNum = item.stock_actual ?? 0
    const minNum = item.stock_minimo ?? 0
    let estadoBadge = `<span class="px-2 py-0.5 rounded text-xs font-medium bg-emerald-900 text-emerald-300">OK</span>`
    let rowClass = ''
    if (stockNum === 0) {
      estadoBadge = `<span class="px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300">Agotado</span>`
      rowClass = 'bg-red-950/30'
    } else if (stockNum <= minNum) {
      estadoBadge = `<span class="px-2 py-0.5 rounded text-xs font-medium bg-amber-900 text-amber-300">Bajo</span>`
      rowClass = 'bg-amber-950/30'
    }

    return `
      <tr class="border-t border-slate-700 hover:bg-slate-750 transition-colors ${rowClass}">
        <td class="px-4 py-3 font-mono text-xs text-slate-400">${item.codigo || '—'}</td>
        <td class="px-4 py-3 text-slate-200 text-sm">${item.descripcion}</td>
        <td class="px-4 py-3 text-slate-400 text-sm text-center">${item.unidad || 'u'}</td>
        <td class="px-4 py-3 text-slate-100 text-sm text-right font-mono">${formatMoney(item.precio_unit)}</td>
        <td class="px-4 py-3 text-slate-100 text-sm text-center font-bold ${stockNum === 0 ? 'text-red-400' : stockNum <= minNum ? 'text-amber-400' : ''}">${stockNum}</td>
        <td class="px-4 py-3 text-slate-400 text-sm text-center">${minNum}</td>
        <td class="px-4 py-3">${estadoBadge}</td>
        <td class="px-4 py-3">
          <div class="flex gap-2">
            <button class="btn-ajuste-stock text-xs text-emerald-400 hover:text-emerald-300 transition-colors" data-id="${item.id}" title="Ajustar stock">⚡</button>
            <button class="btn-edit-stock text-xs text-slate-400 hover:text-blue-400 transition-colors" data-id="${item.id}" title="Editar">✏️</button>
            <button class="btn-del-stock text-xs text-slate-400 hover:text-red-400 transition-colors" data-id="${item.id}" title="Eliminar">🗑️</button>
          </div>
        </td>
      </tr>
    `
  }).join('')

  return `
    <div class="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-750 text-slate-400 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 text-left">Código</th>
            <th class="px-4 py-3 text-left">Descripción</th>
            <th class="px-4 py-3 text-center">Unidad</th>
            <th class="px-4 py-3 text-right">Precio Unit.</th>
            <th class="px-4 py-3 text-center">Stock Actual</th>
            <th class="px-4 py-3 text-center">Stock Mín.</th>
            <th class="px-4 py-3 text-left">Estado</th>
            <th class="px-4 py-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

function getFilteredStock() {
  const search = state.stockFilters.search.toLowerCase()
  return state.stockItems.filter(item => {
    if (item.cliente_id != state.stockFilters.clienteId) return false
    if (search && !item.codigo?.toLowerCase().includes(search) && !item.descripcion?.toLowerCase().includes(search)) return false
    return true
  })
}

async function loadStockForClient(clienteId) {
  if (!clienteId) return
  try {
    const items = await StockAPI.getByCliente(clienteId)
    state.stockItems = state.stockItems.filter(s => s.cliente_id != clienteId).concat(items)
  } catch {
    if (!state.stockItems.some(s => s.cliente_id == clienteId)) {
      state.stockItems.push(...getMockStock(clienteId))
    }
  }
}

function bindStockEvents(content, root) {
  content.querySelector('#stock-cliente')?.addEventListener('change', async e => {
    state.stockFilters.clienteId = e.target.value
    await loadStockForClient(e.target.value)
    renderStockTab(content, root)
  })

  content.querySelector('#stock-search')?.addEventListener('input', e => {
    state.stockFilters.search = e.target.value
    const tableWrapper = content.querySelector('.bg-slate-800.border')
    if (tableWrapper) {
      const tmp = document.createElement('div')
      tmp.innerHTML = renderStockTable()
      tableWrapper.replaceWith(tmp.firstElementChild || tmp)
    }
  })

  content.querySelector('#btn-agregar-producto')?.addEventListener('click', () => {
    openStockModal(root, null, content)
  })

  content.addEventListener('click', e => {
    const id = e.target.closest('[data-id]')?.dataset.id
    if (!id) return
    const item = state.stockItems.find(s => s.id == id)
    if (!item) return

    if (e.target.closest('.btn-ajuste-stock')) {
      openAjusteStockModal(item, content, root)
    }
    if (e.target.closest('.btn-edit-stock')) {
      openStockModal(root, item, content)
    }
    if (e.target.closest('.btn-del-stock')) {
      if (confirm(`¿Eliminar "${item.descripcion}"?`)) {
        state.stockItems = state.stockItems.filter(s => s.id != id)
        toast('Producto eliminado', 'warning')
        renderStockTab(content, root)
      }
    }
  })
}

// ─── Stock Product Modal ───────────────────────────────────────────────────────
function openStockModal(root, existing, content) {
  const modal = Modal.open({
    title: existing ? 'Editar Producto' : 'Agregar Producto',
    size: 'md',
    content: `
      <div class="space-y-4" id="stock-form">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Código</label>
            <input type="text" id="sp-codigo" value="${existing?.codigo || ''}"
              class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm" placeholder="EJ-001">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Unidad</label>
            <select id="sp-unidad" class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
              ${['u','kg','lt','caja','doc','par','mt'].map(u => `<option ${existing?.unidad===u?'selected':''}>${u}</option>`).join('')}
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Descripción *</label>
          <input type="text" id="sp-descripcion" value="${existing?.descripcion || ''}"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm" placeholder="Nombre del producto...">
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Precio Unit.</label>
            <input type="number" id="sp-precio" value="${existing?.precio_unit || ''}"
              class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm" placeholder="0">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Stock Actual</label>
            <input type="number" id="sp-stock-actual" value="${existing?.stock_actual ?? 0}"
              class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Stock Mínimo</label>
            <input type="number" id="sp-stock-min" value="${existing?.stock_minimo ?? 0}"
              class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
          </div>
        </div>
      </div>
    `,
    footer: `
      <button id="btn-cancel-sp" class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancelar</button>
      <button id="btn-save-sp" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg">Guardar</button>
    `,
  })

  modal.querySelector('#btn-cancel-sp')?.addEventListener('click', () => Modal.close())
  modal.querySelector('#btn-save-sp')?.addEventListener('click', () => {
    const descripcion = modal.querySelector('#sp-descripcion')?.value.trim()
    if (!descripcion) { toast('Ingresá una descripción', 'error'); return }
    const item = {
      id: existing?.id || Date.now(),
      cliente_id: state.stockFilters.clienteId,
      codigo: modal.querySelector('#sp-codigo')?.value.trim(),
      descripcion,
      unidad: modal.querySelector('#sp-unidad')?.value,
      precio_unit: parseFloat(modal.querySelector('#sp-precio')?.value) || 0,
      stock_actual: parseFloat(modal.querySelector('#sp-stock-actual')?.value) || 0,
      stock_minimo: parseFloat(modal.querySelector('#sp-stock-min')?.value) || 0,
    }
    if (existing) {
      const idx = state.stockItems.findIndex(s => s.id == existing.id)
      if (idx >= 0) state.stockItems[idx] = item
    } else {
      state.stockItems.push(item)
    }
    Modal.close()
    toast(existing ? 'Producto actualizado' : 'Producto agregado', 'success')
    renderStockTab(content, root)
  })
}

// ─── Ajuste de Stock Modal ────────────────────────────────────────────────────
function openAjusteStockModal(item, content, root) {
  const modal = Modal.open({
    title: `Ajuste de Stock — ${item.descripcion}`,
    size: 'sm',
    content: `
      <div class="space-y-4">
        <div class="bg-slate-750 rounded-lg p-3 text-center">
          <div class="text-slate-400 text-xs">Stock actual</div>
          <div class="text-3xl font-bold text-slate-100 mt-1">${item.stock_actual ?? 0} <span class="text-lg text-slate-400">${item.unidad || 'u'}</span></div>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Tipo de ajuste</label>
          <div class="flex gap-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="ajuste-tipo" value="entrada" checked class="text-emerald-500">
              <span class="text-sm text-emerald-400">Entrada</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="ajuste-tipo" value="salida" class="text-red-400">
              <span class="text-sm text-red-400">Salida</span>
            </label>
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Cantidad *</label>
          <input type="number" id="ajuste-cant" min="1" value="1"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Motivo</label>
          <input type="text" id="ajuste-motivo" placeholder="Compra, uso, devolución..."
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
      </div>
    `,
    footer: `
      <button id="btn-cancel-ajuste" class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancelar</button>
      <button id="btn-save-ajuste" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg">Aplicar Ajuste</button>
    `,
  })

  modal.querySelector('#btn-cancel-ajuste')?.addEventListener('click', () => Modal.close())
  modal.querySelector('#btn-save-ajuste')?.addEventListener('click', () => {
    const tipo = modal.querySelector('input[name="ajuste-tipo"]:checked')?.value
    const cant = parseFloat(modal.querySelector('#ajuste-cant')?.value) || 0
    const motivo = modal.querySelector('#ajuste-motivo')?.value
    if (!cant) { toast('Ingresá una cantidad', 'error'); return }

    const stockItem = state.stockItems.find(s => s.id == item.id)
    if (stockItem) {
      if (tipo === 'entrada') {
        stockItem.stock_actual = (stockItem.stock_actual || 0) + cant
      } else {
        stockItem.stock_actual = Math.max(0, (stockItem.stock_actual || 0) - cant)
      }
      // Log movement (in-memory)
      if (!stockItem.movimientos) stockItem.movimientos = []
      stockItem.movimientos.push({
        fecha: new Date().toISOString(),
        tipo,
        cantidad: cant,
        motivo,
        stock_despues: stockItem.stock_actual,
      })
    }

    Modal.close()
    toast(`Ajuste aplicado: ${tipo === 'entrada' ? '+' : '-'}${cant} ${item.unidad || 'u'}`, 'success')
    renderStockTab(content, root)
  })
}

// ══════════════════════════════════════════════════════════════════════════════
//  MOCK DATA
// ══════════════════════════════════════════════════════════════════════════════

function getMockPresupuestos() {
  return [
    { id: 1001, fecha: '2026-09-15', cliente_id: 1, items: [
      { producto: 'CHAMP-500', descripcion: 'Champú profesional 500ml', cant: 10, precio: 2500 },
      { producto: 'COND-400', descripcion: 'Acondicionador 400ml', cant: 10, precio: 1800 },
    ], iva: true, descuento: 5, total: 52557, estado: 'aprobado', notas: 'Entrega en local.' },
    { id: 1002, fecha: '2026-09-20', cliente_id: 2, items: [
      { producto: 'SERV-MES', descripcion: 'Servicio mensual de administración', cant: 1, precio: 85000 },
    ], iva: false, descuento: 0, total: 85000, estado: 'enviado', notas: '' },
    { id: 1003, fecha: '2026-09-28', cliente_id: 1, items: [
      { producto: 'GEL-200', descripcion: 'Gel fijador 200ml', cant: 24, precio: 1200 },
    ], iva: true, descuento: 0, total: 34752, estado: 'borrador', notas: 'Pendiente confirmación.' },
  ]
}

function getMockClientes() {
  return [
    { id: 1, nombre: 'Martina López', razon_social: 'Peluquería Martina', cuit: '20-28345678-3' },
    { id: 2, nombre: 'Restaurante El Fogón', razon_social: 'El Fogón S.R.L.', cuit: '30-71234567-1' },
    { id: 3, nombre: 'Farmacia Del Centro', razon_social: 'Del Centro S.A.', cuit: '30-62345678-5' },
  ]
}

function getMockStock(clienteId) {
  const base = [
    { id: 101, descripcion: 'Champú profesional 500ml', codigo: 'CHAMP-500', unidad: 'u', precio_unit: 2500, stock_actual: 18, stock_minimo: 10 },
    { id: 102, descripcion: 'Acondicionador 400ml', codigo: 'COND-400', unidad: 'u', precio_unit: 1800, stock_actual: 4, stock_minimo: 10 },
    { id: 103, descripcion: 'Gel fijador 200ml', codigo: 'GEL-200', unidad: 'u', precio_unit: 1200, stock_actual: 0, stock_minimo: 5 },
    { id: 104, descripcion: 'Oxidante en crema 20vol', codigo: 'OXI-20', unidad: 'u', precio_unit: 950, stock_actual: 30, stock_minimo: 8 },
    { id: 105, descripcion: 'Coloración capilar n°7', codigo: 'COL-007', unidad: 'u', precio_unit: 3200, stock_actual: 12, stock_minimo: 6 },
  ]
  return base.map(item => ({ ...item, id: item.id + clienteId * 1000, cliente_id: clienteId }))
}
