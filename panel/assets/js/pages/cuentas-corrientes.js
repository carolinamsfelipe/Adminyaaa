import { ClientesAPI, PagosAPI, FacturasAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, toast } from '../core/utils.js'

// ─── Estado local ─────────────────────────────────────────────────────────────
let state = {
  clientes: [],
  selectedClienteId: null,
  movimientos: [],
  resumen: { saldo: 0, totalFacturado: 0, totalCobrado: 0 },
  expandedRows: new Set(),
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export async function renderCuentasCorrientes(container, params) {
  container.innerHTML = `
    <div class="flex flex-col h-full" id="cc-root">
      <div class="px-6 pt-6 pb-4 border-b border-slate-700">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-100">Cuentas Corrientes</h1>
            <p class="text-slate-400 text-sm mt-1">Libro Mayor por cliente — movimientos y saldos</p>
          </div>
          <button id="btn-export-csv"
            class="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors border border-slate-600">
            📤 Exportar CSV
          </button>
        </div>
        <div id="cc-top-bar"></div>
      </div>
      <div id="cc-content" class="flex-1 overflow-auto p-6 space-y-4"></div>
    </div>
  `
  await init(container)
}

async function init(container) {
  state.clientes = await ClientesAPI.getAll().catch(() => getMockClientes())
  if (!state.selectedClienteId && state.clientes.length) {
    state.selectedClienteId = state.clientes[0].id
  }
  await loadClienteData()
  renderTopBar(container)
  renderContent(container)
  bindGlobalEvents(container)
}

// ─── Top bar (selector + resumen) ────────────────────────────────────────────
function renderTopBar(container) {
  const topBar = container.querySelector('#cc-top-bar')
  if (!topBar) return

  const options = state.clientes.map(c =>
    `<option value="${c.id}" ${c.id == state.selectedClienteId ? 'selected' : ''}>${c.razon_social || c.nombre}</option>`
  ).join('')

  topBar.innerHTML = `
    <div class="flex flex-wrap items-center gap-6">
      <div class="flex items-center gap-3">
        <label class="text-sm text-slate-400 whitespace-nowrap">Cliente:</label>
        <select id="cc-cliente-selector"
          class="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5 min-w-[220px]">
          ${options}
        </select>
      </div>
      <div class="flex gap-6 ml-auto">
        <div class="text-center">
          <div class="text-xs text-slate-500 uppercase tracking-wide">Total Facturado</div>
          <div class="text-lg font-bold text-slate-200 mt-0.5">${formatMoney(state.resumen.totalFacturado)}</div>
        </div>
        <div class="text-center">
          <div class="text-xs text-slate-500 uppercase tracking-wide">Total Cobrado</div>
          <div class="text-lg font-bold text-emerald-400 mt-0.5">${formatMoney(state.resumen.totalCobrado)}</div>
        </div>
        <div class="text-center border-l border-slate-600 pl-6">
          <div class="text-xs text-slate-500 uppercase tracking-wide">Saldo Actual</div>
          <div class="text-2xl font-bold mt-0.5 ${state.resumen.saldo > 0 ? 'text-red-400' : 'text-emerald-400'}">
            ${formatMoney(Math.abs(state.resumen.saldo))}
            <span class="text-sm font-normal">${state.resumen.saldo > 0 ? ' a cobrar' : state.resumen.saldo < 0 ? ' a favor' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  `
}

// ─── Content ──────────────────────────────────────────────────────────────────
function renderContent(container) {
  const content = container.querySelector('#cc-content')
  if (!content) return

  content.innerHTML = `
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-slate-200">Movimientos</h2>
      <button id="btn-registrar-pago"
        class="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
        💰 Registrar Pago
      </button>
    </div>
    ${renderLedgerTable()}
  `
  bindContentEvents(content, container)
}

function renderLedgerTable() {
  if (!state.movimientos.length) {
    return `<div class="text-center text-slate-500 py-16 bg-slate-800 border border-slate-700 rounded-lg">No hay movimientos registrados para este cliente.</div>`
  }

  let saldoAcum = 0
  const rows = state.movimientos.map(mov => {
    const isDebito = mov.tipo === 'debito'
    if (isDebito) saldoAcum += mov.monto
    else saldoAcum -= mov.monto

    const saldoColor = saldoAcum > 0 ? 'text-red-400' : saldoAcum < 0 ? 'text-emerald-400' : 'text-slate-400'
    const hasDetails = mov.periodo || mov.items?.length
    const isExpanded = state.expandedRows.has(mov.id)

    return `
      <tr class="border-t border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer ledger-row" data-id="${mov.id}">
        <td class="px-4 py-3 text-slate-400 text-sm">${formatDate(mov.fecha)}</td>
        <td class="px-4 py-3">
          ${isDebito
            ? '<span class="px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300">Débito</span>'
            : '<span class="px-2 py-0.5 rounded text-xs font-medium bg-emerald-900 text-emerald-300">Crédito</span>'}
        </td>
        <td class="px-4 py-3 text-slate-200 text-sm">
          ${hasDetails ? `<button class="expand-btn text-xs text-slate-500 mr-1">${isExpanded ? '▼' : '▶'}</button>` : ''}
          ${mov.concepto}
          ${mov.periodo ? `<span class="text-xs text-slate-500 ml-1">${mov.periodo}</span>` : ''}
        </td>
        <td class="px-4 py-3 text-right text-sm font-mono ${isDebito ? 'text-red-400' : 'text-slate-500'}">
          ${isDebito ? formatMoney(mov.monto) : '—'}
        </td>
        <td class="px-4 py-3 text-right text-sm font-mono ${!isDebito ? 'text-emerald-400' : 'text-slate-500'}">
          ${!isDebito ? formatMoney(mov.monto) : '—'}
        </td>
        <td class="px-4 py-3 text-right text-sm font-mono font-semibold ${saldoColor}">
          ${formatMoney(Math.abs(saldoAcum))}
        </td>
        <td class="px-4 py-3 text-xs text-slate-500">${mov.referencia || ''}</td>
      </tr>
      ${isExpanded && mov.detalles ? `
        <tr class="bg-slate-850 border-t border-slate-700">
          <td colspan="7" class="px-8 py-3">
            <div class="text-xs text-slate-400 space-y-1">
              ${mov.detalles.map(d => `<div class="flex justify-between"><span>${d.concepto}</span><span class="font-mono">${formatMoney(d.monto)}</span></div>`).join('')}
            </div>
          </td>
        </tr>
      ` : ''}
    `
  }).join('')

  return `
    <div class="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-750 text-slate-400 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 text-left w-28">Fecha</th>
            <th class="px-4 py-3 text-left w-24">Tipo</th>
            <th class="px-4 py-3 text-left">Concepto</th>
            <th class="px-4 py-3 text-right w-32">Débito</th>
            <th class="px-4 py-3 text-right w-32">Crédito</th>
            <th class="px-4 py-3 text-right w-32">Saldo Acum.</th>
            <th class="px-4 py-3 text-left w-36">Referencia</th>
          </tr>
        </thead>
        <tbody id="ledger-tbody">${rows}</tbody>
      </table>
    </div>
  `
}

function bindContentEvents(content, container) {
  // Expandable rows
  content.addEventListener('click', e => {
    const row = e.target.closest('.ledger-row')
    if (row && (e.target.closest('.expand-btn') || e.target.closest('.ledger-row') === row)) {
      const id = row.dataset.id
      if (state.expandedRows.has(id)) state.expandedRows.delete(id)
      else state.expandedRows.add(id)
      renderContent(container)
    }
  })

  // Registrar pago
  content.querySelector('#btn-registrar-pago')?.addEventListener('click', () => {
    openPagoModal(container)
  })
}

function bindGlobalEvents(container) {
  container.querySelector('#cc-cliente-selector')?.addEventListener('change', async e => {
    state.selectedClienteId = e.target.value
    state.expandedRows.clear()
    await loadClienteData()
    renderTopBar(container)
    renderContent(container)
  })

  container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
    exportCSV()
  })
}

