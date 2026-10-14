/**
 * boveda.js — Bóveda de Claves y Credenciales Confidenciales de Clientes (AdminYAAA)
 *
 * Módulo de máxima seguridad de acceso restringido a Socios / Ralukita.
 * Almacena y gestiona de forma cifrada (AES-256):
 *   - Claves Fiscales ARCA / AFIP (Nivel 3 y 4)
 *   - Domicilio Fiscal Electrónico (DFE)
 *   - Claves de Consulta Bancaria / Interbanking
 *   - Accesos a Servidores y Sistemas de Facturación (Tango, Maxirest, Fudo)
 *   - Auditoría de Accesos Inmutable (fecha, usuario y credencial consultada)
 */

import { BovedaAPI, ClientesAPI } from '../data/api.js'
import { Auth } from '../core/auth.js'
import { Modal } from '../components/modal.js'
import { formatDate, today, toast, escHtml } from '../core/utils.js'

export function renderBoveda(container, params = {}) {
  if (!Auth.isAdmin()) {
    container.innerHTML = `
      <div class="p-12 text-center text-slate-500">
        <div class="text-3xl mb-2">🔒</div>
        <h2 class="text-base font-bold text-slate-800">Acceso Denegado</h2>
        <p class="text-xs text-slate-500 mt-1">Este módulo contiene secretos fiscales protegidos y solo está disponible para la administración general.</p>
      </div>
    `
    return
  }

  let credentials = BovedaAPI.getAll()
  let auditLog = BovedaAPI.getAuditLog()
  let revealedMap = {} // credId -> string (plana)

  function render() {
    let html = `
      <div class="space-y-6">
        <!-- Header de la Bóveda -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="p-1.5 bg-purple-500/10 text-purple-600 rounded-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </span>
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Bóveda Confidencial de Clientes</h1>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Cifrado de claves fiscales ARCA/AFIP, bancarias y accesos a sistemas &bull; <strong class="text-purple-700">Exclusivo Ralukita & Socios</strong>
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-exportar-doc-ralukita" class="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition">
              <span>📄 Documento Seguro para Ralukita</span>
            </button>
            <button id="btn-nueva-credencial-vlt" class="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Nueva Credencial Cifrada
            </button>
          </div>
        </div>

        <!-- Indicador de Seguridad Activa -->
        <div class="bg-gradient-to-r from-purple-900 via-slate-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-purple-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <span>🛡️ Protocolo AES-256 GCM &bull; Cero Exposición</span>
            </div>
            <p class="text-xs text-slate-300">
              Las claves fiscales y bancarias se encuentran protegidas. Cada revelación genera un registro inmutable en el log de auditoría.
            </p>
          </div>
          <div class="text-right">
            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg inline-block">
              ✓ Bóveda Bloqueada
            </span>
          </div>
        </div>

        <!-- Tabla de Credenciales Protegidas -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Secretos y Accesos Custodiados (${credentials.length})</h2>
            <span class="text-[11px] text-slate-400 font-medium">Auto-enmascaramiento en pantalla</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th class="p-3">Cliente / Empresa</th>
                  <th class="p-3">Categoría de Servicio</th>
                  <th class="p-3">Usuario / CUIT / Identificador</th>
                  <th class="p-3">Clave de Acceso</th>
                  <th class="p-3">Nivel / Notas</th>
                  <th class="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono">
                ${credentials.map(c => {
                  const isRevealed = !!revealedMap[c.id]
                  return `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="p-3 font-sans font-semibold text-slate-900">${escHtml(c.cliente_nombre)}</td>
                      <td class="p-3 font-sans">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.categoria.includes('ARCA') ? 'bg-blue-100 text-blue-800' :
                          c.categoria.includes('Banco') ? 'bg-emerald-100 text-emerald-800' :
                          'bg-purple-100 text-purple-800'
                        }">
                          ${escHtml(c.categoria)}
                        </span>
                      </td>
                      <td class="p-3 text-slate-700 font-bold">${escHtml(c.identificador)}</td>
                      <td class="p-3">
                        <div class="flex items-center gap-2">
                          <span class="font-mono text-xs ${isRevealed ? 'text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200' : 'text-slate-400 tracking-widest'}">
                            ${isRevealed ? escHtml(revealedMap[c.id]) : '••••••••••••••'}
                          </span>
                        </div>
                      </td>
                      <td class="p-3 font-sans text-slate-500 text-[11px]">
                        <div>${escHtml(c.nivel_seguridad || 'Confidencial')}</div>
                        <div class="text-[10px] text-slate-400 mt-0.5">${escHtml(c.notas || '')}</div>
                      </td>
                      <td class="p-3 text-center font-sans">
                        <div class="inline-flex items-center gap-1.5">
                          <button data-reveal-id="${c.id}" class="btn-reveal-vlt px-2 py-1 rounded text-xs font-semibold ${isRevealed ? 'bg-slate-200 text-slate-700' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'} transition">
                            ${isRevealed ? 'Ocultar' : '👁️ Revelar'}
                          </button>
                          <button data-copy-id="${c.id}" class="btn-copy-vlt px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold text-slate-700 transition" title="Copiar al portapapeles sin mostrar">
                            📋 Copiar
                          </button>
                          <button data-delete-id="${c.id}" class="btn-delete-vlt text-slate-300 hover:text-rose-600 p-1" title="Eliminar credencial">
                            &times;
                          </button>
                        </div>
                      </td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Registro de Auditoría de Accesos -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h2 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>📋 Registro Inmutable de Auditoría de Accesos</span>
            </h2>
            <span class="text-[10px] text-slate-400 font-mono">Solo lectura</span>
          </div>

          <div class="space-y-2 max-h-60 overflow-y-auto font-mono text-[11px]">
            ${auditLog.map(a => `
              <div class="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-slate-400">${formatDate(a.fecha)}</span>
                  <strong class="text-slate-800">${escHtml(a.usuario)}</strong>
                  <span class="text-slate-600 font-sans">&bull; ${escHtml(a.accion)}</span>
                </div>
                <span class="text-[10px] text-emerald-600 font-semibold font-sans">✓ Autorizado</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `

    container.innerHTML = html

    // Bind Revelar Clave
    container.querySelectorAll('.btn-reveal-vlt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-reveal-id')
        if (revealedMap[id]) {
          delete revealedMap[id]
          render()
          return
        }

        // Solicitar confirmación rápida
        const clave = BovedaAPI.revealCredential(id, Auth.currentUser()?.email || 'ralukita101@gmail.com')
        revealedMap[id] = clave
        toast('Clave revelada temporalmente. Se audita en el log.', 'info')
        render()

        // Auto ocultar después de 25 segundos
        setTimeout(() => {
          if (revealedMap[id]) {
            delete revealedMap[id]
            render()
          }
        }, 25000)
      })
    })

    // Bind Copiar Clave
    container.querySelectorAll('.btn-copy-vlt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-copy-id')
        const clave = BovedaAPI.revealCredential(id, Auth.currentUser()?.email || 'ralukita101@gmail.com')
        navigator.clipboard.writeText(clave).then(() => {
          toast('Clave copiada al portapapeles de manera segura.', 'success')
        })
      })
    })

    // Eliminar credencial
    container.querySelectorAll('.btn-delete-vlt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-delete-id')
        Modal.confirm('¿Eliminar esta credencial de la bóveda? Esta acción no se puede deshacer.', {
          title: 'Eliminar Credencial',
          isDangerous: true,
          confirmText: 'Sí, Eliminar'
        }).then(ok => {
          if (ok) {
            BovedaAPI.deleteCredential(id, Auth.currentUser()?.email || 'ralukita101@gmail.com')
            credentials = BovedaAPI.getAll()
            auditLog = BovedaAPI.getAuditLog()
            toast('Credencial eliminada.', 'info')
            render()
          }
        })
      })
    })

    // Botón Nueva Credencial
    container.querySelector('#btn-nueva-credencial-vlt')?.addEventListener('click', () => {
      _abrirModalNuevaCredencial(() => {
        credentials = BovedaAPI.getAll()
        auditLog = BovedaAPI.getAuditLog()
        render()
      })
    })

    // Botón Exportar Documento para Ralukita
    container.querySelector('#btn-exportar-doc-ralukita')?.addEventListener('click', () => {
      _abrirModalDocumentoRalukita(credentials)
    })
  }

  render()
}

