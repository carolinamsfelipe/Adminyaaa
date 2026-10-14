/**
 * tesoreria.js — Módulo de Tesorería y Cuentas de Dinero (AdminYAAA)
 * Catálogo de cuentas: Banco Nación, Banco Galicia, Mercado Pago, Efectivo Ramos Mejía, Cajas Chicas.
 * Movimientos consolidados en tiempo real, conciliación y transferencias entre cuentas.
 */

import { TesoreriaAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, today, toast, escHtml } from '../core/utils.js'

export function renderTesoreria(container, params = {}) {
  const isAdmin = Auth.isAdmin()
  if (!isAdmin) {
    container.innerHTML = `<div class="p-8 text-center text-slate-500">Acceso restringido a administradores.</div>`
    return
  }

  const cuentas = TesoreriaAPI.getCuentas()
  const totalConsolidado = TesoreriaAPI.getSaldoTotal()
  const movimientos = TesoreriaAPI.getConciliacion(null, null, null) || []

  let html = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </span>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Tesorería & Cuentas de Fondos</h1>
          </div>
          <p class="text-xs text-slate-500 mt-1">Disponibilidad bancaria, billeteras virtuales y fondos físicos de AdminYAAA</p>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-transferencia-interna" class="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            Transferencia entre Cuentas
          </button>
        </div>
      </div>

      <!-- Saldo Consolidado Global -->
      <div class="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Saldo Líquido Consolidado Total</span>
          <div class="text-3xl font-extrabold font-mono text-emerald-400 mt-1 tracking-tight">${formatMoney(totalConsolidado)}</div>
          <p class="text-[11px] text-slate-400 mt-1">Suma en tiempo real de todos los bancos, Mercado Pago y efectivo en Ramos Mejía</p>
        </div>
        <div class="text-xs space-y-1 text-slate-300">
          <div>✓ Cuentas bancarias activas: <strong class="text-white">${cuentas.filter(c => c.tipo === 'banco').length}</strong></div>
          <div>✓ Billeteras virtuales: <strong class="text-white">${cuentas.filter(c => c.tipo === 'digital').length}</strong></div>
          <div>✓ Cajas físicas y chicas: <strong class="text-white">${cuentas.filter(c => c.tipo === 'efectivo' || c.tipo === 'caja_chica').length}</strong></div>
        </div>
      </div>

      <!-- Tarjetas de Cuentas Individuales -->
      <div>
        <h2 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cuentas Monetarias Registradas</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${cuentas.map(ct => {
            const pct = totalConsolidado > 0 ? Math.round((ct.saldo / totalConsolidado) * 100) : 0
            const icons = {
              banco: '🏦',
              digital: '📱',
              efectivo: '💵',
              caja_chica: '🪙',
            }
            return `
              <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between text-slate-500 mb-1">
                    <span class="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <span>${icons[ct.tipo] || '💰'}</span>
                      <span>${escHtml(ct.nombre)}</span>
                    </span>
                    <span class="text-[10px] font-mono text-slate-400">${pct}% del total</span>
                  </div>
                  <div class="text-xl font-bold font-mono text-slate-900 mt-2">
                    ${formatMoney(ct.saldo)}
                  </div>
                </div>
                <div class="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span class="text-slate-400 capitalize">${escHtml(ct.tipo.replace('_', ' '))}</span>
                  <span class="font-medium text-emerald-600">Al día</span>
                </div>
              </div>
            `
          }).join('')}
        </div>
      </div>

      <!-- Libro de Movimientos y Conciliación -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Historial de Movimientos & Conciliación</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th class="p-3">Fecha</th>
                <th class="p-3">Cuenta Imputada</th>
                <th class="p-3">Concepto / Detalle</th>
                <th class="p-3">Referencia</th>
                <th class="p-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono">
              ${movimientos.length === 0 ? `
                <tr><td colspan="5" class="p-6 text-center text-slate-400 font-sans">No se registran movimientos recientes.</td></tr>
              ` : movimientos.map(m => {
                const isIngreso = m.tipo === 'ingreso'
                return `
                  <tr class="hover:bg-slate-50">
                    <td class="p-3 text-slate-500">${formatDate(m.fecha)}</td>
                    <td class="p-3 font-sans font-medium text-slate-800">${escHtml(m.cuenta_nombre || 'Cuenta')}</td>
                    <td class="p-3 font-sans text-slate-700">${escHtml(m.concepto || '—')}</td>
                    <td class="p-3 text-slate-400 text-[11px]">${escHtml(m.referencia || '—')}</td>
                    <td class="p-3 text-right font-bold ${isIngreso ? 'text-emerald-600' : 'text-rose-600'}">
                      ${isIngreso ? '+' : '-'}${formatMoney(m.monto)}
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `

  container.innerHTML = html

  // Botón transferencia interna
  container.querySelector('#btn-transferencia-interna')?.addEventListener('click', () => {
    _abrirModalTransferenciaInterna(cuentas, () => renderTesoreria(container, params))
  })
}

function _abrirModalTransferenciaInterna(cuentas, onSaved) {
  const modalHtml = `
    <form id="form-trf-interna" class="space-y-4 text-xs">
      <div>
        <label class="block font-medium text-slate-700 mb-1">Cuenta de Origen *</label>
        <select id="trf-origen" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold">
          ${cuentas.map(ct => `
            <option value="${ct.id}">${escHtml(ct.nombre)} (Saldo: ${formatMoney(ct.saldo)})</option>
          `).join('')}
        </select>
      </div>

      <div>
        <label class="block font-medium text-slate-700 mb-1">Cuenta de Destino *</label>
        <select id="trf-destino" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold">
          ${cuentas.map((ct, idx) => `
            <option value="${ct.id}" ${idx === 1 ? 'selected' : ''}>${escHtml(ct.nombre)} (Saldo: ${formatMoney(ct.saldo)})</option>
          `).join('')}
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Monto a Transferir ($) *</label>
          <input type="number" min="1" step="1000" id="trf-monto" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Fecha *</label>
          <input type="date" id="trf-fecha" value="${today()}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono">
        </div>
      </div>

      <div>
        <label class="block font-medium text-slate-700 mb-1">Motivo / Concepto</label>
        <input type="text" id="trf-concepto" placeholder="Ej: Traspaso a efectivo / Cobertura de cuenta" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
      </div>
    </form>
  `

  Modal.open({
    title: 'Transferencia Interna entre Cuentas',
    content: modalHtml,
    size: 'max-w-md',
    confirmText: 'Ejecutar Transferencia',
    onConfirm: () => {
      const origId = document.getElementById('trf-origen')?.value
      const destId = document.getElementById('trf-destino')?.value
      const monto = Number(document.getElementById('trf-monto')?.value || 0)
      const concepto = document.getElementById('trf-concepto')?.value?.trim() || 'Transferencia Interna'

      if (origId === destId) {
        toast('El origen y el destino no pueden ser la misma cuenta.', 'error')
        return false
      }
      if (monto <= 0) {
        toast('Ingresá un monto válido.', 'error')
        return false
      }

      // Ejecutar egreso e ingreso
      TesoreriaAPI.registrarMovimiento(origId, monto, 'egreso', `Trf Saliente a ${cuentas.find(c => c.id === destId)?.nombre}: ${concepto}`, null)
      TesoreriaAPI.registrarMovimiento(destId, monto, 'ingreso', `Trf Entrante de ${cuentas.find(c => c.id === origId)?.nombre}: ${concepto}`, null)

      toast(`Transferencia de ${formatMoney(monto)} completada con éxito.`, 'success')
      if (onSaved) onSaved()
      return true
    }
  })
}
