import { ColaboradoresAPI, SueldosAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, toast } from '../core/utils.js'

// ─── Estado local ─────────────────────────────────────────────────────────────
let state = {
  activeTab: 'liquidaciones',
  colaboradores: [],
  liquidaciones: [],
  prestamos: [],
  periodoActual: getPeriodoActual(),
  sobreInput: 0,
}

function getPeriodoActual() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export async function renderSueldos(container, params) {
  container.innerHTML = `
    <div class="flex flex-col h-full" id="sueldos-root">
      <div class="px-6 pt-6 pb-0">
        <h1 class="text-2xl font-bold text-slate-100">Sueldos & Préstamos</h1>
        <p class="text-slate-400 text-sm mt-1">Liquidaciones de haberes, préstamos al personal y generador de sobre</p>
      </div>
      ${renderTabs()}
      <div id="tab-content" class="flex-1 overflow-auto p-6"></div>
    </div>
  `
  await loadData()
  bindTabEvents(container)
  renderActiveTab(container)
}

function renderTabs() {
  const tabs = [
    { id: 'liquidaciones', label: '📋 Liquidaciones' },
    { id: 'prestamos', label: '💳 Préstamos' },
    { id: 'sobre', label: '✉️ Generador de Sobre' },
  ]
  return `
    <div class="px-6 mt-4 border-b border-slate-700">
      <nav class="flex gap-1" id="main-tabs">
        ${tabs.map(t => `
          <button data-tab="${t.id}"
            class="tab-btn px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                   ${state.activeTab === t.id ? 'bg-slate-700 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200'}">
            ${t.label}
          </button>
        `).join('')}
      </nav>
    </div>
  `
}

function bindTabEvents(container) {
  container.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn')
    if (!btn) return
    state.activeTab = btn.dataset.tab
    container.querySelectorAll('.tab-btn').forEach(b => {
      const isActive = b.dataset.tab === state.activeTab
      b.className = `tab-btn px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        isActive ? 'bg-slate-700 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200'
      }`
    })
    renderActiveTab(container)
  })
}

async function loadData() {
  const [colabs, liqs, prest] = await Promise.all([
    ColaboradoresAPI.getAll().catch(() => getMockColaboradores()),
    SueldosAPI.getLiquidaciones().catch(() => getMockLiquidaciones()),
    SueldosAPI.getPrestamos().catch(() => getMockPrestamos()),
  ])
  state.colaboradores = colabs
  state.liquidaciones = liqs
  state.prestamos = prest
}

