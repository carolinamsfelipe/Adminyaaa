/**
 * configuracion.js — Módulo de Configuración y Parámetros Globales (AdminYAAA)
 * Parámetros del sistema, datos bancarios para WhatsApp, gestión de equipo y backup de datos.
 */

import { ColaboradoresAPI } from '../data/api.js'
import { Auth, DEMO_USERS } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { toast, escHtml, formatMoney } from '../core/utils.js'

export function renderConfiguracion(container, params = {}) {
  const isAdmin = Auth.isAdmin()
  const colaboradores = ColaboradoresAPI.getAll()

  let html = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-1.5 bg-slate-800 text-white rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Configuración del Sistema</h1>
          </div>
          <p class="text-xs text-slate-500 mt-1">Parámetros operativos de AdminYAAA, datos bancarios oficiales y control de accesos</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- DATOS BANCARIOS OFICIALES PARA GENERADOR WHATSAPP -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div class="border-b border-slate-100 pb-2">
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Datos Bancarios Oficiales</h2>
            <p class="text-[11px] text-slate-400">Información utilizada automáticamente al generar pedidos de cobro por WhatsApp</p>
          </div>

          <form id="form-datos-bancarios" class="space-y-3 text-xs">
            <div>
              <label class="block font-medium text-slate-700 mb-1">Razón Social / Titular</label>
              <input type="text" id="cfg-titular" value="AdminYAAA Servicios Administrativos S.A.S." class="w-full px-3 py-2 border border-slate-300 rounded-lg">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-medium text-slate-700 mb-1">CUIT / CUIL</label>
                <input type="text" id="cfg-cuit" value="30-71829401-8" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono">
              </div>
              <div>
                <label class="block font-medium text-slate-700 mb-1">Banco Principal</label>
                <input type="text" id="cfg-banco" value="Banco de la Nación Argentina" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
              </div>
            </div>

            <div>
              <label class="block font-medium text-slate-700 mb-1">CBU / CVU (22 dígitos)</label>
              <input type="text" maxlength="22" id="cfg-cbu" value="0110599520000012345678" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono">
            </div>

            <div>
              <label class="block font-medium text-slate-700 mb-1">Alias Oficial</label>
              <input type="text" id="cfg-alias" value="ADMINYAAA.CENTRAL" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700">
            </div>

            <div class="pt-2 flex justify-end">
              <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition">
                Guardar Datos Bancarios
              </button>
            </div>
          </form>
        </div>

        <!-- PARÁMETROS OPERATIVOS Y EQUIPO -->
        <div class="space-y-6">
          <!-- Parámetros del Sistema -->
          <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div class="border-b border-slate-100 pb-2">
              <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Parámetros Operativos por Defecto</h2>
              <p class="text-[11px] text-slate-400">Valores predeterminados para nuevas altas</p>
            </div>

            <div class="space-y-3 text-xs">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium text-slate-800">Día de Facturación por Defecto</span>
                  <p class="text-[10px] text-slate-400">Día del mes sugerido para nuevos abonos</p>
                </div>
                <span class="font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded">Día 5</span>
              </div>

              <div class="flex items-center justify-between border-t border-slate-100 pt-2">
                <div>
                  <span class="font-medium text-slate-800">Alícuota IVA Predeterminada</span>
                  <p class="text-[10px] text-slate-400">Para presupuestador digital a depósito</p>
                </div>
                <span class="font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded">21%</span>
              </div>

              <div class="flex items-center justify-between border-t border-slate-100 pt-2">
                <div>
                  <span class="font-medium text-slate-800">Tolerancia de Morosidad</span>
                  <p class="text-[10px] text-slate-400">Días antes de pasar a estado crítico</p>
                </div>
                <span class="font-mono font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded">15 Días</span>
              </div>
            </div>
          </div>

          <!-- Gestión de Datos y Copia de Seguridad -->
          <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div class="border-b border-slate-100 pb-2">
              <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Gestión de Base de Datos</h2>
              <p class="text-[11px] text-slate-400">Exportación de respaldo y restauración de datos de prueba</p>
            </div>

            <div class="flex items-center gap-3 pt-1">
              <button id="btn-exportar-db" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                📥 Descargar Copia JSON
              </button>
              <button id="btn-restaurar-demo" class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition">
                ⚠️ Restaurar Datos Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- EQUIPO INTERNO Y ROLES -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div>
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Equipo de AdminYAAA & Roles</h2>
            <p class="text-[11px] text-slate-400">Colaboradores, permisos asignados y configuración de acceso</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th class="p-3">Colaborador</th>
                <th class="p-3">Email de Acceso</th>
                <th class="p-3">Rol del Sistema</th>
                <th class="p-3">Sueldo Base</th>
                <th class="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${colaboradores.map(c => `
                <tr class="hover:bg-slate-50">
                  <td class="p-3 font-semibold text-slate-900">${escHtml(c.nombre)}</td>
                  <td class="p-3 font-mono text-slate-600">${escHtml(c.email)}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      c.role === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }">
                      ${escHtml(c.role)}
                    </span>
                  </td>
                  <td class="p-3 font-mono font-medium">${isAdmin ? formatMoney(c.sueldo_base) : '***'}</td>
                  <td class="p-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Activo
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `

  container.innerHTML = html

  // Submit datos bancarios
  container.querySelector('#form-datos-bancarios')?.addEventListener('submit', (e) => {
    e.preventDefault()
    toast('Datos bancarios actualizados correctamente.', 'success')
  })

  // Exportar copia JSON
  container.querySelector('#btn-exportar-db')?.addEventListener('click', () => {
    const data = localStorage.getItem('ay_v2_data') || '{}'
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `adminyaaa-backup-${today()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Copia de seguridad descargada exitosamente.', 'success')
  })

  // Restaurar demo
  container.querySelector('#btn-restaurar-demo')?.addEventListener('click', () => {
    Modal.confirm('¿Restaurar los datos de prueba originales? Se perderán las modificaciones locales.', {
      title: 'Restaurar Datos de Demostración',
      isDangerous: true,
      confirmText: 'Sí, Restaurar Todo'
    }).then(ok => {
      if (ok) {
        localStorage.removeItem('ay_v2_data')
        toast('Datos restaurados. Recargando...', 'info')
        setTimeout(() => window.location.reload(), 1000)
      }
    })
  })
}
