/**
 * MODAL MANAGER — Gestión de diálogos modales accesibles (WCAG 2.1)
 */
let activeModal = null;
let lastFocusedElement = null;

export const Modal = {
  open(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    lastFocusedElement = document.activeElement;
    activeModal = modal;

    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // Focus en primer input o botón de cerrar
    const focusable = modal.querySelector('input:not([type="hidden"]), select, textarea, button:not(.modal-close)');
    if (focusable) focusable.focus();

    if (options.onOpen) options.onOpen(modal);
  },

  close(modalId = null) {
    const modal = modalId ? document.getElementById(modalId) : activeModal;
    if (!modal) return;

    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    activeModal = null;
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  },

  init() {
    // Delegación para cerrar en click fuera o botón con data-close-modal
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-close-modal]') || e.target.closest('[data-close-modal]')) {
        const btn = e.target.matches('[data-close-modal]') ? e.target : e.target.closest('[data-close-modal]');
        const targetId = btn.getAttribute('data-close-modal');
        this.close(targetId || null);
      }
      if (e.target.classList.contains('modal-backdrop')) {
        this.close();
      }
    });

    // Tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeModal) {
        this.close();
      }
    });
  }
};
