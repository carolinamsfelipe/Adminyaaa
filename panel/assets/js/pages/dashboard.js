/**
 * dashboard.js — Panel de Control Principal de AdminYAAA
 * Métricas ejecutivas (solo Admin), panel de alertas operativas,
 * acción rápida de facturación y resumen de actividad diaria.
 */

import { DashboardAPI, FacturasAPI, TareasAPI, ClientesAPI, TesoreriaAPI, FondosAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { formatMoney, formatDate, today, toast, escHtml } from '../core/utils.js'
import { renderStatusBadge } from '../components/table.js'
import { Router } from '../core/router.js'

export function renderDashboard(container) {
  const isAdmin = Auth.isAdmin()
  const user = Auth.currentUser()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const metricas = isAdmin ? DashboardAPI.getMetricasMes(currentYear, currentMonth) : null
  const alertas = DashboardAPI.getAlertasOperativas()
  const listoFacturar = isAdmin ? DashboardAPI.getListoParaFacturar() : []
  const tareasRecientes = TareasAPI.getAll().slice(0, 8)
  const totalTesoreria = isAdmin ? TesoreriaAPI.getSaldoTotal() : 0

  let html = `
    <div class="space-y-6">
      <!-- Encabezado de bienvenida -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
            Hola, ${escHtml(user?.nombre?.split(' ')[0] || 'Usuario')} 👋
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Resumen operativo y estado general al día de hoy &bull; <span class="font-medium text-slate-700">${formatDate(today())}</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          ${isAdmin ? `
            <button id="btn-nueva-tarea-dash" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Nueva Tarea
            </button>
            <button id="btn-ir-cobranzas-dash" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition">
              Panel Morosidad
            </button>
          ` : `
            <button id="btn-nueva-tarea-dash" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Cargar Mi Tarea
            </button>
          `}
        </div>
      </div>
  `

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 1: MÉTRICAS EJECUTIVAS (SOLO ADMIN)
  // ─────────────────────────────────────────────────────────────────────────
  if (isAdmin && metricas) {
    const margenPct = metricas.ingresos_totales > 0
      ? Math.round((metricas.ganancia_neta / metricas.ingresos_totales) * 100)
      : 0

    html += `
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Métricas Ejecutivas del Mes</h2>
          <span class="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Exclusivo Socios</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Ingresos Totales -->
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-slate-500 mb-1">
                <span class="text-xs font-medium">Facturación del Mes</span>
                <span class="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </span>
              </div>
              <div class="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                ${formatMoney(metricas.ingresos_totales)}
              </div>
            </div>
            <div class="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Promedio / cliente</span>
              <span class="font-mono font-semibold text-slate-700">${formatMoney(metricas.promedio_por_cliente)}</span>
            </div>
          </div>

          <!-- Ganancia Neta Estimada -->
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-slate-500 mb-1">
                <span class="text-xs font-medium">Ganancia Neta Est.</span>
                <span class="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </span>
              </div>
              <div class="text-2xl font-bold text-emerald-600 tracking-tight font-mono">
                ${formatMoney(metricas.ganancia_neta)}
              </div>
            </div>
            <div class="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Margen estimado</span>
              <span class="font-semibold text-emerald-600 font-mono">${margenPct}% sobre ventas</span>
            </div>
          </div>

          <!-- Abonos Cobrados vs Pendientes -->
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-slate-500 mb-1">
                <span class="text-xs font-medium">Abonos del Mes</span>
                <span class="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </span>
              </div>
              <div class="text-2xl font-bold text-slate-900 tracking-tight">
                ${metricas.abonos_cobrados_count} <span class="text-sm font-normal text-slate-400">/ ${metricas.abonos_total_count} cobrados</span>
              </div>
            </div>
            <div class="mt-3">
              <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${metricas.abonos_total_count > 0 ? (metricas.abonos_cobrados_count / metricas.abonos_total_count) * 100 : 0}%"></div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>Cobrado: ${formatMoney(metricas.abonos_cobrados_monto)}</span>
                <span>Pend: ${formatMoney(metricas.abonos_pendientes_monto)}</span>
              </div>
            </div>
          </div>

          <!-- Tesorería Consolidada -->
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-slate-500 mb-1">
                <span class="text-xs font-medium">Tesorería Total</span>
                <span class="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                </span>
              </div>
              <div class="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                ${formatMoney(totalTesoreria)}
              </div>
            </div>
            <div class="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Tareas realizadas</span>
              <span class="font-semibold text-slate-700 font-mono">${metricas.tareas_ejecutadas} tareas</span>
            </div>
          </div>
        </div>
      </div>
    `
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 2: PANEL DE ALERTAS OPERATIVAS
  // ─────────────────────────────────────────────────────────────────────────
  html += `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 space-y-4">
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Alertas Operativas
            </h2>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full ${alertas.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
              ${alertas.length}
            </span>
          </div>

          <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            ${alertas.length === 0 ? `
              <div class="py-6 text-center text-slate-400 text-xs">
                <p>✓ Todo al día, sin alertas críticas.</p>
              </div>
            ` : alertas.map(a => `
              <div class="p-3 rounded-lg border text-xs transition ${
                a.tipo === 'abono_vencido' ? 'bg-rose-50/70 border-rose-200 text-rose-800' :
                a.tipo === 'fondo_agotandose' ? 'bg-amber-50/70 border-amber-200 text-amber-800' :
                a.tipo === 'factura_pendiente' ? 'bg-orange-50/70 border-orange-200 text-orange-800' :
                'bg-slate-50 border-slate-200 text-slate-700'
              }">
                <div class="flex items-start justify-between gap-2">
                  <span class="font-semibold">${escHtml(a.titulo || a.cliente_nombre || 'Alerta')}</span>
                  ${a.dias ? `<span class="text-[10px] font-mono px-1 rounded bg-white/70">${a.dias}d</span>` : ''}
                </div>
                <p class="text-[11px] mt-0.5 opacity-90">${escHtml(a.detalle || a.mensaje || '')}</p>
                ${a.monto ? `<div class="mt-1 font-mono font-bold">${formatMoney(a.monto)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- SECCIÓN 3: ACCIÓN RÁPIDA DE FACTURACIÓN (O TAREAS RECIENTES) -->
      <div class="lg:col-span-2 space-y-4">
        ${isAdmin ? `
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
              <div>
                <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                  Listo para Facturar este Mes
                </h2>
                <p class="text-[11px] text-slate-400">Abonos y trabajos pactados para emitir factura</p>
              </div>
              <div class="flex items-center gap-2">
                <button id="btn-select-all-facturar" class="text-xs text-slate-500 hover:text-slate-800 underline">
                  Seleccionar todos
                </button>
                <button id="btn-facturar-seleccionados" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-40" disabled>
                  Facturar Seleccionados
                </button>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th class="p-2 w-8"><input type="checkbox" id="chk-master-facturar" class="rounded text-emerald-600 focus:ring-0"></th>
                    <th class="p-2">Cliente</th>
                    <th class="p-2">Concepto</th>
                    <th class="p-2 text-right">Monto</th>
                    <th class="p-2 text-center">Día Fact.</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100" id="tbody-facturar-rapido">
                  ${listoFacturar.length === 0 ? `
                    <tr><td colspan="5" class="py-6 text-center text-slate-400 text-xs">No hay servicios pendientes de facturación inmediata.</td></tr>
                  ` : listoFacturar.map(item => `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="p-2"><input type="checkbox" value="${item.cliente_id || item.id}" class="chk-facturar rounded text-emerald-600 focus:ring-0"></td>
                      <td class="p-2 font-medium text-slate-800">${escHtml(item.cliente_nombre)}</td>
                      <td class="p-2 text-slate-600">${escHtml(item.concepto || 'Abono Mensual Recurrente')}</td>
                      <td class="p-2 text-right font-mono font-semibold text-slate-900">${formatMoney(item.monto)}</td>
                      <td class="p-2 text-center font-mono text-slate-500">${item.dia_facturacion || '—'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- ACTIVIDAD RECIENTE -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Actividad Reciente del Equipo
            </h2>
            <a href="#/tareas" class="text-xs font-medium text-emerald-600 hover:text-emerald-700">Ver todas &rarr;</a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th class="p-2">Fecha</th>
                  <th class="p-2">Cliente</th>
                  <th class="p-2">Operador</th>
                  <th class="p-2">Descripción</th>
                  <th class="p-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${tareasRecientes.length === 0 ? `
                  <tr><td colspan="5" class="py-6 text-center text-slate-400">No hay tareas recientes registradas.</td></tr>
                ` : tareasRecientes.map(t => {
                  const cli = ClientesAPI.getById(t.cliente_id)
                  return `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="p-2 text-slate-500 font-mono text-[11px]">${formatDate(t.fecha)}</td>
                      <td class="p-2 font-medium text-slate-800">${escHtml(cli?.nombre_comercial || '—')}</td>
                      <td class="p-2 text-slate-600">${escHtml(t.operador_nombre || 'Equipo')}</td>
                      <td class="p-2 text-slate-600 truncate max-w-xs">${escHtml(t.descripcion)}</td>
                      <td class="p-2 text-center">${renderStatusBadge(t.estado)}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `

  container.innerHTML = html

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT BINDINGS
  // ─────────────────────────────────────────────────────────────────────────
  container.querySelector('#btn-nueva-tarea-dash')?.addEventListener('click', () => {
    Router.navigate('tareas')
  })

  container.querySelector('#btn-ir-cobranzas-dash')?.addEventListener('click', () => {
    Router.navigate('cobranzas')
  })

  // Facturación rápida checkbox logic
  const chkMaster = container.querySelector('#chk-master-facturar')
  const chks = container.querySelectorAll('.chk-facturar')
  const btnFacturar = container.querySelector('#btn-facturar-seleccionados')
  const btnSelectAll = container.querySelector('#btn-select-all-facturar')

  function updateFacturarBtn() {
    const checkedCount = Array.from(chks).filter(c => c.checked).length
    if (btnFacturar) {
      btnFacturar.disabled = checkedCount === 0
      btnFacturar.textContent = checkedCount > 0
        ? `Facturar Seleccionados (${checkedCount})`
        : 'Facturar Seleccionados'
    }
  }

  chkMaster?.addEventListener('change', (e) => {
    chks.forEach(c => c.checked = e.target.checked)
    updateFacturarBtn()
  })

  btnSelectAll?.addEventListener('click', () => {
    const newState = Array.from(chks).some(c => !c.checked)
    chks.forEach(c => c.checked = newState)
    if (chkMaster) chkMaster.checked = newState
    updateFacturarBtn()
  })

  chks.forEach(c => c.addEventListener('change', updateFacturarBtn))

  btnFacturar?.addEventListener('click', () => {
    const selectedIds = Array.from(chks).filter(c => c.checked).map(c => c.value)
    if (selectedIds.length === 0) return

    selectedIds.forEach(id => {
      const cli = ClientesAPI.getById(id)
      if (cli) {
        FacturasAPI.create({
          cliente_id: cli.id,
          concepto: `Abono Mensual Recurrente - ${now.toLocaleString('es-AR', { month: 'long', year: 'numeric' })}`,
          monto: cli.monto_abono || 0,
          estado: 'pendiente'
        })
      }
    })

    toast(`Se generaron ${selectedIds.length} facturas correctamente.`, 'success')
    renderDashboard(container)
  })
}
