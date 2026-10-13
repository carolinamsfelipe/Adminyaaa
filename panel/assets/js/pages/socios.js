/**
 * socios.js — Módulo de Finanzas de Socios y Control Ejecutivo (Exclusivo Admin)
 * Retiros de Socios (Joaquín / Máximo), Gastos Personales Aislados (sin distorsión operativa)
 * y Proyección de Flujo de Caja (Cashflow a 90 días).
 */

import { RetirosAPI, DashboardAPI, TesoreriaAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, today, toast, escHtml } from '../core/utils.js'

export function renderSocios(container, params = {}) {
  const isAdmin = Auth.isAdmin()
  if (!isAdmin) {
    container.innerHTML = `<div class="p-8 text-center text-slate-500">Acceso restringido exclusivamente a Socios Administradores.</div>`
    return
  }

  const retiros = RetirosAPI.getAll()
  const cashflow = DashboardAPI.getCashflowProjection(90) || { m1: { ingresos: 0, egresos: 0, balance: 0 }, m2: { ingresos: 0, egresos: 0, balance: 0 }, m3: { ingresos: 0, egresos: 0, balance: 0 } }

  // Retiros por socio
  const retirosJoaquin = retiros.filter(r => r.socio?.toLowerCase().includes('joaquín') || r.socio?.toLowerCase().includes('joaquin'))
  const retirosMaximo = retiros.filter(r => r.socio?.toLowerCase().includes('máximo') || r.socio?.toLowerCase().includes('maximo'))

  const totJoaquin = retirosJoaquin.reduce((acc, r) => acc + (r.monto || 0), 0)
  const totMaximo = retirosMaximo.reduce((acc, r) => acc + (r.monto || 0), 0)

  // Gastos personales aislados (tipo === 'personal')
  const gastosPersonales = retiros.filter(r => r.tipo === 'gasto_personal')
  const totPersonales = gastosPersonales.reduce((acc, r) => acc + (r.monto || 0), 0)

  let html = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </span>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Finanzas de Socios & Control Ejecutivo</h1>
          </div>
          <p class="text-xs text-slate-500 mt-1">Retiros personales, honorarios, gastos no operativos y proyección de cashflow</p>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-nuevo-retiro" class="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Registrar Retiro / Gasto Personal
          </button>
        </div>
      </div>

      <!-- PROYECCIÓN DE FLUJO DE CAJA (CASHFLOW 90 DÍAS) -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Proyección de Flujo de Caja (Próximos 90 Días)</h2>
            <p class="text-[11px] text-slate-500">Estimación de cobros de abonos recurrentes vs. gastos fijos y sueldos</p>
          </div>
          <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Cashflow Saludable</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <!-- Mes 1 -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Próximos 30 Días (Mes 1)</span>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Ingresos Proyectados:</span>
                <span class="font-mono font-semibold text-emerald-600">+${formatMoney(cashflow.m1.ingresos)}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Egresos Comprometidos:</span>
                <span class="font-mono font-semibold text-rose-600">-${formatMoney(cashflow.m1.egresos)}</span>
              </div>
              <div class="flex justify-between font-bold pt-2 border-t border-slate-200 text-slate-900">
                <span>Saldo Proyectado:</span>
                <span class="font-mono ${cashflow.m1.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${formatMoney(cashflow.m1.balance)}</span>
              </div>
            </div>
          </div>

          <!-- Mes 2 -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">60 Días (Mes 2)</span>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Ingresos Proyectados:</span>
                <span class="font-mono font-semibold text-emerald-600">+${formatMoney(cashflow.m2.ingresos)}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Egresos Comprometidos:</span>
                <span class="font-mono font-semibold text-rose-600">-${formatMoney(cashflow.m2.egresos)}</span>
              </div>
              <div class="flex justify-between font-bold pt-2 border-t border-slate-200 text-slate-900">
                <span>Saldo Proyectado:</span>
                <span class="font-mono ${cashflow.m2.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${formatMoney(cashflow.m2.balance)}</span>
              </div>
            </div>
          </div>

          <!-- Mes 3 -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">90 Días (Mes 3)</span>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Ingresos Proyectados:</span>
                <span class="font-mono font-semibold text-emerald-600">+${formatMoney(cashflow.m3.ingresos)}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Egresos Comprometidos:</span>
                <span class="font-mono font-semibold text-rose-600">-${formatMoney(cashflow.m3.egresos)}</span>
              </div>
              <div class="flex justify-between font-bold pt-2 border-t border-slate-200 text-slate-900">
                <span>Saldo Proyectado:</span>
                <span class="font-mono ${cashflow.m3.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${formatMoney(cashflow.m3.balance)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RESUMEN DE RETIROS POR SOCIO -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Tarjeta Joaquín -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">JI</div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Joaquín Ibáñez</h3>
              <span class="text-[10px] text-slate-400">Socio Fundador / Administración</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100">
            <span class="text-xs text-slate-500 block">Total Retiros Período</span>
            <span class="text-xl font-bold font-mono text-slate-900 mt-0.5 block">${formatMoney(totJoaquin)}</span>
          </div>
        </div>

        <!-- Tarjeta Máximo -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">MF</div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Máximo Ferreyra</h3>
              <span class="text-[10px] text-slate-400">Socio / Operaciones & Clientes</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100">
            <span class="text-xs text-slate-500 block">Total Retiros Período</span>
            <span class="text-xl font-bold font-mono text-slate-900 mt-0.5 block">${formatMoney(totMaximo)}</span>
          </div>
        </div>

        <!-- Tarjeta Gastos Personales Aislados -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-sm">🔒</div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Gastos Personales Aislados</h3>
              <span class="text-[10px] text-purple-700 font-medium">No distorsionan márgenes PyME</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100">
            <span class="text-xs text-slate-500 block">Total Imputado a Cuentas Socios</span>
            <span class="text-xl font-bold font-mono text-purple-700 mt-0.5 block">${formatMoney(totPersonales)}</span>
          </div>
        </div>
      </div>

      <!-- TABLA DETALLE DE RETIROS Y GASTOS PERSONALES -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Historial de Retiros y Movimientos Personales</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th class="p-3">Fecha</th>
                <th class="p-3">Socio</th>
                <th class="p-3">Tipo de Movimiento</th>
                <th class="p-3">Concepto / Detalle</th>
                <th class="p-3">Cuenta Utilizada</th>
                <th class="p-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${retiros.length === 0 ? `
                <tr><td colspan="6" class="p-6 text-center text-slate-400">Sin retiros registrados este período.</td></tr>
              ` : retiros.map(r => `
                <tr class="hover:bg-slate-50">
                  <td class="p-3 font-mono text-slate-500">${formatDate(r.fecha)}</td>
                  <td class="p-3 font-semibold text-slate-800">${escHtml(r.socio)}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-medium ${
                      r.tipo === 'gasto_personal' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                    }">
                      ${r.tipo === 'gasto_personal' ? 'Gasto Personal Aislado' : 'Retiro / Honorario'}
                    </span>
                  </td>
                  <td class="p-3 text-slate-700">${escHtml(r.concepto || '—')}</td>
                  <td class="p-3 text-slate-600 font-mono text-[11px]">${escHtml(r.cuenta || 'Bancos')}</td>
                  <td class="p-3 text-right font-mono font-bold text-slate-900">${formatMoney(r.monto)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `

  container.innerHTML = html

  // Botón Nuevo Retiro
  container.querySelector('#btn-nuevo-retiro')?.addEventListener('click', () => {
    _abrirModalRetiro(() => renderSocios(container, params))
  })
}

function _abrirModalRetiro(onSaved) {
  const cuentas = TesoreriaAPI.getCuentas()

  const modalHtml = `
    <form id="form-retiro-socio" class="space-y-4 text-xs">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Socio *</label>
          <select id="retiro-socio-select" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold">
            <option value="Joaquín Ibáñez">Joaquín Ibáñez</option>
            <option value="Máximo Ferreyra">Máximo Ferreyra</option>
          </select>
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Tipo de Movimiento *</label>
          <select id="retiro-tipo-select" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
            <option value="retiro">Retiro de Ganancias / Honorarios</option>
            <option value="gasto_personal">Gasto Personal Aislado (Tarjeta/Cuenta del Negocio)</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Monto ($) *</label>
          <input type="number" min="1" step="1000" id="retiro-monto" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Fecha *</label>
          <input type="date" id="retiro-fecha" value="${today()}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono">
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Cuenta de Salida *</label>
          <select id="retiro-cuenta-select" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
            ${cuentas.map(ct => `
              <option value="${ct.nombre}">${escHtml(ct.nombre)} (Saldo: ${formatMoney(ct.saldo)})</option>
            `).join('')}
          </select>
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Concepto / Motivo</label>
          <input type="text" id="retiro-concepto" placeholder="Ej: Honorarios mes / Compra particular" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
        </div>
      </div>

      <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-900">
        <strong>Importante:</strong> Los "Gastos Personales Aislados" se descuentan de la caja del negocio pero <u>no se computan</u> como costos operativos de AdminYAAA, protegiendo la métrica de ganancia real.
      </div>
    </form>
  `

  Modal.open({
    title: 'Registrar Movimiento de Socio',
    content: modalHtml,
    size: 'max-w-lg',
    confirmText: 'Registrar Movimiento',
    onConfirm: () => {
      const socio = document.getElementById('retiro-socio-select')?.value
      const tipo = document.getElementById('retiro-tipo-select')?.value
      const monto = Number(document.getElementById('retiro-monto')?.value || 0)
      const fecha = document.getElementById('retiro-fecha')?.value
      const cuenta = document.getElementById('retiro-cuenta-select')?.value
      const concepto = document.getElementById('retiro-concepto')?.value?.trim()

      if (monto <= 0) {
        toast('Ingresá un monto válido.', 'error')
        return false
      }

      RetirosAPI.create({
        socio,
        tipo,
        monto,
        fecha,
        cuenta,
        concepto: concepto || (tipo === 'gasto_personal' ? 'Gasto Personal Particular' : 'Retiro de Ganancias'),
      })

      // Reflejar en tesorería
      const cuentaObj = cuentas.find(c => c.nombre === cuenta)
      if (cuentaObj) {
        TesoreriaAPI.registrarMovimiento(cuentaObj.id, monto, 'egreso', `Retiro Socio: ${socio}`, null)
      }

      toast('Movimiento de socio registrado con éxito.', 'success')
      if (onSaved) onSaved()
      return true
    }
  })
}
