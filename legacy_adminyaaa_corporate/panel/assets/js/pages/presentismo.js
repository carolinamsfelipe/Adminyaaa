import { ColaboradoresAPI, PresentismoAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatDate, toast } from '../core/utils.js'

// ─── Estado local ─────────────────────────────────────────────────────────────
let state = {
  colaboradores: [],
  ausencias: [],           // { id, colaborador_id, fecha, tipo, horario, motivo }
  selectedColabId: null,
  viewDate: getMonthStart(new Date()),
  recentEntries: [],       // for undo (last 5 min)
}

function getMonthStart(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function monthStr(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }
function dateStr(d) { return d.toISOString().split('T')[0] }

// ─── Entry point ──────────────────────────────────────────────────────────────
export async function renderPresentismo(container, params) {
  container.innerHTML = `
    <div class="flex flex-col h-full" id="pres-root">
      <div class="px-6 pt-6 pb-4 border-b border-slate-700">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-100">Presentismo</h1>
            <p class="text-slate-400 text-sm mt-1">Registro de ausencias y demoras del personal</p>
          </div>
          <div class="flex gap-2">
            <button id="btn-undo" class="hidden px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs rounded-lg transition-colors">
              ↩ Deshacer último
            </button>
            <button id="btn-nueva-ausencia"
              class="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
              + Registrar Ausencia
            </button>
          </div>
        </div>
      </div>
      <div class="flex flex-1 overflow-hidden">
        <!-- Left panel: collaborator list + summary -->
        <div class="w-72 border-r border-slate-700 overflow-y-auto p-4 shrink-0" id="pres-left"></div>
        <!-- Right panel: calendar -->
        <div class="flex-1 overflow-auto p-6" id="pres-right"></div>
      </div>
    </div>
  `
  await loadData()
  renderPresentismo_full(container)
  bindGlobalEvents(container)
}

async function loadData() {
  const [colabs, ausencias] = await Promise.all([
    ColaboradoresAPI.getAll().catch(() => getMockColaboradores()),
    PresentismoAPI.getAusencias().catch(() => getMockAusencias()),
  ])
  state.colaboradores = colabs
  state.ausencias = ausencias
  if (!state.selectedColabId && colabs.length) state.selectedColabId = colabs[0].id
}

function renderPresentismo_full(container) {
  renderLeftPanel(container)
  renderRightPanel(container)
  refreshUndoButton(container)
}

// ─── Left panel ───────────────────────────────────────────────────────────────
function renderLeftPanel(container) {
  const left = container.querySelector('#pres-left')
  if (!left) return

  const currentMonth = monthStr(state.viewDate)

  left.innerHTML = `
    <!-- Month navigation -->
    <div class="flex items-center justify-between mb-4">
      <button id="btn-prev-month" class="text-slate-400 hover:text-slate-200 text-lg px-2">‹</button>
      <div class="text-sm font-medium text-slate-200 capitalize">
        ${state.viewDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
      </div>
      <button id="btn-next-month" class="text-slate-400 hover:text-slate-200 text-lg px-2">›</button>
    </div>

    <!-- Collaborator list -->
    <div class="space-y-1">
      ${state.colaboradores.map(c => {
        const colabAus = getAusenciasMes(c.id, currentMonth)
        const faltas = colabAus.filter(a => a.tipo === 'falta').length
        const justificadas = colabAus.filter(a => a.tipo === 'falta_justificada').length
        const demoras = colabAus.filter(a => a.tipo === 'demora').length
        const isSelected = c.id == state.selectedColabId

        return `
          <button class="colab-btn w-full text-left px-3 py-2.5 rounded-lg transition-colors ${isSelected ? 'bg-slate-700 border border-emerald-600' : 'hover:bg-slate-750 border border-transparent'}"
            data-colab-id="${c.id}">
            <div class="font-medium text-slate-200 text-sm">${c.nombre}</div>
            <div class="flex gap-2 mt-1">
              ${faltas ? `<span class="text-xs text-red-400">${faltas} falta${faltas > 1 ? 's' : ''}</span>` : ''}
              ${justificadas ? `<span class="text-xs text-amber-400">${justificadas} justif.</span>` : ''}
              ${demoras ? `<span class="text-xs text-blue-400">${demoras} demora${demoras > 1 ? 's' : ''}</span>` : ''}
              ${!faltas && !justificadas && !demoras ? `<span class="text-xs text-emerald-400">Sin novedades</span>` : ''}
            </div>
          </button>
        `
      }).join('')}
    </div>

    <!-- Summary table -->
    <div class="mt-6 border-t border-slate-700 pt-4">
      <div class="text-xs text-slate-500 uppercase tracking-wide mb-3">Resumen del período</div>
      <div class="space-y-2">
        ${state.colaboradores.map(c => {
          const aus = getAusenciasMes(c.id, currentMonth)
          const faltas = aus.filter(a => a.tipo === 'falta').length
          const justif = aus.filter(a => a.tipo === 'falta_justificada').length
          const demoras = aus.filter(a => a.tipo === 'demora').length
          return `
            <div class="text-xs">
              <div class="text-slate-400 font-medium">${c.nombre.split(' ')[0]}</div>
              <div class="text-slate-500">${faltas}F / ${justif}J / ${demoras}D</div>
            </div>
          `
        }).join('')}
      </div>
    </div>
  `

  left.querySelector('#btn-prev-month')?.addEventListener('click', () => {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1)
    renderPresentismo_full(container)
  })
  left.querySelector('#btn-next-month')?.addEventListener('click', () => {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1)
    renderPresentismo_full(container)
  })

  left.querySelectorAll('.colab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedColabId = btn.dataset.colabId
      renderPresentismo_full(container)
    })
  })
}