function renderActiveTab(container) {
  const content = container.querySelector('#tab-content')
  if (!content) return
  if (state.activeTab === 'liquidaciones') renderLiquidacionesTab(content, container)
  else if (state.activeTab === 'prestamos') renderPrestamosTab(content, container)
  else renderSobreTab(content, container)
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 1: LIQUIDACIONES
// ══════════════════════════════════════════════════════════════════════════════

function renderLiquidacionesTab(content, root) {
  const [year, month] = state.periodoActual.split('-')
  const filtradas = state.liquidaciones.filter(l => l.periodo === state.periodoActual)

  content.innerHTML = `
    <div class="space-y-4">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm text-slate-400">Período:</label>
          <input type="month" id="periodo-selector" value="${state.periodoActual}"
            class="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5">
        </div>
        <div class="text-sm text-slate-400 ml-2">
          ${filtradas.length} liquidaciones — Neto total:
          <span class="text-slate-100 font-semibold">${formatMoney(filtradas.reduce((s, l) => s + l.neto, 0))}</span>
        </div>
        <button id="btn-nueva-liq"
          class="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
          + Nueva Liquidación
        </button>
      </div>

      <!-- Table -->
      <div class="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-750 text-slate-400 text-xs uppercase tracking-wide">
              <th class="px-4 py-3 text-left">Colaborador</th>
              <th class="px-4 py-3 text-right">Sueldo Base</th>
              <th class="px-4 py-3 text-right">Adicionales</th>
              <th class="px-4 py-3 text-right">Descuentos</th>
              <th class="px-4 py-3 text-right">Neto</th>
              <th class="px-4 py-3 text-left">Estado</th>
              <th class="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filtradas.length ? filtradas.map(l => renderLiqRow(l)).join('') :
              `<tr><td colspan="7" class="px-4 py-10 text-center text-slate-500">Sin liquidaciones para este período.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `

  content.querySelector('#periodo-selector')?.addEventListener('change', e => {
    state.periodoActual = e.target.value
    renderLiquidacionesTab(content, root)
  })
  content.querySelector('#btn-nueva-liq')?.addEventListener('click', () => openNuevaLiqModal(content, root))

  content.addEventListener('click', e => {
    const liqId = e.target.closest('[data-liq-id]')?.dataset.liqId
    if (!liqId) return
    if (e.target.closest('.btn-edit-liq')) {
      const liq = state.liquidaciones.find(l => l.id == liqId)
      if (liq) openNuevaLiqModal(content, root, liq)
    }
    if (e.target.closest('.btn-pagar-liq')) {
      const liq = state.liquidaciones.find(l => l.id == liqId)
      if (liq) { liq.estado = 'pagada'; toast('Liquidación marcada como pagada', 'success'); renderLiquidacionesTab(content, root) }
    }
    if (e.target.closest('.btn-del-liq')) {
      if (confirm('¿Eliminar esta liquidación?')) {
        state.liquidaciones = state.liquidaciones.filter(l => l.id != liqId)
        toast('Liquidación eliminada', 'warning')
        renderLiquidacionesTab(content, root)
      }
    }
  })
}

function renderLiqRow(l) {
  const colab = state.colaboradores.find(c => c.id == l.colaborador_id)
  const estadoBadges = {
    borrador: 'bg-slate-600 text-slate-300',
    pendiente: 'bg-amber-900 text-amber-300',
    pagada: 'bg-emerald-900 text-emerald-300',
  }
  return `
    <tr class="border-t border-slate-700 hover:bg-slate-750 transition-colors" data-liq-id="${l.id}">
      <td class="px-4 py-3 text-slate-200 text-sm font-medium">${colab?.nombre || '—'}</td>
      <td class="px-4 py-3 text-right text-slate-300 text-sm font-mono">${formatMoney(l.sueldo_base)}</td>
      <td class="px-4 py-3 text-right text-emerald-400 text-sm font-mono">+${formatMoney(l.adicionales_total || 0)}</td>
      <td class="px-4 py-3 text-right text-red-400 text-sm font-mono">-${formatMoney(l.descuentos_total || 0)}</td>
      <td class="px-4 py-3 text-right text-slate-100 text-sm font-bold font-mono">${formatMoney(l.neto)}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-xs font-medium ${estadoBadges[l.estado] || estadoBadges.borrador}">${l.estado}</span></td>
      <td class="px-4 py-3">
        <div class="flex gap-2">
          <button class="btn-edit-liq text-xs text-slate-400 hover:text-blue-400" title="Editar">✏️</button>
          ${l.estado !== 'pagada' ? `<button class="btn-pagar-liq text-xs text-slate-400 hover:text-emerald-400" title="Marcar pagada">✓</button>` : ''}
          <button class="btn-del-liq text-xs text-slate-400 hover:text-red-400" title="Eliminar">🗑️</button>
        </div>
      </td>
    </tr>
  `
}

function openNuevaLiqModal(content, root, existing = null) {
  const colabOptions = state.colaboradores.map(c =>
    `<option value="${c.id}" ${existing?.colaborador_id == c.id ? 'selected' : ''}>${c.nombre}</option>`
  ).join('')

  let adicionales = existing?.adicionales || []
  if (!adicionales.length) adicionales = [{ concepto: '', monto: 0 }]

  const modal = Modal.open({
    title: existing ? 'Editar Liquidación' : 'Nueva Liquidación',
    size: 'lg',
    content: buildLiqFormHTML(colabOptions, existing, adicionales),
    footer: `
      <button id="btn-cancel-liq" class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancelar</button>
      <button id="btn-save-liq" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg">Guardar</button>
    `,
  })

  bindLiqFormEvents(modal, existing, adicionales, content, root)
}

function buildLiqFormHTML(colabOptions, existing, adicionales) {
  const adicionalesRows = adicionales.map((a, i) => `
    <div class="flex gap-2 adicional-row" data-idx="${i}">
      <input type="text" class="ad-concepto flex-1 bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1.5 text-sm" placeholder="Concepto" value="${a.concepto}">
      <input type="number" class="ad-monto w-28 bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1.5 text-sm text-right" placeholder="Monto" value="${a.monto || ''}">
      <button class="btn-del-ad text-red-400 hover:text-red-300 text-sm px-1">✕</button>
    </div>
  `).join('')

  return `
    <div class="space-y-4" id="liq-form">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Colaborador *</label>
          <select id="liq-colab" class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
            <option value="">Seleccionar...</option>${colabOptions}
          </select>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Período</label>
          <input type="month" id="liq-periodo" value="${existing?.periodo || state.periodoActual}"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
      </div>

      <div>
        <label class="block text-xs text-slate-400 mb-1">Sueldo Base *</label>
        <input type="number" id="liq-base" value="${existing?.sueldo_base || ''}"
          class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm font-mono">
      </div>

      <!-- Adicionales -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs text-slate-400 uppercase tracking-wide">Adicionales</label>
          <button id="btn-add-adicional" class="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-700 rounded px-2 py-0.5">+ Agregar</button>
        </div>
        <div id="adicionales-list" class="space-y-2">${adicionalesRows}</div>
      </div>

      <!-- Descuentos -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Ausencias (días)</label>
          <input type="number" id="liq-ausencias" value="${existing?.ausencias || 0}" min="0"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Desc. Préstamos (auto)</label>
          <input type="number" id="liq-desc-prest" value="${existing?.descuento_prestamos || getDescuentoPrestamos(existing?.colaborador_id)}"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm font-mono" readonly>
        </div>
      </div>

      <!-- Neto calculado -->
      <div class="bg-slate-750 border border-emerald-700/50 rounded-lg p-4 text-center">
        <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Neto a Pagar</div>
        <div id="liq-neto-display" class="text-3xl font-bold text-emerald-400 font-mono">$ 0</div>
      </div>
    </div>
  `
}

function bindLiqFormEvents(modal, existing, adicionales, content, root) {
  const calcNeto = () => {
    const base = parseFloat(modal.querySelector('#liq-base')?.value) || 0
    const ausencias = parseFloat(modal.querySelector('#liq-ausencias')?.value) || 0
    const descPrest = parseFloat(modal.querySelector('#liq-desc-prest')?.value) || 0
    const ads = [...modal.querySelectorAll('.adicional-row')]
    const adicTotal = ads.reduce((s, row) => s + (parseFloat(row.querySelector('.ad-monto')?.value) || 0), 0)
    const valorDia = base / 30
    const descAus = ausencias * valorDia
    const neto = base + adicTotal - descAus - descPrest
    const display = modal.querySelector('#liq-neto-display')
    if (display) display.textContent = formatMoney(Math.max(0, neto))
    return { neto: Math.max(0, neto), adicTotal, descAus, descPrest }
  }

  modal.addEventListener('input', calcNeto)

  modal.querySelector('#btn-add-adicional')?.addEventListener('click', () => {
    adicionales.push({ concepto: '', monto: 0 })
    const list = modal.querySelector('#adicionales-list')
    const idx = adicionales.length - 1
    const div = document.createElement('div')
    div.className = 'flex gap-2 adicional-row'
    div.dataset.idx = idx
    div.innerHTML = `
      <input type="text" class="ad-concepto flex-1 bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1.5 text-sm" placeholder="Concepto">
      <input type="number" class="ad-monto w-28 bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1.5 text-sm text-right" placeholder="Monto">
      <button class="btn-del-ad text-red-400 hover:text-red-300 text-sm px-1">✕</button>
    `
    list.appendChild(div)
  })

  modal.addEventListener('click', e => {
    if (e.target.closest('.btn-del-ad')) {
      e.target.closest('.adicional-row').remove()
      calcNeto()
    }
  })

  modal.querySelector('#liq-colab')?.addEventListener('change', e => {
    const desc = getDescuentoPrestamos(e.target.value)
    modal.querySelector('#liq-desc-prest').value = desc
    calcNeto()
  })

  modal.querySelector('#btn-cancel-liq')?.addEventListener('click', () => Modal.close())
  modal.querySelector('#btn-save-liq')?.addEventListener('click', () => {
    const colaborador_id = modal.querySelector('#liq-colab')?.value
    if (!colaborador_id) { toast('Seleccioná un colaborador', 'error'); return }
    const base = parseFloat(modal.querySelector('#liq-base')?.value)
    if (!base) { toast('Ingresá el sueldo base', 'error'); return }

    const { neto, adicTotal, descAus, descPrest } = calcNeto()
    const adRows = [...modal.querySelectorAll('.adicional-row')]
    const adicionalesList = adRows.map(r => ({
      concepto: r.querySelector('.ad-concepto')?.value,
      monto: parseFloat(r.querySelector('.ad-monto')?.value) || 0,
    })).filter(a => a.concepto)

    const liq = {
      id: existing?.id || Date.now(),
      colaborador_id,
      periodo: modal.querySelector('#liq-periodo')?.value,
      sueldo_base: base,
      adicionales: adicionalesList,
      adicionales_total: adicTotal,
      ausencias: parseFloat(modal.querySelector('#liq-ausencias')?.value) || 0,
      descuento_prestamos: descPrest,
      descuentos_total: descAus + descPrest,
      neto,
      estado: existing?.estado || 'pendiente',
    }

    if (existing) {
      const idx = state.liquidaciones.findIndex(l => l.id === existing.id)
      if (idx >= 0) state.liquidaciones[idx] = liq
    } else {
      state.liquidaciones.push(liq)
    }

    Modal.close()
    toast('Liquidación guardada', 'success')
    renderLiquidacionesTab(content, root)
  })

  calcNeto()
}

function getDescuentoPrestamos(colaboradorId) {
  if (!colaboradorId) return 0
  return state.prestamos
    .filter(p => p.colaborador_id == colaboradorId && p.estado === 'activo')
    .reduce((s, p) => s + (p.valor_cuota || 0), 0)
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 2: PRÉSTAMOS
// ══════════════════════════════════════════════════════════════════════════════

function renderPrestamosTab(content, root) {
  content.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-slate-400 text-sm">${state.prestamos.length} préstamos registrados</span>
        <button id="btn-nuevo-prestamo"
          class="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
          + Nuevo Préstamo
        </button>
      </div>
      <div class="space-y-3" id="prestamos-list">
        ${state.prestamos.map(p => renderPrestamoCard(p)).join('') || '<div class="text-center text-slate-500 py-10">Sin préstamos registrados.</div>'}
      </div>
    </div>
  `

  content.querySelector('#btn-nuevo-prestamo')?.addEventListener('click', () => openPrestamoModal(content, root))
  content.addEventListener('click', e => {
    const pId = e.target.closest('[data-p-id]')?.dataset.pId
    if (!pId) return
    const p = state.prestamos.find(pr => pr.id == pId)
    if (!p) return
    if (e.target.closest('.btn-edit-p')) openPrestamoModal(content, root, p)
    if (e.target.closest('.btn-saldar-p')) {
      p.estado = 'saldado'
      p.cuotas_pagadas = p.cuotas
      toast('Préstamo saldado', 'success')
      renderPrestamosTab(content, root)
    }
  })
}

function renderPrestamoCard(p) {
  const colab = state.colaboradores.find(c => c.id == p.colaborador_id)
  const pct = Math.round(((p.cuotas_pagadas || 0) / (p.cuotas || 1)) * 100)
  const isSaldado = p.estado === 'saldado'

  return `
    <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 ${isSaldado ? 'opacity-60' : ''}" data-p-id="${p.id}">
      <div class="flex items-start justify-between mb-3">
        <div>
          <div class="font-medium text-slate-200 text-sm">${colab?.nombre || '—'}</div>
          <div class="text-xs text-slate-500 mt-0.5">
            Desde: ${formatDate(p.primera_cuota_desde)} · ${p.cuotas_pagadas || 0}/${p.cuotas} cuotas
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-500">Monto total</div>
          <div class="text-lg font-bold text-slate-100 font-mono">${formatMoney(p.monto_total)}</div>
          <div class="text-xs text-slate-400">Cuota: ${formatMoney(p.valor_cuota)}</div>
        </div>
      </div>
      <!-- Progress bar -->
      <div class="mb-3">
        <div class="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progreso de pago</span>
          <span>${pct}%</span>
        </div>
        <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all ${isSaldado ? 'bg-slate-500' : 'bg-emerald-500'}" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="px-2 py-0.5 rounded text-xs font-medium ${isSaldado ? 'bg-slate-600 text-slate-400' : 'bg-emerald-900 text-emerald-300'}">${isSaldado ? 'Saldado' : 'Activo'}</span>
        ${!isSaldado ? `
          <div class="flex gap-2">
            <button class="btn-edit-p text-xs text-slate-400 hover:text-blue-400">✏️ Editar</button>
            <button class="btn-saldar-p text-xs text-slate-400 hover:text-emerald-400">✓ Saldar</button>
          </div>
        ` : ''}
      </div>
    </div>
  `
}

function openPrestamoModal(content, root, existing = null) {
  const colabOptions = state.colaboradores.map(c =>
    `<option value="${c.id}" ${existing?.colaborador_id == c.id ? 'selected' : ''}>${c.nombre}</option>`
  ).join('')

  const modal = Modal.open({
    title: existing ? 'Editar Préstamo' : 'Nuevo Préstamo',
    size: 'md',
    content: `
      <div class="space-y-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Colaborador *</label>
          <select id="p-colab" class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
            <option value="">Seleccionar...</option>${colabOptions}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Monto Total *</label>
            <input type="number" id="p-monto" value="${existing?.monto_total || ''}"
              class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm font-mono">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">N° de Cuotas *</label>
            <input type="number" id="p-cuotas" value="${existing?.cuotas || 6}" min="1"
              class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Valor Cuota (calculado)</label>
          <div id="p-cuota-display" class="bg-slate-750 border border-slate-600 rounded px-3 py-2 text-emerald-400 font-bold font-mono text-lg text-center">$ 0</div>
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Primera cuota desde</label>
          <input type="month" id="p-desde" value="${existing?.primera_cuota_desde || state.periodoActual}"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
      </div>
    `,
    footer: `
      <button id="btn-cancel-p" class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancelar</button>
      <button id="btn-save-p" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg">Guardar</button>
    `,
  })

  const calcCuota = () => {
    const monto = parseFloat(modal.querySelector('#p-monto')?.value) || 0
    const cuotas = parseFloat(modal.querySelector('#p-cuotas')?.value) || 1
    const cuota = cuotas > 0 ? monto / cuotas : 0
    const d = modal.querySelector('#p-cuota-display')
    if (d) d.textContent = formatMoney(cuota)
    return cuota
  }

  modal.querySelector('#p-monto')?.addEventListener('input', calcCuota)
  modal.querySelector('#p-cuotas')?.addEventListener('input', calcCuota)
  calcCuota()

  modal.querySelector('#btn-cancel-p')?.addEventListener('click', () => Modal.close())
  modal.querySelector('#btn-save-p')?.addEventListener('click', () => {
    const colaborador_id = modal.querySelector('#p-colab')?.value
    const monto_total = parseFloat(modal.querySelector('#p-monto')?.value)
    const cuotas = parseInt(modal.querySelector('#p-cuotas')?.value)
    if (!colaborador_id) { toast('Seleccioná un colaborador', 'error'); return }
    if (!monto_total || !cuotas) { toast('Completá monto y cuotas', 'error'); return }

    const prestamo = {
      id: existing?.id || Date.now(),
      colaborador_id,
      monto_total,
      cuotas,
      valor_cuota: calcCuota(),
      primera_cuota_desde: modal.querySelector('#p-desde')?.value,
      cuotas_pagadas: existing?.cuotas_pagadas || 0,
      estado: existing?.estado || 'activo',
    }
    if (existing) {
      const idx = state.prestamos.findIndex(p => p.id === existing.id)
      if (idx >= 0) state.prestamos[idx] = prestamo
    } else {
      state.prestamos.push(prestamo)
    }
    Modal.close()
    toast('Préstamo guardado', 'success')
    renderPrestamosTab(content, root)
  })
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 3: GENERADOR DE SOBRE
// ══════════════════════════════════════════════════════════════════════════════

function renderSobreTab(content) {
  content.innerHTML = `
    <div class="max-w-md mx-auto space-y-6">
      <div class="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 class="text-base font-semibold text-slate-200 mb-4">✉️ Generador de Sobre de Pago</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Monto neto a pagar</label>
            <input type="number" id="sobre-monto" value="${state.sobreInput || ''}"
              placeholder="Ej: 127500"
              class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm font-mono text-lg">
          </div>
          <button id="btn-calcular-sobre"
            class="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
            Calcular desglose
          </button>
        </div>
      </div>

      <div id="sobre-resultado" class="bg-slate-800 border border-slate-700 rounded-lg p-6 hidden">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-300">Desglose de billetes</h3>
          <button id="btn-print-sobre" class="text-xs text-slate-400 hover:text-slate-200 border border-slate-600 rounded px-2 py-1">🖨️ Imprimir</button>
        </div>
        <div id="sobre-billetes" class="space-y-2"></div>
        <div class="border-t border-slate-600 mt-4 pt-4 flex justify-between font-semibold text-slate-200">
          <span>Total en sobre</span>
          <span id="sobre-total-confirm" class="font-mono text-emerald-400"></span>
        </div>
      </div>
    </div>
  `

  content.querySelector('#btn-calcular-sobre')?.addEventListener('click', () => calcularSobre(content))
  content.querySelector('#sobre-monto')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') calcularSobre(content)
  })
  content.querySelector('#btn-print-sobre')?.addEventListener('click', imprimirSobre)
}