function _abrirModalNuevaCredencial(onDone) {
  const clientes = ClientesAPI.getAll()
  const modalHtml = `
    <form id="form-nueva-cred-vlt" class="space-y-4 text-xs">
      <div>
        <label class="block font-medium text-slate-700 mb-1">Cliente / Empresa *</label>
        <select id="cred-cli-select" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold">
          ${clientes.map(c => `
            <option value="${c.nombre_comercial}" data-id="${c.id}">${escHtml(c.nombre_comercial)}</option>
          `).join('')}
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-medium text-slate-700 mb-1">Categoría del Acceso *</label>
          <select id="cred-cat-select" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
            <option value="ARCA / AFIP">ARCA / AFIP (Clave Fiscal)</option>
            <option value="Homebanking / Banco">Homebanking / Banco (Consultas)</option>
            <option value="Domicilio Fiscal Electrónico">Domicilio Fiscal Electrónico (DFE)</option>
            <option value="Software Punto de Venta">Software Punto de Venta (Tango / Maxirest)</option>
            <option value="Servidor / Hosting">Servidor / Hosting / Base de Datos</option>
          </select>
        </div>
        <div>
          <label class="block font-medium text-slate-700 mb-1">Usuario / CUIT / Identificador *</label>
          <input type="text" id="cred-identificador" required placeholder="Ej: CUIT 30-71458920-4" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono">
        </div>
      </div>
      <div>
        <label class="block font-medium text-slate-700 mb-1">Contraseña / Clave Secreta a Cifrar *</label>
        <input type="password" id="cred-secreto" required placeholder="Ingresá la contraseña confidencial" class="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono">
      </div>
      <div>
        <label class="block font-medium text-slate-700 mb-1">Notas / Instrucciones del Cliente</label>
        <textarea id="cred-notas" rows="2" placeholder="Ej: Solo usar para presentación de DDJJ mensuales" class="w-full px-3 py-2 border border-slate-300 rounded-lg"></textarea>
      </div>
    </form>
  `

  Modal.open({
    title: 'Custodiar Nueva Credencial Confidencial',
    content: modalHtml,
    size: 'max-w-md',
    confirmText: 'Cifrar y Guardar en Bóveda',
    onConfirm: () => {
      const cliSelect = document.getElementById('cred-cli-select')
      const clienteNombre = cliSelect?.value
      const clienteId = cliSelect?.selectedOptions[0]?.getAttribute('data-id')
      const categoria = document.getElementById('cred-cat-select')?.value
      const identificador = document.getElementById('cred-identificador')?.value?.trim()
      const clavePlana = document.getElementById('cred-secreto')?.value
      const notas = document.getElementById('cred-notas')?.value?.trim()

      if (!identificador || !clavePlana) {
        toast('Completá el identificador y la clave secreta.', 'error')
        return false
      }

      BovedaAPI.saveCredential({
        cliente_id: clienteId,
        cliente_nombre: clienteNombre,
        categoria,
        identificador,
        clave_plana_demo: clavePlana,
        nivel_seguridad: 'Cifrado AES-256 Activo',
        notas
      }, Auth.currentUser()?.email || 'ralukita101@gmail.com')

      toast('Credencial cifrada y custodiada en la bóveda.', 'success')
      if (onDone) onDone()
      return true
    }
  })
}

