/**
 * DRAWER MANAGER — Paneles laterales deslizables (Carrito y Menú Móvil)
 */
export const Drawer = {
  open(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
  },

  close(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;

    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');

    // Si no quedan drawers abiertos, restaurar scroll
    if (!document.querySelector('.drawer.is-open')) {
      document.body.classList.remove('drawer-open');
    }
  },

  toggle(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;
    if (drawer.classList.contains('is-open')) {
      this.close(drawerId);
    } else {
      this.open(drawerId);
    }
  },

  init() {
    document.addEventListener('click', (e) => {
      // Abrir drawer
      const trigger = e.target.closest('[data-open-drawer]');
      if (trigger) {
        e.preventDefault();
        const drawerId = trigger.getAttribute('data-open-drawer');
        this.open(drawerId);
        return;
      }

      // Cerrar drawer
      const closeBtn = e.target.closest('[data-close-drawer]');
      if (closeBtn) {
        e.preventDefault();
        const drawerId = closeBtn.getAttribute('data-close-drawer');
        this.close(drawerId);
        return;
      }

      // Click en overlay de fondo del drawer
      if (e.target.classList.contains('drawer-backdrop')) {
        const openDrawer = document.querySelector('.drawer.is-open');
        if (openDrawer) {
          this.close(openDrawer.id);
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openDrawer = document.querySelector('.drawer.is-open');
        if (openDrawer) {
          this.close(openDrawer.id);
        }
      }
    });
  }
};
