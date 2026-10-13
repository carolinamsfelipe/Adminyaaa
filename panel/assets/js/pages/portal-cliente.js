/**
 * portal-cliente.js — Portal Exclusivo para Clientes de AdminYAAA
 *
 * Vista protegida y aislada para clientes (gastronómicos, distribuidoras, comercios):
 *   1. Mi Cuenta Corriente: Saldo actual, facturas emitidas y pagos aplicados
 *   2. Mis Servicios & Tareas en Curso: Seguimiento del trabajo de AdminYAAA
 *   3. Centro de Carga / Compartir Documentos: Buzón para subir comprobantes, tickets y planillas
 *   4. Mis Pedidos de Mercadería Mayorista: Seguimiento y solicitud directa
 */

import { PortalClienteAPI, ClientesAPI, MayoristaAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, today, toast, escHtml } from '../core/utils.js'
import { renderStatusBadge } from '../components/table.js'

export function renderPortalCliente(container, params = {}) {
  const user = Auth.currentUser()
  const clienteId = user?.cliente_id || 'c2' // Parrilla Los Robles por defecto
  const cliente = ClientesAPI.getById(clienteId) || { nombre_comercial: user?.nombre || 'Mi Empresa', rubro: 'Gastronomía' }

  let activeTab = params.tab || 'ctacte'

  function render() {
    const facturas = PortalClienteAPI.getMisFacturas(clienteId) || []
    const pagos = PortalClienteAPI.getMisPagos(clienteId) || []
    const tareas = PortalClienteAPI.getMisTareas(clienteId) || []
    const docs = PortalClienteAPI.getDocumentos(clienteId) || []
    const pedidosMayoristas = PortalClienteAPI.getMisPedidosMayoristas(clienteId) || []

    const saldoPendiente = facturas
      .filter(f => f.estado === 'pendiente' || f.estado === 'vencida')
      .reduce((acc, f) => acc + (f.monto || 0), 0)

    let html = `
      <div class="space-y-6">
        <!-- Banner de Bienvenida del Cliente -->
        <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm border border-slate-700/50">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
                <span>Portal de Gestión PyME</span> &bull; <span>AdminYAAA</span>
              </div>
              <h1 class="text-2xl font-extrabold tracking-tight">
                ${escHtml(cliente.nombre_comercial)}
              </h1>
              <p class="text-xs text-slate-300 mt-1">
                Bienvenido/a, <strong class="text-white">${escHtml(user?.nombre || 'Titular')}</strong>. Panel de autogestión, cuentas corrientes y documentación.
              </p>
            </div>

            <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-right">
              <span class="text-[11px] text-slate-400 block font-medium">Estado de Cuenta Corriente</span>
              <div class="text-2xl font-bold font-mono mt-0.5 ${saldoPendiente > 0 ? 'text-rose-400' : 'text-emerald-400'}">
                ${saldoPendiente > 0 ? formatMoney(saldoPendiente) : '$ 0 (Al Día)'}
              </div>
              <button id="btn-informar-pago-portal" class="mt-2 w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition">
                + Informar Pago / Transferencia
              </button>
            </div>
          </div>
        </div>

        <!-- Subtabs del Portal -->
        <div class="flex border-b border-slate-200 gap-6 text-xs font-semibold">
          <button class="tab-btn pb-3 border-b-2 ${activeTab === 'ctacte' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}" data-tab="ctacte">
            Mi Cuenta Corriente & Facturas (${facturas.length})
          </button>
          <button class="tab-btn pb-3 border-b-2 ${activeTab === 'servicios' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}" data-tab="servicios">
            Servicios & Tareas Realizadas (${tareas.length})
          </button>
          <button class="tab-btn pb-3 border-b-2 ${activeTab === 'documentos' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}" data-tab="documentos">
            Compartir Documentos (${docs.length})
          </button>
          <button class="tab-btn pb-3 border-b-2 ${activeTab === 'mayorista' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}" data-tab="mayorista">
            Mis Pedidos Mayoristas (${pedidosMayoristas.length})
          </button>
        </div>

        <!-- 1. TAB: CUENTA CORRIENTE -->
        <div id="tab-ctacte-portal" class="${activeTab === 'ctacte' ? '' : 'hidden'} space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Facturas Emitidas -->
            <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Facturas de Servicios</h2>
              <div class="space-y-2.5 max-h-80 overflow-y-auto">
                ${facturas.length === 0 ? `
                  <p class="text-slate-400 text-xs py-6 text-center">No registrás facturas pendientes.</p>
                ` : facturas.map(f => `
                  <div class="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <span class="font-bold text-slate-900 font-mono">${escHtml(f.numero)}</span>
                      <p class="text-[11px] text-slate-500 mt-0.5">${escHtml(f.concepto || 'Abono Mensual')}</p>
                      <span class="text-[10px] text-slate-400 font-mono">Fecha: ${formatDate(f.fecha)}</span>
                    </div>
                    <div class="text-right">
                      <div class="font-mono font-bold text-slate-900">${formatMoney(f.monto)}</div>
                      <div class="mt-1">${renderStatusBadge(f.estado)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Pagos Recibidos e Imputados -->
            <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Historial de Pagos Recibidos</h2>
              <div class="space-y-2.5 max-h-80 overflow-y-auto">
                ${pagos.length === 0 ? `
                  <p class="text-slate-400 text-xs py-6 text-center">No se registran pagos en el período.</p>
                ` : pagos.map(p => `
                  <div class="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <span class="font-bold text-emerald-700 font-mono">+${formatMoney(p.monto)}</span>
                      <p class="text-[11px] text-slate-500 mt-0.5">Destino: ${escHtml(p.cuenta_destino || 'Bancos')}</p>
                      <span class="text-[10px] text-slate-400 font-mono">Ref: ${escHtml(p.comprobante || 'Trf')} &bull; ${formatDate(p.fecha)}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      Imputado (FIFO)
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- 2. TAB: SERVICIOS Y TAREAS REALIZADAS -->
        <div id="tab-servicios-portal" class="${activeTab === 'servicios' ? '' : 'hidden'} space-y-4">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Trabajos Administrativos Realizados por AdminYAAA</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th class="p-3">Fecha</th>
                    <th class="p-3">Servicio / Tarea</th>
                    <th class="p-3">Tipo de Trabajo</th>
                    <th class="p-3 text-center">Estado del Proceso</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${tareas.map(t => `
                    <tr class="hover:bg-slate-50">
                      <td class="p-3 font-mono text-slate-500">${formatDate(t.fecha)}</td>
                      <td class="p-3 font-semibold text-slate-900">${escHtml(t.descripcion)}</td>
                      <td class="p-3">
                        <span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">${escHtml(t.tipo)}</span>
                      </td>
                      <td class="p-3 text-center">${renderStatusBadge(t.estado)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 3. TAB: CENTRO DE CARGA Y COMPARTIR DOCUMENTOS -->
        <div id="tab-documentos-portal" class="${activeTab === 'documentos' ? '' : 'hidden'} space-y-4">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <h2 class="text-sm font-bold text-slate-900">Buzón de Archivos & Comprobantes para AdminYAAA</h2>
                <p class="text-xs text-slate-500 mt-0.5">Subí facturas de tus proveedores, comprobantes bancarios o planillas para que las procesemos.</p>
              </div>
              <button id="btn-subir-archivo-portal" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                Compartir Nuevo Archivo
              </button>
            </div>

            <!-- Listado de documentos subidos -->
            <div class="space-y-3">
              ${docs.length === 0 ? `
                <div class="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                  Aún no compartiste archivos este mes. Usá el botón para enviar documentación al equipo.
                </div>
              ` : docs.map(d => `
                <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <div class="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 text-base flex-shrink-0">
                      📄
                    </div>
                    <div>
                      <h3 class="text-xs font-bold text-slate-900">${escHtml(d.nombre_archivo)}</h3>
                      <p class="text-[11px] text-slate-500 mt-0.5">${escHtml(d.nota || 'Sin observaciones')}</p>
                      <div class="text-[10px] text-slate-400 font-mono mt-1">
                        Subido el ${formatDate(d.fecha)} por ${escHtml(d.subido_por || 'Cliente')} &bull; ${escHtml(d.tamano || 'PDF')}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      d.estado === 'procesado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }">
                      ${d.estado === 'procesado' ? '✓ Procesado por AdminYAAA' : '⏳ En Revisión del Equipo'}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 4. TAB: MIS PEDIDOS MAYORISTAS -->
        <div id="tab-mayorista-portal" class="${activeTab === 'mayorista' ? '' : 'hidden'} space-y-4">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Tus Pedidos a Mayorista a tu Casa</h2>
                <p class="text-[11px] text-slate-400">Insumos y mercadería con precio mayorista especial para clientes</p>
              </div>
              <button id="btn-pedir-mayorista-portal" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition">
                + Nuevo Pedido Mayorista
              </button>
            </div>

            <div class="space-y-3">
              ${pedidosMayoristas.length === 0 ? `
                <p class="text-slate-400 text-xs py-8 text-center">No registrás pedidos mayoristas activos.</p>
              ` : pedidosMayoristas.map(ped => `
                <div class="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div>
                    <span class="font-mono font-bold text-slate-900">${ped.id}</span>
                    <span class="text-slate-400 text-[10px] ml-2 font-mono">${formatDate(ped.created_at)}</span>
                    <div class="text-slate-600 mt-1">${(ped.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-mono font-bold text-slate-900">${formatMoney(ped.total)}</div>
                    <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      ped.status === 'Entregado' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }">
                      ${escHtml(ped.status)}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `

    container.innerHTML = html

    // Bind subtabs
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-tab')
        render()
      })
    })

    // Subir archivo en portal
    container.querySelector('#btn-subir-archivo-portal')?.addEventListener('click', () => {
      _abrirModalSubirArchivo(clienteId, () => render())
    })

    // Informar pago
    container.querySelector('#btn-informar-pago-portal')?.addEventListener('click', () => {
      _abrirModalInformarPago(clienteId, saldoPendiente, () => render())
    })

    // Pedido mayorista
    container.querySelector('#btn-pedir-mayorista-portal')?.addEventListener('click', () => {
      _abrirModalPedidoCliente(clienteId, cliente, () => render())
    })
  }

  render()
}

function _abrirModalSubirArchivo(clienteId, onDone) {
  const modalHtml = `
    <form id="form-subir-archivo-cli" class="space-y-4 text-xs">
      <div>
        <label class="block font-medium text-slate-700 mb-1">Nombre o Título del Archivo *</label>
        <input type="text" id="doc-cli-nombre" required placeholder="Ej: Factura_Proveedor_Carnes_Octubre.pdf" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
      </div>
      <div>
        <label class="block font-medium text-slate-700 mb-1">Tipo de Documento</label>
        <select id="doc-cli-tipo" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium">
          <option value="factura_compra">Factura de Compra / Proveedor (Para IVA/Caja)</option>
          <option value="comprobante_pago">Comprobante de Pago / VEP / Transferencia</option>
          <option value="novedades_personal">Planilla de Novedades del Personal / Faltas</option>
          <option value="ticket_caja">Ticket de Caja Diaria / Cierre Z</option>
          <option value="otro">Otro Documento</option>
        </select>
      </div>
      <div>
        <label class="block font-medium text-slate-700 mb-1">Nota o Aclaración para el Operador</label>
        <textarea id="doc-cli-nota" rows="2" placeholder="Ej: Abonado por Mercado Pago, imputar a la caja del jueves" class="w-full px-3 py-2 border border-slate-300 rounded-lg"></textarea>
      </div>
      <div class="p-3 border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl text-center cursor-pointer">
        <span class="text-xs text-emerald-800 font-semibold block">📎 Adjuntar archivo (Simulado)</span>
        <span class="text-[10px] text-slate-400">PDF, JPG, PNG o Excel hasta 15MB</span>
      </div>
    </form>
  `

  Modal.open({
    title: 'Compartir Documentación con AdminYAAA',
    content: modalHtml,
    size: 'max-w-md',
    confirmText: 'Enviar Archivo',
    onConfirm: () => {
      const nombre = document.getElementById('doc-cli-nombre')?.value?.trim()
      const tipo = document.getElementById('doc-cli-tipo')?.value
      const nota = document.getElementById('doc-cli-nota')?.value?.trim()

      if (!nombre) {
        toast('Por favor especificá un nombre para el archivo.', 'error')
        return false
      }

      PortalClienteAPI.subirDocumento(clienteId, {
        nombre_archivo: nombre,
        tipo,
        nota,
        tamano: '1.4 MB',
        subido_por: Auth.currentUser()?.nombre || 'Cliente'
      })

      toast('Archivo enviado al equipo de AdminYAAA correctamente.', 'success')
      if (onDone) onDone()
      return true
    }
  })
}

function _abrirModalInformarPago(clienteId, saldoPendiente, onDone) {
  const modalHtml = `
    <form id="form-info-pago-cli" class="space-y-4 text-xs">
      <div>
        <label class="block font-medium text-slate-700 mb-1">Monto Transferido ($) *</label>
        <input type="number" min="1" id="pago-cli-monto" value="${saldoPendiente || 85000}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Fecha de la Transferencia</label>
          <input type="date" id="pago-cli-fecha" value="${today()}" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Cuenta de Destino</label>
          <select id="pago-cli-cuenta" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
            <option value="Banco de la Nación Argentina">Banco Nación</option>
            <option value="Banco Galicia">Banco Galicia</option>
            <option value="Mercado Pago">Mercado Pago</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block font-medium text-slate-700 mb-1">N° Comprobante / Referencia Bancaria</label>
        <input type="text" id="pago-cli-ref" placeholder="Ej: Trf 9832014 Galicia" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono">
      </div>
    </form>
  `

  Modal.open({
    title: 'Informar Pago / Transferencia Realizada',
    content: modalHtml,
    size: 'max-w-md',
    confirmText: 'Enviar Aviso de Pago',
    onConfirm: () => {
      const monto = Number(document.getElementById('pago-cli-monto')?.value || 0)
      const ref = document.getElementById('pago-cli-ref')?.value?.trim() || 'Trf informada'

      PortalClienteAPI.subirDocumento(clienteId, {
        nombre_archivo: `Comprobante_Pago_${formatMoney(monto)}.pdf`,
        tipo: 'comprobante_pago',
        nota: `Aviso de pago informado por el cliente por ${formatMoney(monto)}. Ref: ${ref}`,
        tamano: '850 KB',
        subido_por: Auth.currentUser()?.nombre || 'Cliente'
      })

      toast('Aviso de pago recibido. Nuestro equipo lo imputará en tu cuenta corriente.', 'success')
      if (onDone) onDone()
      return true
    }
  })
}

function _abrirModalPedidoCliente(clienteId, cliente, onDone) {
  const modalHtml = `
    <form id="form-pedido-cli" class="space-y-4 text-xs">
      <div>
        <label class="block font-medium text-slate-700 mb-1">Detalle de Insumos / Mercadería Requerida *</label>
        <textarea id="ped-cli-items" rows="3" required placeholder="Ej: 5x Aceite Natura 1500ml, 1x Combo Limpieza Parrilla, 20x Rollos de cocina" class="w-full px-3 py-2 border border-slate-300 rounded-lg"></textarea>
      </div>
      <div>
        <label class="block font-medium text-slate-700 mb-1">Preferencia de Entrega</label>
        <select id="ped-cli-entrega" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
          <option value="domicilio">Envío a Domicilio del Comercio</option>
          <option value="retiro">Retiro por Depósito Ramos Mejía</option>
        </select>
      </div>
      <p class="text-[11px] text-slate-400">
        El pedido se enviará al equipo mayorista de AdminYAAA, quien te confirmará la preparación y remitirá la orden por WhatsApp.
      </p>
    </form>
  `

  Modal.open({
    title: 'Solicitar Mercadería Mayorista',
    content: modalHtml,
    size: 'max-w-md',
    confirmText: 'Enviar Pedido al Depósito',
    onConfirm: () => {
      const items = document.getElementById('ped-cli-items')?.value?.trim()
      const entrega = document.getElementById('ped-cli-entrega')?.value

      if (!items) {
        toast('Por favor completá los artículos que necesitás.', 'error')
        return false
      }

      MayoristaAPI.createOrder({
        customer_name: cliente.nombre_comercial,
        customer_phone: cliente.whatsapp || '11 5566-7788',
        cliente_id: clienteId,
        delivery_type: entrega,
        items: [{ name: items, quantity: 1, subtotal: 35000 }],
        total: 35000,
        status: 'Confirmado'
      })

      toast('Pedido enviado con éxito. Te avisaremos cuando esté listo.', 'success')
      if (onDone) onDone()
      return true
    }
  })
}
