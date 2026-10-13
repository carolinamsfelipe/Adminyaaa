/**
 * modal.js — Sistema de modales y diálogos reutilizables para AdminYAAA
 */

import { escHtml } from '../core/utils.js'

let _modalContainer = null
let _activeResolve = null

function _getContainer() {
  if (!_modalContainer) {
    _modalContainer = document.getElementById('ay-modal-container')
    if (!_modalContainer) {
      _modalContainer = document.createElement('div')
      _modalContainer.id = 'ay-modal-container'
      document.body.appendChild(_modalContainer)
    }
  }
  return _modalContainer
}

export const Modal = {
  /**
   * Abre un modal personalizado con título, cuerpo HTML y botones.
   * Retorna una Promise que resuelve a true si confirmó o false si canceló/cerró.
   */
  open(config) {
    const {
      title = '',
      content = '',
      confirmText = 'Aceptar',
      cancelText = 'Cancelar',
      isDangerous = false,
      size = 'max-w-lg', // max-w-sm, max-w-lg, max-w-2xl, max-w-4xl
      showFooter = true,
      onConfirm = null,
    } = config

    const container = _getContainer()

    return new Promise((resolve) => {
      _activeResolve = resolve

      container.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="ay-modal-overlay">
          <div class="bg-white rounded-xl shadow-2xl w-full ${size} overflow-hidden transform transition-all border border-slate-200" role="dialog" aria-modal="true" id="ay-modal-box">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 class="text-base font-semibold text-slate-800">${escHtml(title)}</h3>
              <button type="button" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition" id="ay-modal-close-btn" aria-label="Cerrar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-5 max-h-[80vh] overflow-y-auto">
              ${content}
            </div>

            <!-- Footer -->
            ${showFooter ? `
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button type="button" class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition" id="ay-modal-cancel-btn">
                ${escHtml(cancelText)}
              </button>
              <button type="button" class="px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
                isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }" id="ay-modal-confirm-btn">
                ${escHtml(confirmText)}
              </button>
            </div>` : ''}
          </div>
        </div>
      `

      const overlay = document.getElementById('ay-modal-overlay')
      const closeBtn = document.getElementById('ay-modal-close-btn')
      const cancelBtn = document.getElementById('ay-modal-cancel-btn')
      const confirmBtn = document.getElementById('ay-modal-confirm-btn')

      const handleClose = (res) => {
        container.innerHTML = ''
        document.removeEventListener('keydown', handleKey)
        if (_activeResolve) {
          const r = _activeResolve
          _activeResolve = null
          r(res)
        }
      }

      const handleKey = (e) => {
        if (e.key === 'Escape') handleClose(false)
      }
      document.addEventListener('keydown', handleKey)

      overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) handleClose(false)
      })

      closeBtn?.addEventListener('click', () => handleClose(false))
      cancelBtn?.addEventListener('click', () => handleClose(false))

      confirmBtn?.addEventListener('click', async () => {
        if (onConfirm) {
          const ok = await onConfirm()
          if (ok !== false) handleClose(true)
        } else {
          handleClose(true)
        }
      })
    })
  },

  close() {
    const container = _getContainer()
    container.innerHTML = ''
    if (_activeResolve) {
      const r = _activeResolve
      _activeResolve = null
      r(false)
    }
  },

  confirm(message, options = {}) {
    return this.open({
      title: options.title || '¿Estás seguro?',
      content: `<p class="text-sm text-slate-600 leading-relaxed">${escHtml(message)}</p>`,
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
      isDangerous: options.isDangerous ?? false,
      size: 'max-w-md',
    })
  },

  alert(message, title = 'Atención', type = 'info') {
    const iconColors = {
      info: 'text-blue-500 bg-blue-50',
      success: 'text-emerald-500 bg-emerald-50',
      error: 'text-red-500 bg-red-50',
      warning: 'text-amber-500 bg-amber-50',
    }
    const color = iconColors[type] || iconColors.info

    return this.open({
      title,
      content: `
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-full ${color} flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p class="text-sm text-slate-600 leading-relaxed pt-1">${escHtml(message)}</p>
        </div>
      `,
      cancelText: 'Cerrar',
      confirmText: 'Entendido',
      size: 'max-w-md',
    })
  }
}
