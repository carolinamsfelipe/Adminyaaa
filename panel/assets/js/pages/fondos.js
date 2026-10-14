import { FondosAPI, ColaboradoresAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, toast } from '../core/utils.js'

// ─── Estado local ─────────────────────────────────────────────────────────────
let state = {
  colaboradores: [],
  selectedColabId: null,
  fondos: {},
  movimientos: [],
  currentUser: null,
  isAdmin: false,
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export async function renderFondos(container, params) {
  state.currentUser = Auth.getUser()
  state.isAdmin = Auth.hasRole('admin')

  container.innerHTML = `
    <div class="flex flex-col h-full" id="fondos-root">
      <div class="px-6 pt-6 pb-4 border-b border-slate-700">
        <h1 class="text-2xl font-bold text-slate-100">Fondos Fijos</h1>
        <p class="text-slate-400 text-sm mt-1">Gestión de cajas chicas por colaborador</p>
      </div>
      <div class="p-6 space-y-6" id="fondos-content"></div>
    </div>
  `
  await loadData()
  renderContent(container)
}

async function loadData() {
  const [colabs, fondos] = await Promise.all([
    ColaboradoresAPI.getAll().catch(() => getMockColaboradores()),
    FondosAPI.getAll().catch(() => getMockFondos()),
  ])
  state.colaboradores = colabs
  state.fondos = fondos

  if (state.isAdmin) {
    state.selectedColabId = state.selectedColabId || colabs[0]?.id
  } else {
    state.selectedColabId = state.currentUser?.colaborador_id || colabs[0]?.id
  }

  await loadMovimientos(state.selectedColabId)
}

async function loadMovimientos(colabId) {
  try {
    state.movimientos = await FondosAPI.getMovimientos(colabId)
  } catch {
    state.movimientos = getMockMovimientos(colabId)
  }
}

// ─── Main content render ──────────────────────────────────────────────────────
function renderContent(container) {
  const content = container.querySelector('#fondos-content')
  if (!content) return

  const fondo = state.fondos[state.selectedColabId] || { saldo: 0, tope: 50000 }
  const pct = Math.min(100, Math.round((fondo.saldo / fondo.tope) * 100))
  const colab = state.colaboradores.find(c => c.id == state.selectedColabId)

  content.innerHTML = `
    <!-- Selector (admin only) -->
    ${state.isAdmin ? renderColabSelector() : ''}

    <!-- Fondo Status Card -->
    <div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="text-sm text-slate-400">Fondo de ${colab?.nombre || '—'}</div>
          <div class="text-4xl font-bold ${getSaldoColor(fondo.saldo, fondo.tope)} mt-1 font-mono">${formatMoney(fondo.saldo)}</div>
          <div class="text-sm text-slate-500 mt-1">Tope: ${formatMoney(fondo.tope)}</div>
        </div>
        <div class="flex flex-col gap-2">
          <button id="btn-rendir-gasto"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
            💸 Rendir Gasto
          </button>
          ${state.isAdmin ? `
            <button id="btn-reponer-fondo"
              class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
              💰 Reponer Fondo
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Progress bar -->
      <div>
        <div class="flex justify-between text-xs text-slate-500 mb-1">
          <span>Disponible</span>
          <span>${pct}%</span>
        </div>
        <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all ${getBarColor(pct)}" style="width:${pct}%"></div>
        </div>
      </div>
    </div>

    <!-- Movimientos table -->
    <div>
      <h2 class="text-base font-semibold text-slate-200 mb-3">Movimientos</h2>
      ${renderMovimientosTable()}
    </div>
  `

  // Bind events
  content.querySelector('#btn-rendir-gasto')?.addEventListener('click', () => openRendirModal(content, container))
  content.querySelector('#btn-reponer-fondo')?.addEventListener('click', () => openReponerModal(content, container))

  if (state.isAdmin) {
    content.querySelector('#fondo-colab-selector')?.addEventListener('change', async e => {
      state.selectedColabId = e.target.value
      await loadMovimientos(state.selectedColabId)
      renderContent(container)
    })
  }
}

function getSaldoColor(saldo, tope) {
  if (saldo <= 0) return 'text-red-400'
  if (saldo <= tope * 0.2) return 'text-amber-400'
  return 'text-emerald-400'
}

function getBarColor(pct) {
  if (pct <= 20) return 'bg-red-500'
  if (pct <= 50) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function renderColabSelector() {
  const options = state.colaboradores.map(c =>
    `<option value="${c.id}" ${c.id == state.selectedColabId ? 'selected' : ''}>${c.nombre}</option>`
  ).join('')
  return `
    <div class="flex items-center gap-3">
      <label class="text-sm text-slate-400">Colaborador:</label>
      <select id="fondo-colab-selector"
        class="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5 min-w-[200px]">
        ${options}
      </select>
    </div>
  `
}

function renderMovimientosTable() {
  if (!state.movimientos.length) {
    return `<div class="text-center text-slate-500 py-12 bg-slate-800 border border-slate-700 rounded-lg">Sin movimientos registrados.</div>`
  }

  let saldoAcum = 0
  const rows = [...state.movimientos].reverse().map(m => {
    const isGasto = m.tipo === 'gasto'
    if (isGasto) saldoAcum -= m.monto
    else saldoAcum += m.monto

    return `
      <tr class="border-t border-slate-700 hover:bg-slate-750 transition-colors">
        <td class="px-4 py-3 text-slate-400 text-sm">${formatDate(m.fecha)}</td>
        <td class="px-4 py-3">
          ${isGasto
            ? '<span class="px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300">Gasto</span>'
            : '<span class="px-2 py-0.5 rounded text-xs font-medium bg-emerald-900 text-emerald-300">Reposición</span>'}
        </td>
        <td class="px-4 py-3 text-slate-200 text-sm">${m.motivo || m.concepto || '—'}</td>
        <td class="px-4 py-3 text-slate-400 text-xs">${m.categoria || '—'}</td>
        <td class="px-4 py-3 text-right font-mono text-sm ${isGasto ? 'text-red-400' : 'text-emerald-400'}">
          ${isGasto ? '-' : '+'}${formatMoney(m.monto)}
        </td>
        <td class="px-4 py-3 text-slate-400 text-xs">${m.comprobante || '—'}</td>
        <td class="px-4 py-3 text-right font-mono text-sm text-slate-300">${formatMoney(Math.abs(saldoAcum))}</td>
      </tr>
    `
  }).join('')

  return `
    <div class="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-750 text-slate-400 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 text-left">Fecha</th>
            <th class="px-4 py-3 text-left">Tipo</th>
            <th class="px-4 py-3 text-left">Motivo</th>
            <th class="px-4 py-3 text-left">Categoría</th>
            <th class="px-4 py-3 text-right">Monto</th>
            <th class="px-4 py-3 text-left">Comprobante</th>
            <th class="px-4 py-3 text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

// ─── Rendir Gasto Modal ───────────────────────────────────────────────────────
function openRendirModal(content, container) {
  const modal = Modal.open({
    title: '💸 Rendir Gasto',
    size: 'md',
    content: `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Fecha *</label>
            <input type="date" id="rg-fecha" value="${new Date().toISOString().split('T')[0]}"
              class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Monto *</label>
            <input type="number" id="rg-monto" placeholder="0"
              class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm font-mono">
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Categoría</label>
          <select id="rg-categoria" class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
            <option value="viáticos">Viáticos</option>
            <option value="insumos">Insumos de oficina</option>
            <option value="limpieza">Limpieza</option>
            <option value="correo">Correo / envíos</option>
            <option value="combustible">Combustible</option>
            <option value="otros">Otros</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Motivo *</label>
          <input type="text" id="rg-motivo" placeholder="Descripción del gasto..."
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">N° Comprobante / Ticket</label>
          <input type="text" id="rg-comprobante" placeholder="Opcional"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
      </div>
    `,
    footer: `
      <button id="btn-cancel-rg" class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancelar</button>
      <button id="btn-save-rg" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium">Registrar Gasto</button>
    `,
  })

  modal.querySelector('#btn-cancel-rg')?.addEventListener('click', () => Modal.close())
  modal.querySelector('#btn-save-rg')?.addEventListener('click', () => {
    const monto = parseFloat(modal.querySelector('#rg-monto')?.value)
    const motivo = modal.querySelector('#rg-motivo')?.value.trim()
    const fecha = modal.querySelector('#rg-fecha')?.value
    if (!monto || monto <= 0) { toast('Ingresá un monto válido', 'error'); return }
    if (!motivo) { toast('Ingresá el motivo', 'error'); return }

    const fondo = state.fondos[state.selectedColabId]
    if (fondo && monto > fondo.saldo) {
      if (!confirm(`El monto supera el saldo disponible (${formatMoney(fondo.saldo)}). ¿Continuar?`)) return
    }

    const mov = {
      id: Date.now(),
      fecha,
      tipo: 'gasto',
      monto,
      motivo,
      categoria: modal.querySelector('#rg-categoria')?.value,
      comprobante: modal.querySelector('#rg-comprobante')?.value,
    }
    state.movimientos.push(mov)
    if (fondo) fondo.saldo = Math.max(0, fondo.saldo - monto)

    Modal.close()
    toast(`Gasto de ${formatMoney(monto)} registrado`, 'warning')
    renderContent(container)
  })
}

// ─── Reponer Fondo Modal (admin) ──────────────────────────────────────────────
function openReponerModal(content, container) {
  const fondo = state.fondos[state.selectedColabId] || { saldo: 0, tope: 50000 }
  const autoMonto = Math.max(0, fondo.tope - fondo.saldo)

  const modal = Modal.open({
    title: '💰 Reponer Fondo',
    size: 'sm',
    content: `
      <div class="space-y-4">
        <div class="bg-slate-750 rounded-lg p-3 text-center">
          <div class="text-xs text-slate-400">Saldo actual / Tope</div>
          <div class="text-xl font-bold text-slate-100 mt-1">${formatMoney(fondo.saldo)} / ${formatMoney(fondo.tope)}</div>
          <div class="text-xs text-emerald-400 mt-1">Reposición sugerida: ${formatMoney(autoMonto)}</div>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Monto a reponer *</label>
          <input type="number" id="rep-monto" value="${autoMonto}"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm font-mono">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Método</label>
          <select id="rep-metodo" class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
      </div>
    `,
    footer: `
      <button id="btn-cancel-rep" class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancelar</button>
      <button id="btn-save-rep" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg">Confirmar Reposición</button>
    `,
  })

  modal.querySelector('#btn-cancel-rep')?.addEventListener('click', () => Modal.close())
  modal.querySelector('#btn-save-rep')?.addEventListener('click', () => {
    const monto = parseFloat(modal.querySelector('#rep-monto')?.value)
    if (!monto || monto <= 0) { toast('Ingresá un monto', 'error'); return }

    const mov = {
      id: Date.now(),
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'reposicion',
      monto,
      motivo: `Reposición de fondo (${modal.querySelector('#rep-metodo')?.value})`,
      categoria: 'reposición',
    }
    state.movimientos.push(mov)
    if (state.fondos[state.selectedColabId]) {
      state.fondos[state.selectedColabId].saldo = Math.min(
        fondo.tope,
        (state.fondos[state.selectedColabId].saldo || 0) + monto
      )
    }

    Modal.close()
    toast(`Fondo repuesto por ${formatMoney(monto)}`, 'success')
    renderContent(container)
  })
}

// ─── Mock data ────────────────────────────────────────────────────────────────
function getMockColaboradores() {
  return [
    { id: 1, nombre: 'Valeria Rodríguez' },
    { id: 2, nombre: 'Federico Martínez' },
    { id: 3, nombre: 'Carolina González' },
  ]
}

function getMockFondos() {
  return {
    1: { saldo: 18500, tope: 50000 },
    2: { saldo: 8200, tope: 30000 },
    3: { saldo: 42000, tope: 50000 },
  }
}

function getMockMovimientos(colabId) {
  const date = d => {
    const dt = new Date()
    dt.setDate(dt.getDate() - d)
    return dt.toISOString().split('T')[0]
  }
  return [
    { id: 1, fecha: date(20), tipo: 'reposicion', monto: 50000, motivo: 'Reposición mensual (transferencia)', categoria: 'reposición' },
    { id: 2, fecha: date(18), tipo: 'gasto', monto: 4500, motivo: 'Compra resmas A4', categoria: 'insumos', comprobante: 'T-0291' },
    { id: 3, fecha: date(14), tipo: 'gasto', monto: 3200, motivo: 'Café y yerba para oficina', categoria: 'insumos' },
    { id: 4, fecha: date(10), tipo: 'gasto', monto: 8700, motivo: 'Combustible comisiones', categoria: 'combustible', comprobante: 'FC-00891' },
    { id: 5, fecha: date(7), tipo: 'gasto', monto: 2100, motivo: 'Envío Correo Argentino', categoria: 'correo' },
    { id: 6, fecha: date(3), tipo: 'gasto', monto: 13000, motivo: 'Viáticos viaje Rosario', categoria: 'viáticos', comprobante: 'REC-0012' },
  ]
}
