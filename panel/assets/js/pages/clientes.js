/**
 * clientes.js — Módulo de Clientes y Fichas Comerciales de AdminYAAA
 * CRUD completo, ficha comercial, resumen financiero anual, cuenta corriente y alianzas.
 */

import { ClientesAPI, TareasAPI, FacturasAPI, PagosAPI, EstudiosAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, toast, escHtml, validateCUIT } from '../core/utils.js'
import { renderStatusBadge, DataTable } from '../components/table.js'
import { Router } from '../core/router.js'

export function renderClientes(container, params = {}) {
  const isAdmin = Auth.isAdmin()
  const clienteId = params.id

  if (clienteId) {
    _renderFichaCliente(container, clienteId)
  } else {
    _renderListaClientes(container)
  }
}

function _renderListaClientes(container) {
  const isAdmin = Auth.isAdmin()
  const user = Auth.currentUser()
  const clientes = isAdmin ? ClientesAPI.getAll() : ClientesAPI.getByOperador(user?.id)
  const estudios = EstudiosAPI.getAll()

  let html = `
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Cartera de Clientes</h1>
          <p class="text-xs text-slate-500 mt-1">Gestión integral, fichas comerciales y estados de cuenta</p>
        </div>
        <div class="flex items-center gap-2">
          ${isAdmin ? `
            <button id="btn-nuevo-cliente" class="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Nuevo Cliente
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Filtros rápidos por Rubro -->
      <div class="flex flex-wrap items-center gap-2 text-xs" id="rubro-filters">
        <button data-rubro="todos" class="rubro-pill active px-3 py-1.5 rounded-full font-medium bg-slate-900 text-white">Todos (${clientes.length})</button>
        <button data-rubro="gastronomia" class="rubro-pill px-3 py-1.5 rounded-full font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Gastronomía</button>
        <button data-rubro="distribuidora" class="rubro-pill px-3 py-1.5 rounded-full font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Distribuidoras</button>
        <button data-rubro="comercio" class="rubro-pill px-3 py-1.5 rounded-full font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Comercios</button>
        <button data-rubro="servicio" class="rubro-pill px-3 py-1.5 rounded-full font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Servicios</button>
        <button data-rubro="estudio_contable" class="rubro-pill px-3 py-1.5 rounded-full font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">Estudios Contables</button>
      </div>

      <!-- Contenedor de la tabla -->
      <div id="clientes-table-container"></div>
    </div>
  `

  container.innerHTML = html

  const tableContainer = container.querySelector('#clientes-table-container')

  function mountTable(filteredList) {
    const tableData = filteredList.map(c => {
      const summary = ClientesAPI.getFinancialSummary(c.id)
      return {
        ...c,
        saldo_deuda: summary.saldo_deuda,
        total_facturado: summary.total_facturado,
      }
    })

    DataTable({
      container: tableContainer,
      data: tableData,
      columns: [
        {
          key: 'nombre_comercial',
          label: 'Cliente / Razón Social',
          render: (val, row) => `
            <div>
              <a href="#/clientes?id=${row.id}" class="font-semibold text-slate-900 hover:text-emerald-600 text-sm block">
                ${escHtml(val)}
              </a>
              <div class="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span>${escHtml(row.razon_social || '')}</span>
                ${row.cuit ? `&bull; <span>CUIT: ${escHtml(row.cuit)}</span>` : ''}
              </div>
            </div>
          `
        },
        {
          key: 'rubro',
          label: 'Rubro & Contrato',
          render: (val, row) => `
            <div class="space-y-1">
              <span class="inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-700 capitalize">
                ${escHtml(val)}
              </span>
              <div class="text-[10px] text-slate-500">
                ${row.tipo_contrato === 'abono_mensual' ? '<span class="text-emerald-600 font-medium">Abono Recurrente</span>' : 'Trabajo Puntual'}
              </div>
            </div>
          `
        },
        {
          key: 'dueno_nombre',
          label: 'Contacto / WhatsApp',
          render: (val, row) => `
            <div>
              <div class="font-medium text-slate-800">${escHtml(val || '—')}</div>
              ${row.whatsapp ? `
                <a href="https://wa.me/${row.whatsapp.replace(/\D/g,'')}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline mt-0.5 font-mono">
                  <span>📱 ${escHtml(row.whatsapp)}</span>
                </a>
              ` : '<span class="text-[11px] text-slate-400">Sin WhatsApp</span>'}
            </div>
          `
        },
        {
          key: 'monto_abono',
          label: 'Abono / Día Fact.',
          align: 'right',
          render: (val, row) => `
            <div class="text-right">
              <div class="font-mono font-medium text-slate-900">${row.tipo_contrato === 'abono_mensual' ? formatMoney(val) : '—'}</div>
              <div class="text-[10px] text-slate-400">Día ${row.dia_facturacion || '—'}</div>
            </div>
          `
        },
        {
          key: 'saldo_deuda',
          label: 'Saldo Actual',
          align: 'right',
          render: (val) => `
            <div class="font-mono font-bold ${val > 0 ? 'text-rose-600' : 'text-emerald-600'}">
              ${val > 0 ? formatMoney(val) : '$ 0'}
            </div>
          `
        },
        {
          key: 'id',
          label: 'Acciones',
          align: 'center',
          sortable: false,
          render: (id, row) => `
            <div class="flex items-center justify-center gap-1.5">
              <a href="#/clientes?id=${id}" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition" title="Ver Ficha">
                Ficha
              </a>
              ${isAdmin ? `
                <button data-edit-id="${id}" class="btn-editar-cliente p-1 text-slate-400 hover:text-slate-700 rounded" title="Editar">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
              ` : ''}
            </div>
          `
        }
      ]
    })

    // Listeners para botones de editar
    tableContainer.querySelectorAll('.btn-editar-cliente').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-edit-id')
        _abrirModalCliente(id, () => mountTable(clientes))
      })
    })
  }

  mountTable(clientes)

  // Filtros de rubro
  container.querySelectorAll('.rubro-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.rubro-pill').forEach(b => {
        b.classList.remove('bg-slate-900', 'text-white')
        b.classList.add('bg-white', 'text-slate-600')
      })
      btn.classList.add('bg-slate-900', 'text-white')
      btn.classList.remove('bg-white', 'text-slate-600')

      const rubro = btn.getAttribute('data-rubro')
      const filtered = rubro === 'todos' ? clientes : clientes.filter(c => c.rubro === rubro)
      mountTable(filtered)
    })
  })

  // Botón Nuevo Cliente
  container.querySelector('#btn-nuevo-cliente')?.addEventListener('click', () => {
    _abrirModalCliente(null, () => _renderListaClientes(container))
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// FICHA INDIVIDUAL DE CLIENTE
// ─────────────────────────────────────────────────────────────────────────────
function _renderFichaCliente(container, clienteId) {
  const cliente = ClientesAPI.getById(clienteId)
  if (!cliente) {
    container.innerHTML = `
      <div class="py-12 text-center">
        <p class="text-slate-500 mb-4">Cliente no encontrado o dado de baja.</p>
        <a href="#/clientes" class="text-emerald-600 font-semibold">&larr; Volver a la lista</a>
      </div>
    `
    return
  }

  const isAdmin = Auth.isAdmin()
  const summary = ClientesAPI.getFinancialSummary(clienteId)
  const tareas = TareasAPI.getByCliente(clienteId)
  const facturas = FacturasAPI.getByCliente(clienteId)
  const pagos = PagosAPI.getByCliente(clienteId)
  const estudio = cliente.estudio_aliado_id ? EstudiosAPI.getAll().find(e => e.id === cliente.estudio_aliado_id) : null

  let html = `
    <div class="space-y-6">
      <!-- Breadcrumb y Volver -->
      <div class="flex items-center justify-between">
        <a href="#/clientes" class="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Volver a Cartera de Clientes
        </a>
        ${isAdmin ? `
          <button id="btn-editar-ficha" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            Editar Datos
          </button>
        ` : ''}
      </div>

      <!-- Header de la Ficha -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-slate-900">${escHtml(cliente.nombre_comercial)}</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize">
                ${escHtml(cliente.rubro)}
              </span>
            </div>
            <div class="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span><strong>Razón Social:</strong> ${escHtml(cliente.razon_social || '—')}</span>
              <span><strong>CUIT:</strong> ${escHtml(cliente.cuit || '—')}</span>
              <span><strong>Dirección:</strong> ${escHtml(cliente.direccion || '—')}</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            ${cliente.whatsapp ? `
              <a href="https://wa.me/${cliente.whatsapp.replace(/\D/g,'')}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold border border-emerald-200 transition">
                <span>📱 WhatsApp Directo</span>
              </a>
            ` : ''}
            <a href="#/cobranzas" class="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition">
              Cobranzas / Morosidad
            </a>
          </div>
        </div>

        <!-- Indicadores Financieros Rápidos -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div class="p-3 rounded-lg bg-slate-50">
            <span class="text-[11px] text-slate-500 block">Total Facturado</span>
            <span class="text-lg font-bold font-mono text-slate-900">${formatMoney(summary.total_facturado)}</span>
          </div>
          <div class="p-3 rounded-lg bg-slate-50">
            <span class="text-[11px] text-slate-500 block">Total Cobrado</span>
            <span class="text-lg font-bold font-mono text-emerald-600">${formatMoney(summary.total_cobrado)}</span>
          </div>
          <div class="p-3 rounded-lg ${summary.saldo_deuda > 0 ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50'}">
            <span class="text-[11px] ${summary.saldo_deuda > 0 ? 'text-rose-700' : 'text-slate-500'} block">Saldo Deudor (Cta Cte)</span>
            <span class="text-lg font-bold font-mono ${summary.saldo_deuda > 0 ? 'text-rose-600' : 'text-slate-900'}">${formatMoney(summary.saldo_deuda)}</span>
          </div>
          <div class="p-3 rounded-lg bg-slate-50">
            <span class="text-[11px] text-slate-500 block">Contrato Actual</span>
            <span class="text-xs font-semibold text-slate-800 block mt-1">
              ${cliente.tipo_contrato === 'abono_mensual' ? `Abono ${formatMoney(cliente.monto_abono)} (Día ${cliente.dia_facturacion})` : 'Trabajo Puntual'}
            </span>
          </div>
        </div>
      </div>

      <!-- Tabs de Detalle -->
      <div class="space-y-4">
        <div class="flex border-b border-slate-200 gap-6 text-sm font-medium">
          <button class="tab-btn pb-3 border-b-2 border-emerald-600 text-emerald-700 font-semibold" data-tab="servicios">Historial de Servicios (${tareas.length})</button>
          <button class="tab-btn pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800" data-tab="ctacte">Cuenta Corriente & Facturación</button>
          <button class="tab-btn pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800" data-tab="notas">Notas Internas Confidenciales</button>
        </div>

        <!-- CONTENIDO TAB: SERVICIOS -->
        <div id="tab-content-servicios" class="tab-panel space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Servicios y Tareas Asignadas</h3>
            <button id="btn-agregar-servicio-ficha" class="px-2.5 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700">
              + Cargar Tarea
            </button>
          </div>
          <div class="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3">Fecha</th>
                  <th class="p-3">Operador</th>
                  <th class="p-3">Descripción</th>
                  <th class="p-3">Horas</th>
                  <th class="p-3">Precio</th>
                  <th class="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${tareas.length === 0 ? `
                  <tr><td colspan="6" class="p-6 text-center text-slate-400">Sin tareas cargadas para este cliente.</td></tr>
                ` : tareas.map(t => `
                  <tr class="hover:bg-slate-50">
                    <td class="p-3 font-mono text-slate-500">${formatDate(t.fecha)}</td>
                    <td class="p-3 font-medium text-slate-800">${escHtml(t.operador_nombre || 'Equipo')}</td>
                    <td class="p-3 text-slate-700">${escHtml(t.descripcion)}</td>
                    <td class="p-3 font-mono text-slate-600">${t.horas || '—'} hs</td>
                    <td class="p-3 font-mono font-medium">${t.abono_incluido ? '<span class="text-slate-400">En Abono</span>' : formatMoney(t.precio)}</td>
                    <td class="p-3 text-center">${renderStatusBadge(t.estado)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- CONTENIDO TAB: CUENTA CORRIENTE -->
        <div id="tab-content-ctacte" class="tab-panel hidden space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Historial de Facturas y Cobranzas</h3>
            <a href="#/cuentas-corrientes" class="text-xs text-emerald-600 font-semibold hover:underline">Ver en Libro Mayor Completo &rarr;</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Facturas -->
            <div class="bg-white rounded-lg border border-slate-200 p-4">
              <h4 class="text-xs font-bold text-slate-700 uppercase mb-3">Facturas Emitidas</h4>
              <div class="space-y-2 max-h-60 overflow-y-auto">
                ${facturas.length === 0 ? '<p class="text-xs text-slate-400 py-4 text-center">No hay facturas emitidas.</p>' : facturas.map(f => `
                  <div class="flex items-center justify-between p-2 rounded border border-slate-100 text-xs">
                    <div>
                      <span class="font-semibold text-slate-800">${escHtml(f.numero || 'S/N')}</span>
                      <p class="text-[10px] text-slate-400 font-mono">${formatDate(f.fecha)} &bull; ${escHtml(f.concepto || '')}</p>
                    </div>
                    <div class="text-right">
                      <div class="font-mono font-bold text-slate-900">${formatMoney(f.monto)}</div>
                      <div>${renderStatusBadge(f.estado)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Pagos Recibidos -->
            <div class="bg-white rounded-lg border border-slate-200 p-4">
              <h4 class="text-xs font-bold text-slate-700 uppercase mb-3">Pagos Registrados</h4>
              <div class="space-y-2 max-h-60 overflow-y-auto">
                ${pagos.length === 0 ? '<p class="text-xs text-slate-400 py-4 text-center">No se registran pagos.</p>' : pagos.map(p => `
                  <div class="flex items-center justify-between p-2 rounded border border-slate-100 text-xs">
                    <div>
                      <span class="font-semibold text-emerald-700">+${formatMoney(p.monto)}</span>
                      <p class="text-[10px] text-slate-400 font-mono">${formatDate(p.fecha)} &bull; ${escHtml(p.cuenta_destino || 'Cuenta')}</p>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] font-mono text-slate-500">${escHtml(p.comprobante || 'Sin comp.')}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- CONTENIDO TAB: NOTAS -->
        <div id="tab-content-notas" class="tab-panel hidden space-y-4">
          <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 class="text-sm font-semibold text-slate-800 mb-2">Notas Internas Confidenciales</h3>
            <p class="text-xs text-slate-500 mb-4">Información sobre modalidades de trabajo, requerimientos especiales del dueño o acuerdos comerciales.</p>
            <textarea id="textarea-notas-cliente" rows="6" class="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Escribí notas sobre este cliente...">${escHtml(cliente.notas_internas || '')}</textarea>
            <div class="mt-3 flex justify-end">
              <button id="btn-guardar-notas" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition">
                Guardar Notas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  container.innerHTML = html

  // Tabs switching
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('border-emerald-600', 'text-emerald-700', 'font-semibold')
        b.classList.add('border-transparent', 'text-slate-500')
      })
      btn.classList.add('border-emerald-600', 'text-emerald-700', 'font-semibold')
      btn.classList.remove('border-transparent', 'text-slate-500')

      const tab = btn.getAttribute('data-tab')
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'))
      container.querySelector(`#tab-content-${tab}`)?.classList.remove('hidden')
    })
  })

  // Guardar notas
  container.querySelector('#btn-guardar-notas')?.addEventListener('click', () => {
    const notas = container.querySelector('#textarea-notas-cliente')?.value || ''
    ClientesAPI.update(clienteId, { notas_internas: notas })
    toast('Notas actualizadas correctamente', 'success')
  })

  // Editar ficha
  container.querySelector('#btn-editar-ficha')?.addEventListener('click', () => {
    _abrirModalCliente(clienteId, () => _renderFichaCliente(container, clienteId))
  })

  // Agregar servicio rápido
  container.querySelector('#btn-agregar-servicio-ficha')?.addEventListener('click', () => {
    Router.navigate('tareas')
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE ALTA / EDICIÓN DE CLIENTE
// ─────────────────────────────────────────────────────────────────────────────
function _abrirModalCliente(id, onSaved) {
  const cliente = id ? ClientesAPI.getById(id) : null
  const estudios = EstudiosAPI.getAll()

  const modalHtml = `
    <form id="form-cliente-modal" class="space-y-4 text-xs">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Nombre Comercial *</label>
          <input type="text" id="modal-cli-nombre" required value="${escHtml(cliente?.nombre_comercial || '')}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Razón Social</label>
          <input type="text" id="modal-cli-razon" value="${escHtml(cliente?.razon_social || '')}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500">
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">CUIT / CUIL</label>
          <input type="text" id="modal-cli-cuit" placeholder="30-12345678-9" value="${escHtml(cliente?.cuit || '')}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Rubro *</label>
          <select id="modal-cli-rubro" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500">
            <option value="gastronomia" ${cliente?.rubro === 'gastronomia' ? 'selected' : ''}>Gastronomía</option>
            <option value="distribuidora" ${cliente?.rubro === 'distribuidora' ? 'selected' : ''}>Distribuidora</option>
            <option value="comercio" ${cliente?.rubro === 'comercio' ? 'selected' : ''}>Comercio</option>
            <option value="servicio" ${cliente?.rubro === 'servicio' ? 'selected' : ''}>Servicio</option>
            <option value="estudio_contable" ${cliente?.rubro === 'estudio_contable' ? 'selected' : ''}>Estudio Contable</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Tipo de Contrato</label>
          <select id="modal-cli-contrato" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500">
            <option value="abono_mensual" ${cliente?.tipo_contrato === 'abono_mensual' ? 'selected' : ''}>Abono Mensual Recurrente</option>
            <option value="trabajo_puntual" ${cliente?.tipo_contrato === 'trabajo_puntual' ? 'selected' : ''}>Trabajo Puntual</option>
          </select>
        </div>
        <div id="wrapper-abono-monto">
          <label class="block font-medium text-slate-700 mb-1">Monto Abono Mensual ($)</label>
          <input type="number" id="modal-cli-monto" value="${cliente?.monto_abono || 0}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500">
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Día de Facturación Mensual</label>
          <input type="number" min="1" max="31" id="modal-cli-dia" value="${cliente?.dia_facturacion || 5}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Contacto Principal / Dueño</label>
          <input type="text" id="modal-cli-dueno" value="${escHtml(cliente?.dueno_nombre || '')}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500">
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Teléfono / WhatsApp</label>
          <input type="text" id="modal-cli-whatsapp" placeholder="54911..." value="${escHtml(cliente?.whatsapp || '')}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-emerald-500">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Estudio Contable Aliado</label>
          <select id="modal-cli-estudio" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500">
            <option value="">Ninguno / Directo</option>
            ${estudios.map(est => `
              <option value="${est.id}" ${cliente?.estudio_aliado_id === est.id ? 'selected' : ''}>${escHtml(est.nombre)} (${escHtml(est.zona)})</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div>
        <label class="block font-medium text-slate-700 mb-1">Dirección / Localidad</label>
        <input type="text" id="modal-cli-direccion" value="${escHtml(cliente?.direccion || '')}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500">
      </div>
    </form>
  `

  Modal.open({
    title: cliente ? `Editar Cliente: ${cliente.nombre_comercial}` : 'Registrar Nuevo Cliente',
    content: modalHtml,
    size: 'max-w-2xl',
    confirmText: cliente ? 'Actualizar Cliente' : 'Guardar Cliente',
    onConfirm: () => {
      const nombre = document.getElementById('modal-cli-nombre')?.value?.trim()
      if (!nombre) {
        toast('El nombre comercial es obligatorio.', 'error')
        return false
      }

      const datos = {
        nombre_comercial: nombre,
        razon_social: document.getElementById('modal-cli-razon')?.value?.trim() || '',
        cuit: document.getElementById('modal-cli-cuit')?.value?.trim() || '',
        rubro: document.getElementById('modal-cli-rubro')?.value || 'servicio',
        tipo_contrato: document.getElementById('modal-cli-contrato')?.value || 'abono_mensual',
        monto_abono: Number(document.getElementById('modal-cli-monto')?.value || 0),
        dia_facturacion: Number(document.getElementById('modal-cli-dia')?.value || 5),
        dueno_nombre: document.getElementById('modal-cli-dueno')?.value?.trim() || '',
        whatsapp: document.getElementById('modal-cli-whatsapp')?.value?.trim() || '',
        estudio_aliado_id: document.getElementById('modal-cli-estudio')?.value || null,
        direccion: document.getElementById('modal-cli-direccion')?.value?.trim() || '',
      }

      if (id) {
        ClientesAPI.update(id, datos)
        toast('Cliente actualizado exitosamente.', 'success')
      } else {
        ClientesAPI.create(datos)
        toast('Cliente registrado exitosamente.', 'success')
      }

      if (onSaved) onSaved()
      return true
    }
  })
}