function calcularSobre(content) {
  const monto = parseFloat(content.querySelector('#sobre-monto')?.value)
  if (!monto || monto <= 0) { toast('Ingresá un monto válido', 'error'); return }
  state.sobreInput = monto

  const denominaciones = [2000, 1000, 500, 200, 100, 50, 20, 10]
  let restante = Math.round(monto)
  const desglose = []

  denominaciones.forEach(bill => {
    const cant = Math.floor(restante / bill)
    if (cant > 0) {
      desglose.push({ billete: bill, cantidad: cant, subtotal: cant * bill })
      restante -= cant * bill
    }
  })

  const res = content.querySelector('#sobre-resultado')
  const billetesDiv = content.querySelector('#sobre-billetes')
  const totalConfirm = content.querySelector('#sobre-total-confirm')

  if (res) res.classList.remove('hidden')
  if (billetesDiv) {
    billetesDiv.innerHTML = desglose.map(d => `
      <div class="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
        <div class="flex items-center gap-3">
          <span class="w-20 text-right font-mono font-semibold text-slate-100">${formatMoney(d.billete)}</span>
          <span class="text-slate-500">×</span>
          <span class="w-8 text-center font-bold text-slate-200">${d.cantidad}</span>
        </div>
        <span class="font-mono text-slate-300">${formatMoney(d.subtotal)}</span>
      </div>
    `).join('')
    if (restante > 0) {
      billetesDiv.innerHTML += `
        <div class="bg-amber-900/30 border border-amber-700 rounded p-2 mt-2 text-xs text-amber-300">
          ⚠️ Sobrante de ${formatMoney(restante)} que no se puede cubrir exactamente con las denominaciones disponibles.
        </div>
      `
    }
  }
  if (totalConfirm) totalConfirm.textContent = formatMoney(monto - restante)

  // Store for print
  window.__sobreDesglose = { monto, restante, desglose }
}