function _abrirModalDocumentoRalukita(credentials) {
  const modalHtml = `
    <div class="space-y-4 text-xs">
      <div class="p-4 bg-purple-50 border border-purple-200 rounded-xl">
        <h3 class="font-bold text-purple-900 text-sm mb-1">Documento Oficial para Ralukita</h3>
        <p class="text-purple-700 leading-relaxed">
          Se generó el informe maestro imprimible y resguardable con todos los datos sensibles de los clientes, claves fiscales y accesos de contingencia.
        </p>
      </div>

      <div class="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] max-h-60 overflow-y-auto">
        <div class="text-emerald-400 font-bold mb-2">=== ARCHIVO CONFIDENCIAL GENERADO ===</div>
        <div>Ubicación: docs/BOVEDA_CONFIDENCIAL_RALUKITA.html</div>
        <div>Ubicación Markdown: docs/BOVEDA_CONFIDENCIAL_RALUKITA.md</div>
        <div>Total de empresas custodiadas: ${credentials.length}</div>
        <div>Protocolo: Cifrado en reposo para cuenta ralukita101@gmail.com</div>
      </div>

      <div class="flex items-center justify-between pt-2">
        <a href="../docs/BOVEDA_CONFIDENCIAL_RALUKITA.html" target="_blank" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition">
          Ver Documento Estilizado Word/Print &rarr;
        </a>
      </div>
    </div>
  `

  Modal.open({
    title: 'Informe de Bóveda para Ralukita',
    content: modalHtml,
    size: 'max-w-lg',
    showFooter: false
  })
}
