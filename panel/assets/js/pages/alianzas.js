/**
 * alianzas.js — Módulo de Red de Alianzas y Derivaciones con Estudios Contables
 * Registro de estudios contables estratégicos (Zona Norte, Zona Sur, CABA),
 * seguimiento de clientes derivados mutuamente (AdminYAAA <-> Estudio Contable).
 */

import { EstudiosAPI, ClientesAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatDate, today, toast, escHtml } from '../core/utils.js'

export function renderAlianzas(container, params = {}) {
  const isAdmin = Auth.isAdmin()
  if (!isAdmin) {
    container.innerHTML = `<div class="p-8 text-center text-slate-500">Acceso restringido a administradores.</div>`
    return
  }

  const estudios = EstudiosAPI.getAll()
  const clientes = ClientesAPI.getAll()

  let html = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
            </span>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Alianzas con Estudios Contables</h1>
          </div>
          <p class="text-xs text-slate-500 mt-1">Sinergia comercial: derivación de clientes operativos a AdminYAAA y cierres impositivos/ARCA a los estudios</p>
        </div>

        <button id="btn-nuevo-estudio" class="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Registrar Estudio Aliado
        </button>
      </div>

      <!-- Tarjetas de Estudios Aliados -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${estudios.map(est => {
          const derivadosPorEstudio = clientes.filter(c => c.estudio_aliado_id === est.id)
          const zonaColors = {
            zona_norte: 'bg-blue-100 text-blue-800',
            zona_sur: 'bg-emerald-100 text-emerald-800',
            caba: 'bg-purple-100 text-purple-800',
          }
          return `
            <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <h3 class="font-bold text-slate-900 text-sm">${escHtml(est.nombre)}</h3>
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${zonaColors[est.zona] || 'bg-slate-100 text-slate-700'}">
                    ${escHtml(est.zona.replace('_', ' '))}
                  </span>
                </div>
                <div class="mt-3 space-y-1 text-xs text-slate-600">
                  <div><strong>Contador Referente:</strong> ${escHtml(est.contador_nombre || '—')}</div>
                  <div><strong>Teléfono:</strong> <span class="font-mono">${escHtml(est.telefono || '—')}</span></div>
                  <div><strong>Email:</strong> ${escHtml(est.email || '—')}</div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span class="text-slate-500">Clientes derivados a nosotros:</span>
                <span class="font-bold font-mono text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded">${derivadosPorEstudio.length}</span>
              </div>
            </div>
          `
        }).join('')}
      </div>

      <!-- Panel de Derivaciones Cruzadas -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Izquierda: Clientes que nos derivaron los estudios -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div class="border-b border-slate-100 pb-2">
            <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>📥 Derivados hacia AdminYAAA</span>
            </h2>
            <p class="text-[11px] text-slate-400">Clientes derivados para gestión operativa de stock, cajas, sueldos o cobranzas</p>
          </div>

          <div class="space-y-2 max-h-96 overflow-y-auto">
            ${clientes.filter(c => c.estudio_aliado_id).map(c => {
              const est = estudios.find(e => e.id === c.estudio_aliado_id)
              return `
                <div class="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <a href="#/clientes?id=${c.id}" class="font-semibold text-slate-900 hover:text-emerald-600">${escHtml(c.nombre_comercial)}</a>
                    <div class="text-[10px] text-slate-400 mt-0.5">Estudio: <strong>${escHtml(est?.nombre || 'Aliado')}</strong> (${escHtml(c.rubro)})</div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">Activo</span>
                </div>
              `
            }).join('')}
          </div>
        </div>

        <!-- Derecha: Clientes derivados a estudios para balance/ARCA -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div class="border-b border-slate-100 pb-2">
            <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>📤 Derivados al Estudio (Cierres Impositivos / ARCA)</span>
            </h2>
            <p class="text-[11px] text-slate-400">Clientes a los que AdminYAAA les recomendó el estudio para DDJJ y balances</p>
          </div>

          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div class="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <div>
                <span class="font-semibold text-slate-900">Parrilla Los Robles</span>
                <div class="text-[10px] text-slate-400 mt-0.5">Derivado a: <strong>Estudio Contable Zona Oeste</strong> &bull; Balance Anual</div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">En Proceso</span>
            </div>
            <div class="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <div>
                <span class="font-semibold text-slate-900">Maderera Ramos Mejía</span>
                <div class="text-[10px] text-slate-400 mt-0.5">Derivado a: <strong>Estudio Bertolini & Asoc.</strong> &bull; DDJJ Ganancias</div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">Finalizado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  container.innerHTML = html

  container.querySelector('#btn-nuevo-estudio')?.addEventListener('click', () => {
    _abrirModalEstudio(() => renderAlianzas(container, params))
  })
}

function _abrirModalEstudio(onSaved) {
  const modalHtml = `
    <form id="form-nuevo-estudio" class="space-y-4 text-xs">
      <div>
        <label class="block font-medium text-slate-700 mb-1">Nombre del Estudio *</label>
        <input type="text" id="estudio-nombre" required placeholder="Ej: Estudio Contable San Justo" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold">
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Zona de Cobertura *</label>
          <select id="estudio-zona" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
            <option value="zona_norte">Zona Norte</option>
            <option value="zona_sur">Zona Sur</option>
            <option value="caba">CABA</option>
            <option value="zona_oeste">Zona Oeste</option>
          </select>
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Contador Referente</label>
          <input type="text" id="estudio-contador" placeholder="Ej: Dr. Martín Gómez" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Teléfono / WhatsApp</label>
          <input type="text" id="estudio-telefono" placeholder="11 5566-7788" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono">
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Correo Electrónico</label>
          <input type="email" id="estudio-email" placeholder="contacto@estudiogomez.com" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs">
        </div>
      </div>
    </form>
  `

  Modal.open({
    title: 'Registrar Estudio Contable Aliado',
    content: modalHtml,
    size: 'max-w-md',
    confirmText: 'Guardar Alianza',
    onConfirm: () => {
      const nombre = document.getElementById('estudio-nombre')?.value?.trim()
      if (!nombre) {
        toast('El nombre del estudio es requerido.', 'error')
        return false
      }

      EstudiosAPI.create({
        nombre,
        zona: document.getElementById('estudio-zona')?.value || 'caba',
        contador_nombre: document.getElementById('estudio-contador')?.value?.trim() || '',
        telefono: document.getElementById('estudio-telefono')?.value?.trim() || '',
        email: document.getElementById('estudio-email')?.value?.trim() || '',
      })

      toast('Estudio aliado registrado con éxito.', 'success')
      if (onSaved) onSaved()
      return true
    }
  })
}