// ─── Right panel (calendar) ───────────────────────────────────────────────────
function renderRightPanel(container) {
  const right = container.querySelector('#pres-right')
  if (!right) return

  const colab = state.colaboradores.find(c => c.id == state.selectedColabId)
  const currentMonth = monthStr(state.viewDate)
  const colabAus = getAusenciasMes(state.selectedColabId, currentMonth)

  right.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-slate-200">${colab?.nombre || '—'}</h2>
        <div class="flex gap-3 text-xs">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-red-600 inline-block"></span> Falta</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-amber-500 inline-block"></span> Falta justif.</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-blue-500 inline-block"></span> Demora</span>
        </div>
      </div>

      ${renderCalendarGrid(currentMonth, colabAus)}

      <!-- Ausencias list -->
      ${colabAus.length ? `
        <div>
          <h3 class="text-sm font-medium text-slate-400 mb-2">Novedades del período</h3>
          <div class="space-y-2">
            ${colabAus.sort((a,b) => a.fecha.localeCompare(b.fecha)).map(a => renderAusenciaRow(a, container)).join('')}
          </div>
        </div>
      ` : `<div class="text-center text-slate-500 py-8">Sin ausencias ni demoras en este período.</div>`}
    </div>
  `

  // Bind delete buttons
  right.querySelectorAll('.btn-del-aus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.ausId
      const aus = state.ausencias.find(a => a.id == id)
      if (!aus) return
      if (confirm(`¿Eliminar esta novedad del ${formatDate(aus.fecha)}?`)) {
        state.ausencias = state.ausencias.filter(a => a.id != id)
        toast('Novedad eliminada', 'warning')
        renderPresentismo_full(container)
      }
    })
  })
}

function renderCalendarGrid(monthStr, colabAus) {
  const [year, month] = monthStr.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startDow = (firstDay.getDay() + 6) % 7  // Monday = 0

  const ausMap = {}
  colabAus.forEach(a => { ausMap[a.fecha] = a })

  const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  let cells = []

  // Empty cells before first day
  for (let i = 0; i < startDow; i++) cells.push(`<div></div>`)

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const aus = ausMap[dateKey]
    const dow = (startDow + d - 1) % 7
    const isWeekend = dow >= 5

    let cellClass = 'rounded p-1.5 text-xs text-center min-h-[40px] flex flex-col items-center justify-start gap-0.5'
    let dayClass = 'font-medium'
    let marker = ''

    if (aus) {
      const colors = { falta: 'bg-red-800', falta_justificada: 'bg-amber-800', demora: 'bg-blue-800' }
      cellClass += ` ${colors[aus.tipo] || 'bg-slate-700'} border border-opacity-50`
      marker = `<span class="text-[9px] text-white/80 truncate w-full text-center">${tipoLabel(aus.tipo)}</span>`
    } else if (isWeekend) {
      cellClass += ' bg-slate-800 opacity-40'
    } else {
      cellClass += ' bg-slate-800 hover:bg-slate-700 cursor-default'
    }

    if (dateKey === dateStr(new Date())) {
      dayClass += ' text-emerald-400 font-bold'
    } else {
      dayClass += ` ${aus ? 'text-white' : isWeekend ? 'text-slate-500' : 'text-slate-300'}`
    }

    cells.push(`
      <div class="${cellClass}" title="${aus ? `${tipoLabel(aus.tipo)} — ${aus.motivo}` : ''}">
        <span class="${dayClass}">${d}</span>
        ${marker}
      </div>
    `)
  }

  return `
    <div class="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div class="grid grid-cols-7 gap-1 mb-2">
        ${dayHeaders.map(h => `<div class="text-xs text-slate-500 text-center font-medium">${h}</div>`).join('')}
      </div>
      <div class="grid grid-cols-7 gap-1">
        ${cells.join('')}
      </div>
    </div>
  `
}

function renderAusenciaRow(a, container) {
  const colors = {
    falta: 'bg-red-900 text-red-300',
    falta_justificada: 'bg-amber-900 text-amber-300',
    demora: 'bg-blue-900 text-blue-300',
  }
  return `
    <div class="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5">
      <div class="flex items-center gap-3">
        <span class="px-2 py-0.5 rounded text-xs font-medium ${colors[a.tipo] || 'bg-slate-600 text-slate-300'}">${tipoLabel(a.tipo)}</span>
        <span class="text-sm text-slate-300">${formatDate(a.fecha)}</span>
        ${a.horario ? `<span class="text-xs text-slate-500">${a.horario}</span>` : ''}
        ${a.motivo ? `<span class="text-xs text-slate-500 italic">"${a.motivo}"</span>` : ''}
      </div>
      <button class="btn-del-aus text-slate-500 hover:text-red-400 text-xs" data-aus-id="${a.id}">✕</button>
    </div>
  `
}

function tipoLabel(tipo) {
  return { falta: 'Falta', falta_justificada: 'Justificada', demora: 'Demora' }[tipo] || tipo
}

// ─── Global events ────────────────────────────────────────────────────────────
function bindGlobalEvents(container) {
  container.querySelector('#btn-nueva-ausencia')?.addEventListener('click', () => {
    openNuevaAusenciaModal(container)
  })
  container.querySelector('#btn-undo')?.addEventListener('click', () => {
    undoLastEntry(container)
  })
}

function refreshUndoButton(container) {
  const btn = container.querySelector('#btn-undo')
  if (!btn) return
  const now = Date.now()
  const recent = state.recentEntries.filter(e => now - e.timestamp < 5 * 60 * 1000)
  state.recentEntries = recent
  if (recent.length) {
    btn.classList.remove('hidden')
    btn.textContent = `↩ Deshacer (${recent.length})`
  } else {
    btn.classList.add('hidden')
  }
}

function undoLastEntry(container) {
  const last = state.recentEntries.pop()
  if (!last) return
  state.ausencias = state.ausencias.filter(a => a.id !== last.id)
  toast('Ausencia deshecha', 'info')
  renderPresentismo_full(container)
}

// ─── Nueva Ausencia Modal ─────────────────────────────────────────────────────
function openNuevaAusenciaModal(container) {
  const colabOptions = state.colaboradores.map(c =>
    `<option value="${c.id}" ${c.id == state.selectedColabId ? 'selected' : ''}>${c.nombre}</option>`
  ).join('')

  const modal = Modal.open({
    title: 'Registrar Ausencia / Demora',
    size: 'md',
    content: `
      <div class="space-y-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Colaborador *</label>
          <select id="aus-colab" class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
            ${colabOptions}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Fecha *</label>
            <input type="date" id="aus-fecha" value="${dateStr(new Date())}"
              class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Tipo *</label>
            <select id="aus-tipo" class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
              <option value="falta">Falta</option>
              <option value="demora">Demora</option>
              <option value="falta_justificada">Falta justificada</option>
            </select>
          </div>
        </div>
        <div id="horario-field">
          <label class="block text-xs text-slate-400 mb-1">Horario (para demoras)</label>
          <input type="text" id="aus-horario" placeholder="Ej: 09:45 — llegó 45 min tarde"
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Motivo</label>
          <input type="text" id="aus-motivo" placeholder="Enfermedad, trámite, etc."
            class="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm">
        </div>
      </div>
    `,
    footer: `
      <button id="btn-cancel-aus" class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancelar</button>
      <button id="btn-save-aus" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg">Registrar</button>
    `,
  })

  modal.querySelector('#aus-tipo')?.addEventListener('change', e => {
    const hf = modal.querySelector('#horario-field')
    if (hf) hf.style.opacity = e.target.value === 'demora' ? '1' : '0.4'
  })

  modal.querySelector('#btn-cancel-aus')?.addEventListener('click', () => Modal.close())
  modal.querySelector('#btn-save-aus')?.addEventListener('click', () => {
    const colaborador_id = modal.querySelector('#aus-colab')?.value
    const fecha = modal.querySelector('#aus-fecha')?.value
    const tipo = modal.querySelector('#aus-tipo')?.value
    if (!fecha) { toast('Ingresá una fecha', 'error'); return }

    // Check for duplicate
    const dup = state.ausencias.find(a => a.colaborador_id == colaborador_id && a.fecha === fecha && a.tipo === tipo)
    if (dup) { toast('Ya existe una novedad de este tipo para ese día', 'warning'); return }

    const aus = {
      id: Date.now(),
      colaborador_id,
      fecha,
      tipo,
      horario: modal.querySelector('#aus-horario')?.value,
      motivo: modal.querySelector('#aus-motivo')?.value,
      created_at: Date.now(),
    }
    state.ausencias.push(aus)
    state.recentEntries.push({ id: aus.id, timestamp: Date.now() })
    state.selectedColabId = colaborador_id

    Modal.close()
    toast('Novedad registrada', 'success')
    renderPresentismo_full(container)
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAusenciasMes(colabId, monthStr) {
  return state.ausencias.filter(a =>
    a.colaborador_id == colabId &&
    a.fecha.startsWith(monthStr)
  )
}

// ─── Mock data ────────────────────────────────────────────────────────────────
function getMockColaboradores() {
  return [
    { id: 1, nombre: 'Valeria Rodríguez' },
    { id: 2, nombre: 'Federico Martínez' },
    { id: 3, nombre: 'Carolina González' },
  ]
}

function getMockAusencias() {
  const y = new Date().getFullYear()
  const m = String(new Date().getMonth() + 1).padStart(2, '0')
  return [
    { id: 1, colaborador_id: 1, fecha: `${y}-${m}-04`, tipo: 'falta', motivo: 'Enfermedad' },
    { id: 2, colaborador_id: 1, fecha: `${y}-${m}-11`, tipo: 'demora', horario: '09:30', motivo: 'Tráfico' },
    { id: 3, colaborador_id: 2, fecha: `${y}-${m}-08`, tipo: 'falta_justificada', motivo: 'Turno médico' },
    { id: 4, colaborador_id: 2, fecha: `${y}-${m}-19`, tipo: 'falta', motivo: '' },
    { id: 5, colaborador_id: 3, fecha: `${y}-${m}-03`, tipo: 'demora', horario: '10:00', motivo: 'Transporte público' },
  ]
}
