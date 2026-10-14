/**
 * gastos.js — Módulo de Gastos Operativos y Herramientas del Negocio (AdminYAAA)
 * Control de costos fijos y variables: licencias software/IA, servidores, telefonía, marketing,
 * calendario de vencimientos y registro de egresos.
 */

import { GastosAPI, TesoreriaAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, today, toast, escHtml } from '../core/utils.js'
import { renderStatusBadge, DataTable } from '../components/table.js'

export function renderGastos(container, params = {}) {
  const isAdmin = Auth.isAdmin()
  if (!isAdmin) {
    container.innerHTML = `<div class="p-8 text-center text-slate-500">Acceso restringido a administradores.</div>`
    return
  }

  const gastos = GastosAPI.getAll()
  const proximosVenc = GastosAPI.getVencimientosProximos(15) || []

  const totMes = gastos.reduce((acc, g) => acc + (g.monto || 0), 0)
  const totPendientes = gastos.filter(g => g.estado === 'pendiente').reduce((acc, g) => acc + (g.monto || 0), 0)
  const totPagados = gastos.filter(g => g.estado === 'pagado').reduce((acc, g) => acc + (g.monto || 0), 0)

  // Desglose por categoría
  const porCat = {}
  gastos.forEach(g => {
    porCat[g.categoria] = (porCat[g.categoria] || 0) + (g.monto || 0)
  })

  let html = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-1.5 bg-slate-800 text-white rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            </span>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Gastos Operativos & Herramientas</h1>
          </div>
          <p class="text-xs text-slate-500 mt-1">Estructura de costos fijos, licencias de software, servidores y suministros de AdminYAAA</p>
        </div>

        <button id="btn-nuevo-gasto" class="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Registrar Gasto
        </button>
      </div>

      <!-- Métricas Resumen -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-xs text-slate-500 block">Total Gastos Registrados</span>
          <span class="text-2xl font-bold font-mono text-slate-900 mt-1 block">${formatMoney(totMes)}</span>
          <span class="text-[10px] text-slate-400 mt-1 block">${gastos.length} conceptos activos</span>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-xs text-amber-700 block">Pendientes de Pago</span>
          <span class="text-2xl font-bold font-mono text-amber-600 mt-1 block">${formatMoney(totPendientes)}</span>
          <span class="text-[10px] text-amber-600/80 mt-1 block">${gastos.filter(g => g.estado === 'pendiente').length} facturas por cancelar</span>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-xs text-emerald-700 block">Pagados este Período</span>
          <span class="text-2xl font-bold font-mono text-emerald-600 mt-1 block">${formatMoney(totPagados)}</span>
          <span class="text-[10px] text-emerald-600/80 mt-1 block">${gastos.filter(g => g.estado === 'pagado').length} cancelados</span>
        </div>
      </div>

      <!-- Alertas de Próximos Vencimientos -->
      ${proximosVenc.length > 0 ? `
        <div class="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-amber-600 font-bold">⚠️ Vencimientos en los próximos 15 días:</span>
            <span class="text-amber-800">${proximosVenc.map(g => `${g.proveedor} (${formatMoney(g.monto)}) el ${formatDate(g.fecha_vencimiento)}`).join(' &bull; ')}</span>
          </div>
        </div>
      ` : ''}

      <!-- Tabla Principal de Gastos -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Listado de Gastos Operativos</h2>
        </div>
        <div id="gastos-table-container"></div>
      </div>
    </div>
  `

  container.innerHTML = html

  const tableContainer = container.querySelector('#gastos-table-container')

  DataTable({
    container: tableContainer,
    data: gastos,
    columns: [
      {
        key: 'proveedor',
        label: 'Proveedor / Concepto',
        render: (val, row) => `
          <div>
            <div class="font-semibold text-slate-900">${escHtml(val)}</div>
            <div class="text-[11px] text-slate-500">${escHtml(row.descripcion || '')}</div>
          </div>
        `
      },
      {
        key: 'categoria',
        label: 'Categoría',
        render: (val) => {
          const map = {
            software: 'Software & IA',
            servidor: 'Servidores & Cloud',
            telefonia: 'Telefonía & Internet',
            insumos: 'Insumos de Oficina',
            marketing: 'Marketing & Pauta',
            impuestos: 'Impuestos / Bancarios',
            otros: 'Otros Operativos',
          }
          return `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">${map[val] || val}</span>`
        }
      },
      {
        key: 'fecha_vencimiento',
        label: 'Vencimiento',
        render: (val) => `<span class="font-mono text-slate-600">${formatDate(val)}</span>`
      },
      {
        key: 'monto',
        label: 'Monto ($)',
        align: 'right',
        render: (val) => `<span class="font-mono font-bold text-slate-900">${formatMoney(val)}</span>`
      },
      {
        key: 'estado',
        label: 'Estado',
        align: 'center',
        render: (val) => renderStatusBadge(val)
      },
      {
        key: 'id',
        label: 'Acciones',
        align: 'center',
        sortable: false,
        render: (id, row) => `
          <div class="flex items-center justify-center gap-1.5">
            ${row.estado === 'pendiente' ? `
              <button data-pagar-id="${id}" class="btn-pagar-gasto px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold transition">
                Marcar Pagado
              </button>
            ` : '<span class="text-[11px] text-slate-400">✓ Cancelado</span>'}
          </div>
        `
      }
    ]
  })

  // Listener para marcar pagado
  tableContainer.querySelectorAll('.btn-pagar-gasto').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-pagar-id')
      _marcarGastoPagado(id, () => renderGastos(container, params))
    })
  })

  // Botón Nuevo Gasto
  container.querySelector('#btn-nuevo-gasto')?.addEventListener('click', () => {
    _abrirModalGasto(() => renderGastos(container, params))
  })
}