function imprimirSobre() {
  const d = window.__sobreDesglose
  if (!d) return
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Sobre de Pago</title>
  <style>body{font-family:Arial,sans-serif;max-width:400px;margin:40px auto;padding:20px}
  h2{color:#059669;margin-bottom:20px}
  table{width:100%;border-collapse:collapse}td{padding:6px 8px;border-bottom:1px solid #e5e7eb}
  .total{font-weight:700;font-size:1.1em;border-top:2px solid #111}
  @media print{.no-print{display:none}}</style></head><body>
  <h2>✉️ Sobre de Pago</h2>
  <p>Monto: <strong>$ ${d.monto.toLocaleString('es-AR')}</strong></p>
  <table><tr><th style="text-align:left">Billete</th><th>Cantidad</th><th style="text-align:right">Subtotal</th></tr>
  ${d.desglose.map(b => `<tr><td>$ ${b.billete.toLocaleString('es-AR')}</td><td style="text-align:center">${b.cantidad}</td><td style="text-align:right">$ ${b.subtotal.toLocaleString('es-AR')}</td></tr>`).join('')}
  <tr class="total"><td colspan="2">Total en sobre</td><td style="text-align:right">$ ${(d.monto - d.restante).toLocaleString('es-AR')}</td></tr>
  </table>
  <button class="no-print" onclick="window.print()" style="margin-top:20px;padding:8px 16px;background:#059669;color:#fff;border:none;border-radius:4px;cursor:pointer">Imprimir</button>
  </body></html>`
  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close() }
}

// ──────────────────────────────────────────────────────────────────────────────
//  MOCK DATA
// ──────────────────────────────────────────────────────────────────────────────

function getMockColaboradores() {
  return [
    { id: 1, nombre: 'Valeria Rodríguez', rol: 'operador', sueldo_base: 320000 },
    { id: 2, nombre: 'Federico Martínez', rol: 'operador', sueldo_base: 280000 },
    { id: 3, nombre: 'Carolina González', rol: 'admin', sueldo_base: 450000 },
  ]
}

function getMockLiquidaciones() {
  return [
    { id: 1, colaborador_id: 1, periodo: '2026-09', sueldo_base: 320000, adicionales: [{ concepto: 'Presentismo', monto: 16000 }], adicionales_total: 16000, ausencias: 0, descuento_prestamos: 25000, descuentos_total: 25000, neto: 311000, estado: 'pendiente' },
    { id: 2, colaborador_id: 2, periodo: '2026-09', sueldo_base: 280000, adicionales: [], adicionales_total: 0, ausencias: 1, descuento_prestamos: 0, descuentos_total: 9333, neto: 270667, estado: 'pendiente' },
    { id: 3, colaborador_id: 3, periodo: '2026-09', sueldo_base: 450000, adicionales: [{ concepto: 'Antiguedad', monto: 45000 }, { concepto: 'Presentismo', monto: 22500 }], adicionales_total: 67500, ausencias: 0, descuento_prestamos: 0, descuentos_total: 0, neto: 517500, estado: 'pagada' },
  ]
}

function getMockPrestamos() {
  return [
    { id: 1, colaborador_id: 1, monto_total: 150000, cuotas: 6, valor_cuota: 25000, primera_cuota_desde: '2026-07', cuotas_pagadas: 3, estado: 'activo' },
    { id: 2, colaborador_id: 2, monto_total: 80000, cuotas: 4, valor_cuota: 20000, primera_cuota_desde: '2026-06', cuotas_pagadas: 4, estado: 'saldado' },
  ]
}
