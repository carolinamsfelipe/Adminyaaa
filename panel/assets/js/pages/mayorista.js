/**
 * mayorista.js — Módulo de Gestión Mayorista y Distribución (AdminYAAA)
 *
 * Integra plenamente la operación de "Mayorista a tu Casa":
 *   - Pedidos Mayoristas (e-commerce y ventas directas)
 *   - Catálogo de Productos y Precios con cálculo de Márgenes
 *   - Recepción de Mercadería, Stock y Trazabilidad Inmutable
 *   - Imputación directa a Cuenta Corriente y Facturación de AdminYAAA
 *   - Directorio de Proveedores Mayoristas
 */

import { MayoristaAPI, ClientesAPI, FacturasAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, today, toast, escHtml } from '../core/utils.js'

export function renderMayorista(container, params = {}) {
  const isAdmin = Auth.isAdmin()
  let currentTab = params.tab || 'pedidos'

  function render() {
    const orders = MayoristaAPI.getOrders()
    const products = MayoristaAPI.getProducts()
    const movements = MayoristaAPI.getMovements()
    const suppliers = MayoristaAPI.getSuppliers()
    const combos = MayoristaAPI.getCombos()

    const pendientesCount = orders.filter(o => o.status === 'Confirmado' || o.status === 'En preparación').length
    const totalFacturadoMayorista = orders.reduce((acc, o) => acc + (o.total || 0), 0)

    let html = `
      <div class="space-y-6">
        <!-- Encabezado del Módulo -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              </span>
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Gestión Mayorista & Distribución</h1>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Catálogo, pedidos, stock central y despacho mayorista &bull; <strong class="text-slate-700">Mayorista a tu Casa &times; AdminYAAA</strong>
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-nuevo-pedido-may" class="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Nuevo Pedido Mayorista
            </button>
            <button id="btn-ingreso-stock-may" class="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition">
              <span>📦 Ingreso de Mercadería</span>
            </button>
          </div>
        </div>

        <!-- KPI Cards Rápidos -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-[11px] text-slate-500 block font-medium">Pedidos Activos en Despacho</span>
            <span class="text-2xl font-bold font-mono text-slate-900 mt-1 block">${pendientesCount}</span>
            <div class="text-[10px] text-amber-600 font-medium mt-1">Requieren preparación/entrega</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-[11px] text-slate-500 block font-medium">Ventas Mayoristas Totales</span>
            <span class="text-2xl font-bold font-mono text-emerald-600 mt-1 block">${formatMoney(totalFacturadoMayorista)}</span>
            <div class="text-[10px] text-slate-400 mt-1">${orders.length} pedidos registrados</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-[11px] text-slate-500 block font-medium">Artículos en Catálogo</span>
            <span class="text-2xl font-bold font-mono text-slate-900 mt-1 block">${products.length}</span>
            <div class="text-[10px] text-slate-400 mt-1">${combos.length} combos armados</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-[11px] text-slate-500 block font-medium">Proveedores Directos</span>
            <span class="text-2xl font-bold font-mono text-slate-800 mt-1 block">${suppliers.length}</span>
            <div class="text-[10px] text-emerald-600 font-medium mt-1">Molinos, Arcor, La Serenísima...</div>
          </div>
        </div>

        <!-- Subtabs de Navegación del Módulo -->
        <div class="flex border-b border-slate-200 gap-6 text-xs font-semibold">
          <button class="tab-btn pb-3 border-b-2 ${currentTab === 'pedidos' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}" data-tab="pedidos">
            Pedidos & Despacho (${orders.length})
          </button>
          <button class="tab-btn pb-3 border-b-2 ${currentTab === 'catalogo' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}" data-tab="catalogo">
            Catálogo & Precios (${products.length})
          </button>
          <button class="tab-btn pb-3 border-b-2 ${currentTab === 'stock' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}" data-tab="stock">
            Inventario & Movimientos
          </button>
          <button class="tab-btn pb-3 border-b-2 ${currentTab === 'proveedores' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}" data-tab="proveedores">
            Proveedores Mayoristas (${suppliers.length})
          </button>
        </div>

        <!-- CONTENIDO TAB: PEDIDOS -->
        <div id="tab-pedidos-wrap" class="${currentTab === 'pedidos' ? '' : 'hidden'} space-y-4">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Cola de Pedidos Mayoristas</h2>
              <span class="text-xs text-slate-500">Sincronizado con la tienda online y WhatsApp</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th class="p-3">N° Pedido</th>
                    <th class="p-3">Cliente / Destino</th>
                    <th class="p-3">Entrega</th>
                    <th class="p-3">Detalle Ítems</th>
                    <th class="p-3 text-right">Total</th>
                    <th class="p-3 text-center">Estado</th>
                    <th class="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${orders.length === 0 ? `
                    <tr><td colspan="7" class="p-6 text-center text-slate-400">Sin pedidos registrados aún.</td></tr>
                  ` : orders.map(ord => `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="p-3 font-mono font-bold text-slate-900">${ord.id}</td>
                      <td class="p-3">
                        <div class="font-semibold text-slate-800">${escHtml(ord.customer_name)}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${escHtml(ord.customer_phone || '')}</div>
                      </td>
                      <td class="p-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-medium ${ord.delivery_type === 'domicilio' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'} capitalize">
                          ${escHtml(ord.delivery_type)}
                        </span>
                        <div class="text-[10px] text-slate-500 mt-0.5">${escHtml(ord.delivery_zone || '')}</div>
                      </td>
                      <td class="p-3 max-w-xs truncate text-slate-600">
                        ${ord.items ? ord.items.map(it => `${it.quantity}x ${it.name}`).join(', ') : '—'}
                      </td>
                      <td class="p-3 text-right font-mono font-bold text-slate-900">
                        ${formatMoney(ord.total)}
                      </td>
                      <td class="p-3 text-center">
                        <select data-order-id="${ord.id}" class="select-estado-order text-[11px] font-semibold py-1 px-2 border rounded-lg ${
                          ord.status === 'Entregado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          ord.status === 'En preparación' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          ord.status === 'Confirmado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }">
                          <option value="Pendiente" ${ord.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                          <option value="Confirmado" ${ord.status === 'Confirmado' ? 'selected' : ''}>Confirmado</option>
                          <option value="En preparación" ${ord.status === 'En preparación' ? 'selected' : ''}>En preparación</option>
                          <option value="En camino" ${ord.status === 'En camino' ? 'selected' : ''}>En camino</option>
                          <option value="Entregado" ${ord.status === 'Entregado' ? 'selected' : ''}>Entregado</option>
                        </select>
                      </td>
                      <td class="p-3 text-center">
                        <div class="inline-flex items-center gap-1.5">
                          <button data-print-order="${ord.id}" class="btn-print-order p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Imprimir Pick-List para Depósito">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                          </button>
                          ${isAdmin ? `
                            <button data-invoice-order="${ord.id}" class="btn-invoice-order px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold border border-emerald-200" title="Imputar a Cuenta Corriente del Cliente">
                              Facturar
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- CONTENIDO TAB: CATÁLOGO & PRECIOS -->
        <div id="tab-catalogo-wrap" class="${currentTab === 'catalogo' ? '' : 'hidden'} space-y-4">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div class="relative flex-1 max-w-sm">
                <input type="text" id="search-catalogo-may" placeholder="Buscar por nombre, SKU, marca o categoría..." class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500">
                <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <button id="btn-nuevo-articulo-may" class="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition">
                + Agregar Producto al Catálogo
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th class="p-3">SKU</th>
                    <th class="p-3">Producto / Marca</th>
                    <th class="p-3">Categoría</th>
                    <th class="p-3 text-right">Costo ($)</th>
                    <th class="p-3 text-center">Margen %</th>
                    <th class="p-3 text-right">Precio Mayorista ($)</th>
                    <th class="p-3 text-center">Stock</th>
                    <th class="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100" id="tbody-catalogo-may">
                  ${products.slice(0, 30).map(p => `
                    <tr class="hover:bg-slate-50">
                      <td class="p-3 font-mono text-slate-500">${escHtml(p.sku || p.id)}</td>
                      <td class="p-3">
                        <div class="font-semibold text-slate-900">${escHtml(p.name)}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${escHtml(p.brand || '')} &bull; ${escHtml(p.unit || 'un.')}</div>
                      </td>
                      <td class="p-3">
                        <span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">${escHtml(p.category || 'Almacén')}</span>
                      </td>
                      <td class="p-3 text-right font-mono text-slate-600">${formatMoney(p.cost)}</td>
                      <td class="p-3 text-center font-mono font-bold text-emerald-600">${p.margin || 30}%</td>
                      <td class="p-3 text-right font-mono font-bold text-slate-900">${formatMoney(p.price)}</td>
                      <td class="p-3 text-center font-mono ${p.stock <= (p.min_stock || 5) ? 'text-amber-600 font-bold' : 'text-slate-700'}">
                        ${p.stock ?? 0}
                      </td>
                      <td class="p-3 text-center">
                        <button data-edit-prod="${p.id}" class="btn-edit-prod text-slate-400 hover:text-slate-800 p-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- CONTENIDO TAB: STOCK & MOVIMIENTOS -->
        <div id="tab-stock-wrap" class="${currentTab === 'stock' ? '' : 'hidden'} space-y-4">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Trazabilidad Inmutable de Stock</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th class="p-3">Fecha</th>
                    <th class="p-3">SKU / Artículo</th>
                    <th class="p-3 text-center">Tipo</th>
                    <th class="p-3 text-right">Cantidad</th>
                    <th class="p-3">Motivo / Documento</th>
                    <th class="p-3">Operador</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-mono">
                  ${movements.map(m => `
                    <tr class="hover:bg-slate-50">
                      <td class="p-3 text-slate-500">${formatDate(m.fecha)}</td>
                      <td class="p-3 font-sans font-semibold text-slate-800">${escHtml(m.producto_nombre || m.sku)}</td>
                      <td class="p-3 text-center font-sans">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.tipo === 'INGRESO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                          ${m.tipo}
                        </span>
                      </td>
                      <td class="p-3 text-right font-bold ${m.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-slate-800'}">
                        ${m.tipo === 'INGRESO' ? '+' : '-'}${m.cantidad}
                      </td>
                      <td class="p-3 font-sans text-slate-600">${escHtml(m.motivo || '—')}</td>
                      <td class="p-3 font-sans text-slate-500">${escHtml(m.usuario || 'Equipo')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- CONTENIDO TAB: PROVEEDORES -->
        <div id="tab-proveedores-wrap" class="${currentTab === 'proveedores' ? '' : 'hidden'} space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${suppliers.map(sup => `
              <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between">
                    <h3 class="font-bold text-slate-900 text-sm">${escHtml(sup.name)}</h3>
                    <span class="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">CUIT ${escHtml(sup.cuit)}</span>
                  </div>
                  <div class="mt-3 space-y-1 text-xs text-slate-600">
                    <div><strong>Contacto:</strong> ${escHtml(sup.contacto || 'Comercial')}</div>
                    <div><strong>Teléfono:</strong> <span class="font-mono">${escHtml(sup.telefono || '—')}</span></div>
                    <div><strong>Rubros Principales:</strong> ${(sup.rubros || []).join(', ')}</div>
                  </div>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span class="text-slate-400">Convenio de Descuento PyME</span>
                  <span class="font-semibold text-emerald-600">Cuenta Corriente Habilitada</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `

    container.innerHTML = html

    // Bind subtabs
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.getAttribute('data-tab')
        render()
      })
    })

    // Actualizar estado de pedido
    container.querySelectorAll('.select-estado-order').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const orderId = e.target.getAttribute('data-order-id')
        MayoristaAPI.updateOrderStatus(orderId, e.target.value)
        toast(`Estado de pedido ${orderId} actualizado a "${e.target.value}".`, 'success')
      })
    })

    // Imprimir Pick-List
    container.querySelectorAll('.btn-print-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderId = e.currentTarget.getAttribute('data-print-order')
        const ord = orders.find(o => o.id === orderId)
        if (!ord) return
        _imprimirPickList(ord)
      })
    })

    // Facturar pedido a cuenta corriente de cliente AdminYAAA
    container.querySelectorAll('.btn-invoice-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderId = e.currentTarget.getAttribute('data-invoice-order')
        const ord = orders.find(o => o.id === orderId)
        if (!ord) return
        _abrirModalFacturarPedido(ord, () => render())
      })
    })

    // Botón Ingreso de Mercadería
    container.querySelector('#btn-ingreso-stock-may')?.addEventListener('click', () => {
      _abrirModalIngresoMercaderia(products, () => render())
    })

    // Botón Nuevo Pedido
    container.querySelector('#btn-nuevo-pedido-may')?.addEventListener('click', () => {
      _abrirModalNuevoPedido(products, () => render())
    })
  }

  render()
}

function _imprimirPickList(ord) {
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <title>Orden de Preparación / Pick-List — ${ord.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
        th { background: #f8fafc; font-weight: 600; }
        .total { text-align: right; font-weight: bold; font-size: 16px; margin-top: 20px; }
        .chk { width: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <h1>ADMINYAAA &middot; MAYORISTA A TU CASA</h1>
      <div class="meta">
        <strong>ORDEN DE PREPARACIÓN / REMITO N° ${ord.id}</strong><br>
        Cliente: ${ord.customer_name} &bull; Tel: ${ord.customer_phone || '—'}<br>
        Tipo de Entrega: ${ord.delivery_type.toUpperCase()} &bull; Zona: ${ord.delivery_zone || 'Depósito'}
      </div>
      <table>
        <thead>
          <tr>
            <th class="chk">✓</th>
            <th>Artículo / Descripción</th>
            <th style="text-align:center">Cantidad</th>
            <th style="text-align:right">Precio Unit.</th>
            <th style="text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${(ord.items || []).map(it => `
            <tr>
              <td class="chk">[ ]</td>
              <td><strong>${it.name}</strong></td>
              <td style="text-align:center;font-weight:bold">${it.quantity}</td>
              <td style="text-align:right">$ ${Number(it.unit_price || 0).toLocaleString('es-AR')}</td>
              <td style="text-align:right">$ ${Number(it.subtotal || 0).toLocaleString('es-AR')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="total">
        TOTAL A COBRAR: $ ${Number(ord.total || 0).toLocaleString('es-AR')}
      </div>
      <p style="margin-top:30px;font-size:11px;color:#94a3b8">Preparado por Depósito AdminYAAA &bull; Firma del receptor: _______________________</p>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

function _abrirModalFacturarPedido(order, onDone) {
  const clientes = ClientesAPI.getAll()
  const modalHtml = `
    <div class="space-y-4 text-xs">
      <p class="text-slate-600">
        ¿Deseás imputar este pedido mayorista (<strong>${order.id}</strong> por <strong>${formatMoney(order.total)}</strong>) en la cuenta corriente de un cliente de AdminYAAA?
      </p>
      <div>
        <label class="block font-medium text-slate-700 mb-1">Seleccionar Cliente de AdminYAAA</label>
        <select id="modal-facturar-cliente" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold">
          ${clientes.map(c => `
            <option value="${c.id}" ${c.id === order.cliente_id ? 'selected' : ''}>${escHtml(c.nombre_comercial)}</option>
          `).join('')}
        </select>
      </div>
    </div>
  `

  Modal.open({
    title: 'Imputar Pedido a Cuenta Corriente',
    content: modalHtml,
    size: 'max-w-md',
    confirmText: 'Generar Factura en Cta Cte',
    onConfirm: () => {
      const cliId = document.getElementById('modal-facturar-cliente')?.value
      if (!cliId) return false
      MayoristaAPI.convertOrderToClientInvoice(order.id, cliId)
      toast(`Pedido #${order.id} imputado a la cuenta corriente del cliente.`, 'success')
      if (onDone) onDone()
      return true
    }
  })
}

function _abrirModalIngresoMercaderia(products, onDone) {
  const modalHtml = `
    <form id="form-ingreso-stock" class="space-y-4 text-xs">
      <div>
        <label class="block font-medium text-slate-700 mb-1">Producto a Ingresar *</label>
        <select id="ingreso-prod-select" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold">
          ${products.map(p => `
            <option value="${p.id}">${escHtml(p.name)} (Stock actual: ${p.stock})</option>
          `).join('')}
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Cantidad a Ingresar *</label>
          <input type="number" min="1" id="ingreso-cantidad" required value="24" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">N° Remito / Factura Proveedor</label>
          <input type="text" id="ingreso-remito" placeholder="Ej: REM-004291" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono">
        </div>
      </div>
      <div>
        <label class="block font-medium text-slate-700 mb-1">Motivo / Proveedor</label>
        <input type="text" id="ingreso-motivo" placeholder="Ej: Recepción Molinos Río de la Plata" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
      </div>
    </form>
  `

  Modal.open({
    title: 'Ingreso de Mercadería al Depósito Central',
    content: modalHtml,
    size: 'max-w-md',
    confirmText: 'Registrar Ingreso de Stock',
    onConfirm: () => {
      const prodId = document.getElementById('ingreso-prod-select')?.value
      const cant = Number(document.getElementById('ingreso-cantidad')?.value || 0)
      const motivo = document.getElementById('ingreso-motivo')?.value || 'Recepción mercadería mayorista'

      if (cant <= 0) {
        toast('Ingresá una cantidad válida.', 'error')
        return false
      }

      MayoristaAPI.ajustarStock(prodId, cant, motivo, Auth.currentUser()?.nombre || 'Equipo')
      toast(`Se sumaron ${cant} unidades al inventario mayorista.`, 'success')
      if (onDone) onDone()
      return true
    }
  })
}

function _abrirModalNuevoPedido(products, onDone) {
  const modalHtml = `
    <form id="form-nuevo-pedido-may" class="space-y-4 text-xs">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Nombre del Cliente / Negocio *</label>
          <input type="text" id="ped-cli-nombre" required placeholder="Ej: Rotisería La Nueva" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Teléfono / WhatsApp *</label>
          <input type="text" id="ped-cli-phone" required placeholder="11 4455-6677" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Tipo de Entrega</label>
          <select id="ped-entrega" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium">
            <option value="domicilio">Envío a Domicilio</option>
            <option value="retiro">Retiro en Depósito</option>
          </select>
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Monto Total ($) *</label>
          <input type="number" min="1" id="ped-total" required placeholder="Ej: 45000" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold">
        </div>
      </div>
      <div>
        <label class="block font-medium text-slate-700 mb-1">Detalle de Productos / Bultos</label>
        <textarea id="ped-detalle" rows="2" placeholder="Ej: 10x Aceite Natura, 20x Harina 0000" class="w-full px-3 py-2 border border-slate-300 rounded-lg"></textarea>
      </div>
    </form>
  `

  Modal.open({
    title: 'Cargar Pedido Mayorista Manual',
    content: modalHtml,
    size: 'max-w-md',
    confirmText: 'Registrar Pedido',
    onConfirm: () => {
      const name = document.getElementById('ped-cli-nombre')?.value?.trim()
      const phone = document.getElementById('ped-cli-phone')?.value?.trim()
      const total = Number(document.getElementById('ped-total')?.value || 0)
      const detalle = document.getElementById('ped-detalle')?.value || 'Pedido manual'
      const delivery = document.getElementById('ped-entrega')?.value || 'domicilio'

      if (!name || total <= 0) {
        toast('Completá nombre y monto del pedido.', 'error')
        return false
      }

      MayoristaAPI.createOrder({
        customer_name: name,
        customer_phone: phone,
        delivery_type: delivery,
        total,
        items: [{ name: detalle, quantity: 1, subtotal: total }]
      })

      toast('Pedido mayorista cargado exitosamente.', 'success')
      if (onDone) onDone()
      return true
    }
  })
}
