/**
 * planilla-gastro.js — Planilla Gastronómica y Comercios (Cajas y Márgenes por Turno)
 * Grilla interactiva tipo Excel: Turno Tarde, Turno Noche, Gastos directos, Márgenes,
 * comparativa vs objetivo y generador de Reporte Semanal para WhatsApp.
 */

import { PlanillaAPI, ClientesAPI } from '../data/api.js'
import { formatMoney, formatDate, today, toast, escHtml } from '../core/utils.js'

export function renderPlanillaGastro(container, params = {}) {
  // Clientes gastronómicos o comerciales
  const gastroClientes = ClientesAPI.getAll().filter(c => c.rubro === 'gastronomia' || c.rubro === 'comercio')
  const defaultClienteId = gastroClientes[0]?.id || null

  let _selectedClienteId = params.cliente_id || defaultClienteId
  let _currentDate = new Date()

  function getWeekDays(date) {
    const current = new Date(date)
    // Obtener el lunes de la semana actual
    const day = current.getDay()
    const diff = current.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(current.setDate(diff))

    const days = []
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const iso = d.toISOString().slice(0, 10)
      days.push({
        iso,
        nombre: dayNames[i],
        displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
        rawDate: d,
      })
    }
    return days
  }

  function renderView() {
    const cliente = ClientesAPI.getById(_selectedClienteId)
    const weekDays = getWeekDays(_currentDate)
    const startDate = weekDays[0].iso
    const endDate = weekDays[6].iso

    // Obtener datos registrados para esta semana
    const dataSemana = PlanillaAPI.getByCliente(_selectedClienteId, startDate, endDate) || []
    const dataMap = {}
    dataSemana.forEach(d => { dataMap[d.fecha] = d })

    // Calcular totales de la semana
    let totTarde = 0
    let totNoche = 0
    let totGastos = 0

    weekDays.forEach(d => {
      const reg = dataMap[d.iso] || {}
      totTarde += Number(reg.ventas_tarde || 0)
      totNoche += Number(reg.ventas_noche || 0)
      totGastos += Number(reg.gastos_dia || 0)
    })

    const totFacturado = totTarde + totNoche
    const totMargen = totFacturado - totGastos
    const margenPct = totFacturado > 0 ? Math.round((totMargen / totFacturado) * 100) : 0
    const objSemanal = (cliente?.monto_abono ? cliente.monto_abono * 4 : 2500000)

    let html = `
      <div class="space-y-6">
        <!-- Top bar: Selector de cliente y controles de semana -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              </span>
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Planilla Gastronómica y Cajas</h1>
            </div>
            <p class="text-xs text-slate-500 mt-1">Control interactivo de ventas turno tarde / noche y márgenes diarios</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Selector de cliente -->
            <select id="select-gastro-cliente" class="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500">
              ${gastroClientes.map(c => `
                <option value="${c.id}" ${c.id === _selectedClienteId ? 'selected' : ''}>${escHtml(c.nombre_comercial)}</option>
              `).join('')}
            </select>

            <!-- Generador WhatsApp -->
            <button id="btn-generar-reporte-wa" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition">
              <span>📱 Reporte Semanal WhatsApp</span>
            </button>
          </div>
        </div>

        <!-- Selector de Período / Navegación de semana -->
        <div class="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
          <div class="flex items-center gap-2">
            <button id="btn-prev-week" class="p-1.5 hover:bg-slate-100 rounded text-slate-600 font-bold transition">&larr; Semana Anterior</button>
            <button id="btn-current-week" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-medium text-slate-700">Esta Semana</button>
            <button id="btn-next-week" class="p-1.5 hover:bg-slate-100 rounded text-slate-600 font-bold transition">Semana Siguiente &rarr;</button>
          </div>
          <div class="font-semibold text-slate-800 font-mono">
            Semana del ${formatDate(startDate)} al ${formatDate(endDate)}
          </div>
        </div>

        <!-- KPI Cards rápidos de la semana -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-[11px] text-slate-500 block font-medium">Facturación Semana</span>
            <span class="text-xl font-bold font-mono text-slate-900 mt-1 block">${formatMoney(totFacturado)}</span>
            <div class="text-[10px] text-slate-400 mt-1">Tarde: ${totFacturado > 0 ? Math.round((totTarde/totFacturado)*100) : 0}% &bull; Noche: ${totFacturado > 0 ? Math.round((totNoche/totFacturado)*100) : 0}%</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-[11px] text-slate-500 block font-medium">Gastos de Insumos / Caja</span>
            <span class="text-xl font-bold font-mono text-rose-600 mt-1 block">${formatMoney(totGastos)}</span>
            <div class="text-[10px] text-slate-400 mt-1">${totFacturado > 0 ? Math.round((totGastos/totFacturado)*100) : 0}% de las ventas</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-[11px] text-slate-500 block font-medium">Margen Bruto de Caja</span>
            <span class="text-xl font-bold font-mono text-emerald-600 mt-1 block">${formatMoney(totMargen)}</span>
            <div class="text-[10px] text-emerald-600 font-medium mt-1">${margenPct}% margen estimado</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-[11px] text-slate-500 block font-medium">Objetivo Semanal</span>
            <span class="text-xl font-bold font-mono text-slate-700 mt-1 block">${formatMoney(objSemanal)}</span>
            <div class="text-[10px] ${totFacturado >= objSemanal ? 'text-emerald-600' : 'text-amber-600'} font-medium mt-1">
              ${totFacturado >= objSemanal ? '✓ Objetivo Cumplido' : `${Math.round((totFacturado/objSemanal)*100)}% alcanzado`}
            </div>
          </div>
        </div>

        <!-- GRILLA INTERACTIVA TIPO EXCEL -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>Carga Diaria de Turnos</span>
              <span class="text-[10px] font-normal text-slate-400 normal-case">(Guardado automático al cambiar de celda)</span>
            </div>
            <div id="save-status-indicator" class="text-[11px] text-slate-400 font-medium">
              Todo guardado
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse" id="gastro-table">
              <thead>
                <tr class="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th class="p-3 w-32">Día</th>
                  <th class="p-3 text-right">Ventas Tarde ($)</th>
                  <th class="p-3 text-right">Ventas Noche ($)</th>
                  <th class="p-3 text-right">Total Día</th>
                  <th class="p-3 text-right">Gastos / Caja Chica ($)</th>
                  <th class="p-3 text-right">Margen Bruto</th>
                  <th class="p-3 text-center">% vs Objetivo</th>
                  <th class="p-3">Observaciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono">
                ${weekDays.map(d => {
                  const reg = dataMap[d.iso] || { ventas_tarde: 0, ventas_noche: 0, gastos_dia: 0, notas: '' }
                  const vt = Number(reg.ventas_tarde || 0)
                  const vn = Number(reg.ventas_noche || 0)
                  const gd = Number(reg.gastos_dia || 0)
                  const totDia = vt + vn
                  const margenDia = totDia - gd
                  const objDia = Math.round(objSemanal / 7)
                  const pctObj = objDia > 0 ? Math.round((totDia / objDia) * 100) : 0

                  return `
                    <tr class="hover:bg-slate-50/80 transition-colors" data-fecha="${d.iso}">
                      <td class="p-3 font-sans font-semibold text-slate-800">
                        <div>${d.nombre}</div>
                        <div class="text-[10px] text-slate-400 font-normal font-mono">${d.displayDate}</div>
                      </td>
                      <td class="p-2 text-right">
                        <input type="number" step="1000" min="0" value="${vt}" data-field="ventas_tarde" class="gastro-input w-28 text-right px-2 py-1 border border-slate-200 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500">
                      </td>
                      <td class="p-2 text-right">
                        <input type="number" step="1000" min="0" value="${vn}" data-field="ventas_noche" class="gastro-input w-28 text-right px-2 py-1 border border-slate-200 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500">
                      </td>
                      <td class="p-3 text-right font-bold text-slate-900 col-total-dia">
                        ${formatMoney(totDia)}
                      </td>
                      <td class="p-2 text-right">
                        <input type="number" step="500" min="0" value="${gd}" data-field="gastos_dia" class="gastro-input w-28 text-right px-2 py-1 border border-slate-200 rounded font-mono text-xs text-rose-600 focus:ring-1 focus:ring-rose-500 focus:border-rose-500">
                      </td>
                      <td class="p-3 text-right font-bold ${margenDia >= 0 ? 'text-emerald-600' : 'text-rose-600'} col-margen-dia">
                        ${formatMoney(margenDia)}
                      </td>
                      <td class="p-3 text-center font-sans col-pct-obj">
                        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold ${pctObj >= 100 ? 'bg-emerald-100 text-emerald-800' : pctObj >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}">
                          ${pctObj}%
                        </span>
                      </td>
                      <td class="p-2 font-sans">
                        <input type="text" value="${escHtml(reg.notas || '')}" data-field="notas" placeholder="Ej: Mucha lluvia" class="gastro-input w-full px-2 py-1 border border-transparent hover:border-slate-200 rounded text-xs focus:border-slate-300">
                      </td>
                    </tr>
                  `
                }).join('')}
              </tbody>
              <!-- Totales de la semana -->
              <tfoot class="bg-slate-900 text-white font-mono text-xs font-bold border-t-2 border-slate-800">
                <tr>
                  <td class="p-3 font-sans">TOTALES SEMANA</td>
                  <td class="p-3 text-right">${formatMoney(totTarde)}</td>
                  <td class="p-3 text-right">${formatMoney(totNoche)}</td>
                  <td class="p-3 text-right text-emerald-400 font-bold">${formatMoney(totFacturado)}</td>
                  <td class="p-3 text-right text-rose-300">${formatMoney(totGastos)}</td>
                  <td class="p-3 text-right text-emerald-400 font-bold">${formatMoney(totMargen)}</td>
                  <td class="p-3 text-center font-sans">${objSemanal > 0 ? Math.round((totFacturado/objSemanal)*100) : 0}%</td>
                  <td class="p-3 font-sans font-normal text-slate-400 text-[10px]">${margenPct}% margen s/ventas</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `

    container.innerHTML = html

    // Selector de cliente
    container.querySelector('#select-gastro-cliente')?.addEventListener('change', (e) => {
      _selectedClienteId = e.target.value
      renderView()
    })

    // Controles de fecha
    container.querySelector('#btn-prev-week')?.addEventListener('click', () => {
      _currentDate.setDate(_currentDate.getDate() - 7)
      renderView()
    })
    container.querySelector('#btn-next-week')?.addEventListener('click', () => {
      _currentDate.setDate(_currentDate.getDate() + 7)
      renderView()
    })
    container.querySelector('#btn-current-week')?.addEventListener('click', () => {
      _currentDate = new Date()
      renderView()
    })

    // Input handlers para autoguardado en celda (blur o Enter)
    const statusIndicator = container.querySelector('#save-status-indicator')

    container.querySelectorAll('.gastro-input').forEach(input => {
      const handleSave = () => {
        const row = input.closest('tr')
        if (!row) return
        const fecha = row.getAttribute('data-fecha')
        const vtInput = row.querySelector('[data-field="ventas_tarde"]')
        const vnInput = row.querySelector('[data-field="ventas_noche"]')
        const gdInput = row.querySelector('[data-field="gastos_dia"]')
        const notasInput = row.querySelector('[data-field="notas"]')

        const vt = Number(vtInput?.value || 0)
        const vn = Number(vnInput?.value || 0)
        const gd = Number(gdInput?.value || 0)
        const notas = notasInput?.value || ''

        if (statusIndicator) statusIndicator.textContent = 'Guardando...'

        PlanillaAPI.saveDia(_selectedClienteId, fecha, {
          ventas_tarde: vt,
          ventas_noche: vn,
          gastos_dia: gd,
          notas,
        })

        if (statusIndicator) {
          statusIndicator.textContent = '✓ Guardado'
          setTimeout(() => { if (statusIndicator) statusIndicator.textContent = 'Todo guardado' }, 2000)
        }

        // Actualizar visualmente fila sin re-renderizar todo
        const totDia = vt + vn
        const margenDia = totDia - gd
        const objDia = Math.round(objSemanal / 7)
        const pctObj = objDia > 0 ? Math.round((totDia / objDia) * 100) : 0

        row.querySelector('.col-total-dia').textContent = formatMoney(totDia)
        const margenCell = row.querySelector('.col-margen-dia')
        margenCell.textContent = formatMoney(margenDia)
        margenCell.className = `p-3 text-right font-bold ${margenDia >= 0 ? 'text-emerald-600' : 'text-rose-600'} col-margen-dia`

        const pctSpan = row.querySelector('.col-pct-obj span')
        if (pctSpan) {
          pctSpan.textContent = `${pctObj}%`
          pctSpan.className = `inline-block px-2 py-0.5 rounded text-[10px] font-bold ${pctObj >= 100 ? 'bg-emerald-100 text-emerald-800' : pctObj >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`
        }
      }

      input.addEventListener('change', handleSave)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleSave()
          input.blur()
        }
      })
    })

    // Generador Reporte Semanal WhatsApp
    container.querySelector('#btn-generar-reporte-wa')?.addEventListener('click', () => {
      _mostrarModalReporteWhatsApp(cliente, weekDays, dataMap, totFacturado, totTarde, totNoche, totGastos, totMargen, margenPct, objSemanal)
    })
  }

  function _mostrarModalReporteWhatsApp(cliente, weekDays, dataMap, totFacturado, totTarde, totNoche, totGastos, totMargen, margenPct, objSemanal) {
    const startDate = weekDays[0].displayDate
    const endDate = weekDays[6].displayDate

    let detalleDias = ''
    let mejorDia = { nombre: '—', monto: 0 }

    weekDays.forEach(d => {
      const reg = dataMap[d.iso] || {}
      const vt = Number(reg.ventas_tarde || 0)
      const vn = Number(reg.ventas_noche || 0)
      const total = vt + vn
      if (total > mejorDia.monto) mejorDia = { nombre: d.nombre, monto: total }

      detalleDias += `• *${d.nombre}:* Tarde ${formatMoney(vt)} | Noche ${formatMoney(vn)} = *${formatMoney(total)}*\n`
    })

    const textoReporte = `📊 *REPORTE SEMANAL DE VENTAS Y MÁRGENES*
🏢 *${cliente?.nombre_comercial || 'Cliente'}*
📅 *Semana del ${startDate} al ${endDate}*

*DETALLE DIARIO:*
${detalleDias}
───────────────────
💰 *TOTAL FACTURADO:* *${formatMoney(totFacturado)}*
🌅 *Turno Tarde:* ${formatMoney(totTarde)} (${totFacturado > 0 ? Math.round((totTarde/totFacturado)*100) : 0}%)
🌃 *Turno Noche:* ${formatMoney(totNoche)} (${totFacturado > 0 ? Math.round((totNoche/totFacturado)*100) : 0}%)
📦 *Gastos Operativos / Insumos:* ${formatMoney(totGastos)}
💚 *MARGEN BRUTO ESTIMADO:* *${formatMoney(totMargen)}* (${margenPct}%)

🏆 *Mejor jornada:* ${mejorDia.nombre} con ${formatMoney(mejorDia.monto)}
🎯 *Objetivo Semanal:* ${formatMoney(objSemanal)} ${totFacturado >= objSemanal ? '✅ Cumplido' : '⚠️ En seguimiento'}

_Informe preparado por el equipo de AdminYAAA | Gestión Administrativa PyMEs_`

    const modalContent = `
      <div class="space-y-3">
        <p class="text-xs text-slate-500">Revisá el texto generado antes de enviarlo por WhatsApp al dueño del negocio:</p>
        <textarea id="wa-reporte-text" rows="12" class="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">${escHtml(textoReporte)}</textarea>
        <div class="flex items-center justify-between pt-2">
          <button id="btn-copiar-wa-reporte" class="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
            📋 Copiar al Portapapeles
          </button>
          ${cliente?.whatsapp ? `
            <a id="btn-abrir-wa-reporte" href="https://wa.me/${cliente.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(textoReporte)}" target="_blank" rel="noopener" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
              Abrir WhatsApp Directo &rarr;
            </a>
          ` : ''}
        </div>
      </div>
    `

    // Importar Modal dinámicamente si no está en scope
    import('../components/modal.js').then(({ Modal }) => {
      Modal.open({
        title: `Reporte Semanal: ${cliente?.nombre_comercial || ''}`,
        content: modalContent,
        size: 'max-w-xl',
        showFooter: false,
      })

      document.getElementById('btn-copiar-wa-reporte')?.addEventListener('click', () => {
        const txt = document.getElementById('wa-reporte-text')?.value || ''
        navigator.clipboard.writeText(txt).then(() => {
          toast('¡Reporte copiado al portapapeles! Listo para pegar en WhatsApp.', 'success')
        })
      })
    })
  }

  renderView()
}
