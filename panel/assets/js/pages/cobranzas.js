/**
 * cobranzas.js — Módulo de Cobranzas, Morosidad y WhatsApp Automático
 * Panel de morosidad clasificado por antigüedad (1-15, 16-30, >30 días),
 * generador de pedidos de transferencia con CBU/Alias y registro de cobros con lógica FIFO.
 */

import { CobranzasAPI, ClientesAPI, PagosAPI, FacturasAPI, TesoreriaAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatMoney, formatDate, today, toast, escHtml } from '../core/utils.js'

export function renderCobranzas(container, params = {}) {
  const isAdmin = Auth.isAdmin()
  const morososData = CobranzasAPI.getMorososByAntigüedad() || { d1_15: [], d16_30: [], d30_plus: [] }
  const clientes = ClientesAPI.getAll()

  const tot1_15 = morososData.d1_15.reduce((acc, c) => acc + (c.saldo_deuda || 0), 0)
  const tot16_30 = morososData.d16_30.reduce((acc, c) => acc + (c.saldo_deuda || 0), 0)
  const tot30_plus = morososData.d30_plus.reduce((acc, c) => acc + (c.saldo_deuda || 0), 0)
  const totDeudaGlobal = tot1_15 + tot16_30 + tot30_plus

  let html = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-1.5 bg-rose-500/10 text-rose-600 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </span>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Cobranzas & Morosidad</h1>
          </div>
          <p class="text-xs text-slate-500 mt-1">Gestión de cuentas corrientes vencidas y mensajes automáticos de cobro</p>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-registrar-pago-global" class="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Ingresar Cobro (FIFO)
          </button>
        </div>
      </div>

      <!-- Resumen de Deuda Total -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Monto Total en Calle por Cobrar</span>
          <div class="text-3xl font-extrabold font-mono text-rose-600 mt-1">${formatMoney(totDeudaGlobal)}</div>
        </div>
        <div class="flex items-center gap-4 text-xs">
          <div class="border-l border-slate-200 pl-4">
            <span class="text-slate-400 block">Clientes con deuda</span>
            <span class="font-bold text-slate-800 text-sm font-mono">${morososData.d1_15.length + morososData.d16_30.length + morososData.d30_plus.length}</span>
          </div>
          <div class="border-l border-slate-200 pl-4">
            <span class="text-slate-400 block">Mayor vencimiento</span>
            <span class="font-bold text-rose-600 text-sm font-mono">&gt; 30 días</span>
          </div>
        </div>
      </div>

      <!-- Columnas de Morosidad por Antigüedad -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Columna 1 a 15 días -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div class="p-3 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between">
            <div>
              <h2 class="text-xs font-bold text-amber-900 uppercase tracking-wider">1 a 15 Días</h2>
              <span class="text-[10px] text-amber-700 font-medium">Primer aviso cordial</span>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold font-mono text-amber-900">${formatMoney(tot1_15)}</span>
              <span class="block text-[10px] text-amber-700">${morososData.d1_15.length} clientes</span>
            </div>
          </div>

          <div class="p-3 divide-y divide-slate-100 flex-1 space-y-3 overflow-y-auto max-h-[500px]">
            ${morososData.d1_15.length === 0 ? `
              <p class="text-center text-slate-400 text-xs py-8">Sin clientes en este rango.</p>
            ` : morososData.d1_15.map(c => _cardMoroso(c)).join('')}
          </div>
        </div>

        <!-- Columna 16 a 30 días -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div class="p-3 bg-orange-50/80 border-b border-orange-200 flex items-center justify-between">
            <div>
              <h2 class="text-xs font-bold text-orange-900 uppercase tracking-wider">16 a 30 Días</h2>
              <span class="text-[10px] text-orange-700 font-medium">Reclamo administrativo</span>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold font-mono text-orange-900">${formatMoney(tot16_30)}</span>
              <span class="block text-[10px] text-orange-700">${morososData.d16_30.length} clientes</span>
            </div>
          </div>

          <div class="p-3 divide-y divide-slate-100 flex-1 space-y-3 overflow-y-auto max-h-[500px]">
            ${morososData.d16_30.length === 0 ? `
              <p class="text-center text-slate-400 text-xs py-8">Sin clientes en este rango.</p>
            ` : morososData.d16_30.map(c => _cardMoroso(c)).join('')}
          </div>
        </div>

        <!-- Columna Más de 30 días -->
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div class="p-3 bg-rose-50/80 border-b border-rose-200 flex items-center justify-between">
            <div>
              <h2 class="text-xs font-bold text-rose-900 uppercase tracking-wider">&gt; 30 Días (Crítico)</h2>
              <span class="text-[10px] text-rose-700 font-medium">Suspensión de servicios</span>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold font-mono text-rose-900">${formatMoney(tot30_plus)}</span>
              <span class="block text-[10px] text-rose-700">${morososData.d30_plus.length} clientes</span>
            </div>
          </div>

          <div class="p-3 divide-y divide-slate-100 flex-1 space-y-3 overflow-y-auto max-h-[500px]">
            ${morososData.d30_plus.length === 0 ? `
              <p class="text-center text-slate-400 text-xs py-8">Sin clientes en este rango.</p>
            ` : morososData.d30_plus.map(c => _cardMoroso(c, true)).join('')}
          </div>
        </div>
      </div>
    </div>
  `

  container.innerHTML = html

  // Bind clicks en cards de morosos (generador de WhatsApp)
  container.querySelectorAll('.btn-gestionar-wa').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-cliente-id')
      _abrirModalWhatsAppCobro(id)
    })
  })

  // Bind click botón Registrar Cobro Global
  container.querySelector('#btn-registrar-pago-global')?.addEventListener('click', () => {
    _abrirModalRegistrarCobro(null, () => renderCobranzas(container, params))
  })
}

function _cardMoroso(cliente, isCritico = false) {
  return `
    <div class="pt-3 first:pt-0">
      <div class="flex items-start justify-between gap-2">
        <div>
          <a href="#/clientes?id=${cliente.id}" class="font-semibold text-slate-800 hover:text-emerald-600 text-xs block">
            ${escHtml(cliente.nombre_comercial)}
          </a>
          <span class="text-[10px] text-slate-400 block">${escHtml(cliente.dueno_nombre || 'Sin contacto')}</span>
        </div>
        <div class="text-right">
          <div class="font-mono font-bold text-xs ${isCritico ? 'text-rose-600' : 'text-slate-900'}">
            ${formatMoney(cliente.saldo_deuda)}
          </div>
          <span class="text-[10px] font-mono text-slate-400">Venc: ${formatDate(cliente.fecha_vencimiento_antigua || today())}</span>
        </div>
      </div>

      <div class="mt-2.5 flex items-center justify-between gap-2">
        <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
          ${escHtml(cliente.rubro || 'General')}
        </span>
        <button data-cliente-id="${cliente.id}" class="btn-gestionar-wa px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold flex items-center gap-1 transition">
          <span>📱 Pedir Transferencia</span>
        </button>
      </div>
    </div>
  `
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: GENERADOR DE MENSAJE DE COBRO WHATSAPP
// ─────────────────────────────────────────────────────────────────────────────
function _abrirModalWhatsAppCobro(clienteId) {
  const cliente = ClientesAPI.getById(clienteId)
  if (!cliente) return

  const facturasPendientes = FacturasAPI.getByCliente(clienteId).filter(f => f.estado === 'pendiente' || f.estado === 'vencida')
  const totalAdeudado = facturasPendientes.reduce((acc, f) => acc + (f.monto || 0), 0) || cliente.monto_abono || 0

  // Datos bancarios configurados de AdminYAAA
  const configBanco = {
    titular: 'AdminYAAA Servicios Administrativos S.A.S.',
    cuit: '30-71829401-8',
    cbu: '0110599520000012345678',
    alias: 'ADMINYAAA.CENTRAL',
    banco: 'Banco de la Nación Argentina',
  }

  let detalleFacturas = ''
  if (facturasPendientes.length > 0) {
    detalleFacturas = facturasPendientes.map(f => `  • ${f.concepto || 'Abono Administrativo'}: ${formatMoney(f.monto)}`).join('\n')
  } else {
    detalleFacturas = `  • Abono de Administración Operativa: ${formatMoney(totalAdeudado)}`
  }

  const armarTexto = (alias, cbu, banco, titular, cuit, monto, notasExtra) => `¡Hola ${cliente.dueno_nombre ? cliente.dueno_nombre.split(' ')[0] : 'estimados'}! 👋

Te escribimos desde el equipo de *AdminYAAA* para acercarte el resumen y estado de cuenta al día de la fecha:

💰 *Monto total pendiente:* *${formatMoney(monto)}*
📋 *Detalle de servicios/abonos:*
${detalleFacturas}

🏦 *Datos para transferir:*
• *Titular:* ${titular}
• *CUIT:* ${cuit}
• *CBU:* ${cbu}
• *Alias:* *${alias}*
• *Banco:* ${banco}

${notasExtra ? `${notasExtra}\n\n` : ''}Una vez realizada la transferencia, te pedimos que nos envíes el comprobante por acá para imputarlo en tu cuenta corriente.

¡Muchas gracias! 🙌
*AdminYAAA | Gestión Administrativa para PyMEs*`

  let textoActual = armarTexto(configBanco.alias, configBanco.cbu, configBanco.banco, configBanco.titular, configBanco.cuit, totalAdeudado, '')

  const modalHtml = `
    <div class="space-y-4 text-xs">
      <!-- Datos editables de la transferencia -->
      <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label class="block font-medium text-slate-700 mb-0.5">Titular de Cuenta</label>
          <input type="text" id="wa-titular" value="${escHtml(configBanco.titular)}" class="w-full px-2.5 py-1.5 border border-slate-300 rounded font-sans text-xs">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-0.5">CUIT / CUIL</label>
          <input type="text" id="wa-cuit" value="${escHtml(configBanco.cuit)}" class="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-0.5">CBU / CVU (22 dígitos)</label>
          <input type="text" maxlength="22" id="wa-cbu" value="${escHtml(configBanco.cbu)}" class="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-0.5">Alias Bancario</label>
          <input type="text" id="wa-alias" value="${escHtml(configBanco.alias)}" class="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs font-bold text-emerald-700">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-0.5">Banco / Billetera</label>
          <input type="text" id="wa-banco" value="${escHtml(configBanco.banco)}" class="w-full px-2.5 py-1.5 border border-slate-300 rounded font-sans text-xs">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-0.5">Monto Total a Reclamar ($)</label>
          <input type="number" id="wa-monto" value="${totalAdeudado}" class="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs font-bold">
        </div>
      </div>

      <!-- Preview del Mensaje -->
      <div>
        <label class="block font-medium text-slate-700 mb-1">Vista Previa del Mensaje para WhatsApp</label>
        <textarea id="wa-mensaje-preview" rows="10" class="w-full font-mono text-xs p-3 bg-slate-900 text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">${escHtml(textoActual)}</textarea>
      </div>

      <div class="flex items-center justify-between pt-2">
        <button id="btn-copiar-wa-msg" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
          📋 Copiar Mensaje
        </button>

        ${cliente.whatsapp ? `
          <a id="btn-abrir-chat-wa" href="https://wa.me/${cliente.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(textoActual)}" target="_blank" rel="noopener" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
            Abrir Chat en WhatsApp &rarr;
          </a>
        ` : `
          <span class="text-slate-400 text-[11px]">Cliente sin número de WhatsApp registrado</span>
        `}
      </div>
    </div>
  `

  Modal.open({
    title: `Reclamar Pago: ${cliente.nombre_comercial}`,
    content: modalHtml,
    size: 'max-w-2xl',
    showFooter: false,
  })

  // Listener para actualizar el mensaje si cambian los inputs
  const titularIn = document.getElementById('wa-titular')
  const cuitIn = document.getElementById('wa-cuit')
  const cbuIn = document.getElementById('wa-cbu')
  const aliasIn = document.getElementById('wa-alias')
  const bancoIn = document.getElementById('wa-banco')
  const montoIn = document.getElementById('wa-monto')
  const preview = document.getElementById('wa-mensaje-preview')
  const linkWa = document.getElementById('btn-abrir-chat-wa')

  function refreshMessage() {
    const txt = armarTexto(
      aliasIn.value,
      cbuIn.value,
      bancoIn.value,
      titularIn.value,
      cuitIn.value,
      Number(montoIn.value || 0),
      ''
    )
    if (preview) preview.value = txt
    if (linkWa && cliente.whatsapp) {
      linkWa.href = `https://wa.me/${cliente.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(txt)}`
    }
  }

  [titularIn, cuitIn, cbuIn, aliasIn, bancoIn, montoIn].forEach(input => {
    input?.addEventListener('input', refreshMessage)
  })

  document.getElementById('btn-copiar-wa-msg')?.addEventListener('click', () => {
    const textToCopy = preview?.value || ''
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast('Mensaje copiado al portapapeles. ¡Pegalo en WhatsApp!', 'success')
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: REGISTRAR INGRESO DE PAGO (FIFO)
// ─────────────────────────────────────────────────────────────────────────────
function _abrirModalRegistrarCobro(preselectedClienteId = null, onSaved) {
  const clientes = ClientesAPI.getAll()
  const cuentas = TesoreriaAPI.getCuentas()

  const modalHtml = `
    <form id="form-pago-fifo" class="space-y-4 text-xs">
      <div>
        <label class="block font-medium text-slate-700 mb-1">Cliente *</label>
        <select id="pago-cliente-select" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500">
          <option value="">Seleccionar cliente...</option>
          ${clientes.map(c => `
            <option value="${c.id}" ${c.id === preselectedClienteId ? 'selected' : ''}>${escHtml(c.nombre_comercial)}</option>
          `).join('')}
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Fecha del Cobro *</label>
          <input type="date" id="pago-fecha" value="${today()}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Monto Cobrado ($) *</label>
          <input type="number" min="1" step="100" id="pago-monto" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900">
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Cuenta de Destino *</label>
          <select id="pago-cuenta" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium">
            ${cuentas.map(ct => `
              <option value="${ct.nombre}">${escHtml(ct.nombre)}</option>
            `).join('')}
          </select>
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">N° Comprobante / Referencia</label>
          <input type="text" id="pago-comprobante" placeholder="Ej: OP-984321 / Trf" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono">
        </div>
      </div>

      <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
        <span class="font-bold text-slate-800">Lógica FIFO Automática:</span> Al ingresar el pago, el sistema cancelará en primer lugar las facturas más antiguas que este cliente tenga adeudadas.
      </div>
    </form>
  `

  Modal.open({
    title: 'Registrar Cobro de Cliente (Imputación FIFO)',
    content: modalHtml,
    size: 'max-w-md',
    confirmText: 'Registrar y Cancelar Deudas',
    onConfirm: () => {
      const cliId = document.getElementById('pago-cliente-select')?.value
      const fecha = document.getElementById('pago-fecha')?.value
      const monto = Number(document.getElementById('pago-monto')?.value || 0)
      const cuenta = document.getElementById('pago-cuenta')?.value
      const comprobante = document.getElementById('pago-comprobante')?.value?.trim()

      if (!cliId || monto <= 0) {
        toast('Completá el cliente y un monto válido.', 'error')
        return false
      }

      // Llamar al registro con FIFO
      const resultado = PagosAPI.registrarPago(cliId, monto, cuenta, comprobante, fecha)

      // Registrar también ingreso en tesorería
      const cuentaObj = cuentas.find(c => c.nombre === cuenta) || cuentas[0]
      if (cuentaObj) {
        TesoreriaAPI.registrarMovimiento(cuentaObj.id, monto, 'ingreso', `Cobro Cliente: ${ClientesAPI.getById(cliId)?.nombre_comercial}`, comprobante)
      }

      toast(`Cobro de ${formatMoney(monto)} registrado con éxito.`, 'success')
      if (onSaved) onSaved()
      return true
    }
  })
}