// ─── Pago Modal ───────────────────────────────────────────────────────────────
function openPagoModal(container) {
  const saldoDeudor = state.resumen.saldo
  const modal = Modal.open({
    title: 'Registrar Pago',
    size: 'md',
    content: `
      <div class="space-y-4">
        ${saldoDeudor > 0 ? `
          <div class="bg-slate-750 border border-slate-600 rounded-lg p-3">
            <div class="text-xs text-slate-400 uppercase tracking-wide mb-2">Preview FIFO — imputación automática</div>
            <div class="text-sm text-slate-300">Saldo a cubrir: <span class="font-mono font-bold text-red-400">${formatMoney(saldoDeudor)}</span></div>
            <div class="text-xs text-slate-500 mt-1">El pago se imputará a los débitos más antiguos primero.</div>
          </div>
        ` : `<div class="bg-emerald-900/30 border border-emerald-700 rounded-lg p-3 text-sm text-emerald-300">Este cliente no tiene saldo deudor al momento.</div>`}
        <div>
          <label class="block text-xs text-slate-400 mb-1">Fecha *</label>
          <input type="date" id="pago-fecha" value="${new Date().toISOString().split('T')[0]}"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Monto *</label>
          <input type="number" id="pago-monto" value="${Math.max(0, saldoDeudor)}"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm font-mono">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Cuenta destino</label>
          <select id="pago-cuenta" class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
            <option value="banco_nacion">Banco Nación</option>
            <option value="banco_galicia">Banco Galicia</option>
            <option value="mercadopago">MercadoPago</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Referencia / Comprobante</label>
          <input type="text" id="pago-referencia" placeholder="N° de transferencia, recibo, etc."
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
      </div>
    `,
    footer: `
      <button id="btn-cancel-pago" class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancelar</button>
      <button id="btn-save-pago" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium">Registrar Pago</button>
    `,
  })

  modal.querySelector('#btn-cancel-pago')?.addEventListener('click', () => Modal.close())
  modal.querySelector('#btn-save-pago')?.addEventListener('click', () => {
    const monto = parseFloat(modal.querySelector('#pago-monto')?.value)
    const fecha = modal.querySelector('#pago-fecha')?.value
    const cuenta = modal.querySelector('#pago-cuenta')?.value
    const referencia = modal.querySelector('#pago-referencia')?.value

    if (!monto || monto <= 0) { toast('Ingresá un monto válido', 'error'); return }
    if (!fecha) { toast('Ingresá una fecha', 'error'); return }

    const credito = {
      id: `mov-${Date.now()}`,
      fecha,
      tipo: 'credito',
      concepto: `Pago recibido — ${cuentaLabel(cuenta)}`,
      monto,
      referencia,
      cuenta_destino: cuenta,
    }

    state.movimientos.push(credito)
    state.movimientos.sort((a, b) => a.fecha.localeCompare(b.fecha))
    recalcResumen()

    Modal.close()
    toast(`Pago de ${formatMoney(monto)} registrado ✓`, 'success')
    renderTopBar(container)
    renderContent(container)
  })
}

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadClienteData() {
  const clienteId = state.selectedClienteId
  if (!clienteId) return

  try {
    const [facturas, pagos] = await Promise.all([
      FacturasAPI.getByCliente(clienteId).catch(() => []),
      PagosAPI.getByCliente(clienteId).catch(() => []),
    ])
    buildMovimientos(facturas, pagos)
  } catch {
    state.movimientos = getMockMovimientos(clienteId)
    recalcResumen()
  }

  if (!state.movimientos.length) {
    state.movimientos = getMockMovimientos(clienteId)
  }
  recalcResumen()
}