function _marcarGastoPagado(id, onSaved) {
  const cuentas = TesoreriaAPI.getCuentas()

  const modalHtml = `
    <div class="space-y-3 text-xs">
      <p class="text-slate-600">Seleccioná la cuenta de fondos con la que se abonó este gasto:</p>
      <div>
        <label class="block font-medium text-slate-700 mb-1">Cuenta de Origen</label>
        <select id="pagar-cuenta-select" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold">
          ${cuentas.map(ct => `
            <option value="${ct.id}">${escHtml(ct.nombre)} (Saldo: ${formatMoney(ct.saldo)})</option>
          `).join('')}
        </select>
      </div>
    </div>
  `

  Modal.open({
    title: 'Confirmar Pago de Gasto',
    content: modalHtml,
    size: 'max-w-sm',
    confirmText: 'Registrar Egreso',
    onConfirm: () => {
      const cuentaId = document.getElementById('pagar-cuenta-select')?.value
      const gasto = GastosAPI.getAll().find(g => g.id === id)

      GastosAPI.marcarPagado(id, today())

      if (cuentaId && gasto) {
        TesoreriaAPI.registrarMovimiento(cuentaId, gasto.monto, 'egreso', `Pago Gasto: ${gasto.proveedor}`, id)
      }

      toast('Gasto registrado como pagado correctamente.', 'success')
      if (onSaved) onSaved()
      return true
    }
  })
}

function _abrirModalGasto(onSaved) {
  const modalHtml = `
    <form id="form-nuevo-gasto" class="space-y-4 text-xs">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Proveedor / Servicio *</label>
          <input type="text" id="gasto-prov" required placeholder="Ej: OpenAI / Vercel / Flow" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Categoría *</label>
          <select id="gasto-cat" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
            <option value="software">Software & IA</option>
            <option value="servidor">Servidores & Cloud</option>
            <option value="telefonia">Telefonía & Internet</option>
            <option value="insumos">Insumos de Oficina</option>
            <option value="marketing">Marketing & Pauta</option>
            <option value="impuestos">Impuestos / Bancarios</option>
            <option value="otros">Otros Operativos</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Monto ($) *</label>
          <input type="number" min="1" step="100" id="gasto-monto" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Fecha de Vencimiento *</label>
          <input type="date" id="gasto-venc" required value="${today()}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono">
        </div>
      </div>

      <div>
        <label class="block font-medium text-slate-700 mb-1">Descripción / Detalle</label>
        <textarea id="gasto-desc" rows="2" placeholder="Detalles de la factura o motivo del gasto" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"></textarea>
      </div>
    </form>
  `

  Modal.open({
    title: 'Registrar Gasto Operativo',
    content: modalHtml,
    size: 'max-w-lg',
    confirmText: 'Guardar Gasto',
    onConfirm: () => {
      const prov = document.getElementById('gasto-prov')?.value?.trim()
      const monto = Number(document.getElementById('gasto-monto')?.value || 0)
      if (!prov || monto <= 0) {
        toast('Completá los campos obligatorios.', 'error')
        return false
      }

      GastosAPI.create({
        proveedor: prov,
        categoria: document.getElementById('gasto-cat')?.value || 'software',
        monto,
        fecha_vencimiento: document.getElementById('gasto-venc')?.value || today(),
        descripcion: document.getElementById('gasto-desc')?.value?.trim() || '',
        estado: 'pendiente'
      })

      toast('Gasto registrado exitosamente.', 'success')
      if (onSaved) onSaved()
      return true
    }
  })
}