function buildMovimientos(facturas, pagos) {
  const movs = []
  facturas.forEach(f => {
    movs.push({
      id: `fac-${f.id}`,
      fecha: f.fecha,
      tipo: 'debito',
      concepto: `Factura ${f.numero || f.id}`,
      monto: f.total,
      periodo: f.periodo,
      referencia: f.numero,
      detalles: f.items,
    })
  })
  pagos.forEach(p => {
    movs.push({
      id: `pag-${p.id}`,
      fecha: p.fecha,
      tipo: 'credito',
      concepto: `Pago recibido`,
      monto: p.monto,
      referencia: p.referencia || p.comprobante,
    })
  })
  movs.sort((a, b) => a.fecha.localeCompare(b.fecha))
  state.movimientos = movs
}

function recalcResumen() {
  let totalFact = 0, totalCobrado = 0
  state.movimientos.forEach(m => {
    if (m.tipo === 'debito') totalFact += m.monto
    else totalCobrado += m.monto
  })
  state.resumen = {
    totalFacturado: totalFact,
    totalCobrado,
    saldo: totalFact - totalCobrado,
  }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV() {
  const cliente = state.clientes.find(c => c.id == state.selectedClienteId)
  const nombre = cliente?.razon_social || cliente?.nombre || 'cliente'

  let saldoAcum = 0
  const header = 'Fecha,Tipo,Concepto,Débito,Crédito,Saldo Acumulado,Referencia\n'
  const rows = state.movimientos.map(m => {
    const isDebito = m.tipo === 'debito'
    if (isDebito) saldoAcum += m.monto
    else saldoAcum -= m.monto
    const debito = isDebito ? m.monto : ''
    const credito = !isDebito ? m.monto : ''
    return [
      formatDate(m.fecha),
      isDebito ? 'Débito' : 'Crédito',
      `"${m.concepto}"`,
      debito,
      credito,
      saldoAcum.toFixed(2),
      m.referencia || '',
    ].join(',')
  }).join('\n')

  const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cuenta-corriente-${nombre.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast('CSV exportado', 'success')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cuentaLabel(val) {
  const map = { banco_nacion: 'Banco Nación', banco_galicia: 'Banco Galicia', mercadopago: 'MercadoPago', efectivo: 'Efectivo' }
  return map[val] || val
}

// ─── Mock data ────────────────────────────────────────────────────────────────
function getMockClientes() {
  return [
    { id: 1, nombre: 'Martina López', razon_social: 'Peluquería Martina' },
    { id: 2, nombre: 'El Fogón S.R.L.', razon_social: 'El Fogón S.R.L.' },
    { id: 3, nombre: 'Farmacia Del Centro', razon_social: 'Farmacia Del Centro S.A.' },
  ]
}

function getMockMovimientos(clienteId) {
  const base = [
    { id: 'm1', fecha: '2026-07-01', tipo: 'debito', concepto: 'Factura Julio 2026', monto: 78000, periodo: 'Jul-2026', referencia: 'FAC-0041',
      detalles: [{ concepto: 'Honorarios administración', monto: 65000 }, { concepto: 'Gestión AFIP', monto: 13000 }] },
    { id: 'm2', fecha: '2026-07-15', tipo: 'credito', concepto: 'Pago recibido — Transferencia', monto: 78000, referencia: 'TRF-00912' },
    { id: 'm3', fecha: '2026-08-01', tipo: 'debito', concepto: 'Factura Agosto 2026', monto: 82000, periodo: 'Ago-2026', referencia: 'FAC-0048' },
    { id: 'm4', fecha: '2026-08-20', tipo: 'credito', concepto: 'Pago parcial — Efectivo', monto: 50000, referencia: 'REC-0019' },
    { id: 'm5', fecha: '2026-09-01', tipo: 'debito', concepto: 'Factura Septiembre 2026', monto: 85000, periodo: 'Sep-2026', referencia: 'FAC-0055' },
  ]
  return base.map((m, i) => ({ ...m, id: `${clienteId}-${m.id}` }))
}
