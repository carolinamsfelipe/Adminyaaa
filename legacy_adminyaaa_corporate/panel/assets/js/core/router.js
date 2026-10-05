/**
 * router.js — Router hash-based SPA para AdminYAAA.
 *
 * Formato de hash:
 *   #/dashboard
 *   #/clientes
 *   #/clientes/nuevo
 *   #/clientes/edit/x7k2m9p
 *   #/pagos/detalle/x7k2m9p
 *
 * Uso:
 *   import { Router } from './router.js';
 *
 *   Router.register({
 *     'dashboard':       () => renderDashboard(),
 *     'clientes':        () => renderClientes(),
 *     'clientes/nuevo':  () => renderClienteNuevo(),
 *     'clientes/edit':   (params) => renderClienteEdit(params.id),
 *   });
 *
 *   Router.init();
 *   Router.navigate('clientes/edit', { id: 'x7k2m9p' });
 */

// ─────────────────────────────────────────────────────────────────────────────
// TÍTULOS DE RUTAS EN ESPAÑOL
// ─────────────────────────────────────────────────────────────────────────────

/** Mapa de nombres de ruta a títulos en español para document.title. */
const ROUTE_TITLES = {
  'dashboard':           'Panel Principal',
  'clientes':            'Clientes',
  'clientes/nuevo':      'Nuevo Cliente',
  'clientes/edit':       'Editar Cliente',
  'clientes/detalle':    'Detalle de Cliente',
  'pagos':               'Pagos',
  'pagos/nuevo':         'Registrar Pago',
  'pagos/detalle':       'Detalle de Pago',
  'deudas':              'Deudas',
  'deudas/nuevo':        'Nueva Deuda',
  'deudas/edit':         'Editar Deuda',
  'deudas/detalle':      'Detalle de Deuda',
  'servicios':           'Servicios',
  'servicios/nuevo':     'Nuevo Servicio',
  'servicios/edit':      'Editar Servicio',
  'contratos':           'Contratos',
  'contratos/nuevo':     'Nuevo Contrato',
  'contratos/edit':      'Editar Contrato',
  'contratos/detalle':   'Detalle de Contrato',
  'reportes':            'Reportes',
  'configuracion':       'Configuración',
  'usuarios':            'Usuarios',
  'perfil':              'Mi Perfil',
};

/** Título base de la aplicación. */
const APP_TITLE = 'AdminYAAA';

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export const Router = {
  /** @type {Object.<string, Function>} Mapa de ruta → handler */
  routes: {},

  /** @type {string|null} Nombre de la ruta actual */
  current: null,

  /** @type {Object} Parámetros de la URL actual */
  params: {},

  /** @type {string[]} Historial interno de rutas */
  _history: [],

  /** @type {string} Ruta por defecto si no hay match */
  _defaultRoute: 'dashboard',

  /** @type {boolean} Evitar re-entradas durante navegación */
  _navigating: false,

  // ───────────────────────────────────────────────────────────────────────────
  // REGISTRO DE RUTAS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Registra múltiples rutas de una vez.
   * Puede llamarse varias veces; las rutas se acumulan.
   * @param {Object.<string, Function>} routeMap
   */
  register(routeMap) {
    if (!routeMap || typeof routeMap !== 'object') return;
    for (const [route, handler] of Object.entries(routeMap)) {
      if (typeof handler !== 'function') {
        console.warn(`[Router] El handler para '${route}' no es una función.`);
        continue;
      }
      this.routes[route] = handler;
    }
  },

  /**
   * Establece la ruta por defecto cuando no hay match.
   * @param {string} route
   */
  setDefault(route) {
    this._defaultRoute = route;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // NAVEGACIÓN
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Navega a una ruta actualizando el hash.
   * Los parámetros se codifican en el hash como path segments o query string.
   *
   * @param {string} route  e.g. 'clientes/edit'
   * @param {Object} [params]  e.g. { id: 'x7k2m9p' }
   */
  navigate(route, params = {}) {
    if (!route) return;

    // Construir el hash
    let hash = '#/' + route;

    // Si hay un parámetro 'id', agregarlo como path segment
    if (params && params.id) {
      hash += '/' + encodeURIComponent(params.id);
    }

    // Parámetros adicionales como query string
    const extra = { ...params };
    delete extra.id;
    if (Object.keys(extra).length > 0) {
      const qs = Object.entries(extra)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      hash += '?' + qs;
    }

    // Actualizar el hash (dispara hashchange)
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      // Si el hash no cambió, renderizar igualmente
      this._handleHashChange();
    }
  },

  /**
   * Retrocede en el historial interno del router.
   * Usa window.history.back() si el historial interno está vacío.
   */
  back() {
    if (this._history.length > 1) {
      // Remover la ruta actual
      this._history.pop();
      const prev = this._history[this._history.length - 1];
      if (prev) {
        // Navegar sin agregar al historial
        window.location.hash = prev;
      }
    } else {
      window.history.back();
    }
  },

  /**
   * Retorna el estado actual del router.
   * @returns {{ name: string|null, params: Object }}
   */
  getCurrentRoute() {
    return { name: this.current, params: { ...this.params } };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // PARSEO DE HASH
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Parsea el hash actual y retorna { routeName, params }.
   * 
   * Ejemplos de hash → routeName + params:
   *   #/dashboard                    → 'dashboard', {}
   *   #/clientes                     → 'clientes', {}
   *   #/clientes/nuevo               → 'clientes/nuevo', {}
   *   #/clientes/edit/x7k2m9p        → 'clientes/edit', { id: 'x7k2m9p' }
   *   #/pagos/detalle/x7k2m9p?tab=2  → 'pagos/detalle', { id: 'x7k2m9p', tab: '2' }
   *
   * @param {string} [hashStr]  Defaults to window.location.hash
   * @returns {{ routeName: string, params: Object }}
   */
  _parseHash(hashStr) {
    const raw = (hashStr || window.location.hash || '').replace(/^#\/?/, '');

    // Separar query string
    const [pathPart, queryPart] = raw.split('?');
    const segments = pathPart.split('/').filter(Boolean);

    // Parsear query string
    const params = {};
    if (queryPart) {
      for (const pair of queryPart.split('&')) {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      }
    }

    if (segments.length === 0) {
      return { routeName: this._defaultRoute, params };
    }

    // Estrategia de match: intentar rutas de más específicas a menos específicas.
    // Se busca si alguna ruta registrada coincide con los segmentos.
    // El último segmento puede ser un ID si no forma parte de la ruta.

    // Intentar match exacto primero (todos los segmentos son parte de la ruta)
    const fullRoute = segments.join('/');
    if (this.routes[fullRoute]) {
      return { routeName: fullRoute, params };
    }

    // Intentar con el último segmento como 'id'
    if (segments.length >= 2) {
      const possibleId = segments[segments.length - 1];
      const routeWithoutId = segments.slice(0, -1).join('/');
      if (this.routes[routeWithoutId]) {
        params.id = decodeURIComponent(possibleId);
        return { routeName: routeWithoutId, params };
      }
    }

    // Intentar con los dos últimos segmentos como parte dinámica
    if (segments.length >= 3) {
      const routeBase = segments.slice(0, -2).join('/');
      if (this.routes[routeBase]) {
        params.id = decodeURIComponent(segments[segments.length - 1]);
        params.sub = decodeURIComponent(segments[segments.length - 2]);
        return { routeName: routeBase, params };
      }
    }

    // Fallback: usar el primer segmento como ruta
    const baseRoute = segments[0];
    if (segments.length > 1) {
      params.id = decodeURIComponent(segments[segments.length - 1]);
    }
    return { routeName: baseRoute, params };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // MANEJO DEL EVENTO HASHCHANGE
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Parsea el hash, ejecuta el handler correspondiente y actualiza
   * el estado del router. Llamado internamente en cada cambio de hash.
   */
  _handleHashChange() {
    if (this._navigating) return;
    this._navigating = true;

    try {
      const { routeName, params } = this._parseHash();

      // Actualizar estado
      this.current = routeName;
      this.params = params;

      // Guardar en historial interno
      this._history.push(window.location.hash);
      if (this._history.length > 50) this._history.shift(); // evitar memory leak

      // Actualizar document.title
      const title = ROUTE_TITLES[routeName] || _titleFromRoute(routeName);
      document.title = title ? `${title} — ${APP_TITLE}` : APP_TITLE;

      // Actualizar clases de links de navegación activos
      this._updateNavLinks(routeName);

      // Ejecutar handler registrado si existe
      const handler = this.routes[routeName];
      if (typeof handler === 'function') {
        handler(params);
      } else if (typeof window.renderRoute === 'function') {
        // Fallback: función global renderRoute para integración con páginas legacy
        window.renderRoute(routeName, params);
      } else {
        console.warn(`[Router] Sin handler para la ruta: '${routeName}'`);
        // Intentar ruta por defecto
        if (routeName !== this._defaultRoute) {
          this.navigate(this._defaultRoute);
        }
      }

      // Emitir evento de navegación si el bus de eventos está disponible
      try {
        if (window._AdminEvents && typeof window._AdminEvents.emit === 'function') {
          window._AdminEvents.emit('router:navigate', { route: routeName, params });
        }
      } catch (_) { /* ignorar si Events no está disponible */ }

    } finally {
      this._navigating = false;
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ACTUALIZACIÓN DE NAV LINKS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Marca como activo el link de navegación que corresponde a la ruta actual.
   * Los links deben tener el atributo data-route="nombre-de-ruta".
   * Al link activo se le agrega la clase 'nav-active' y se quita de los demás.
   * @param {string} routeName
   */
  _updateNavLinks(routeName) {
    // Quitar clase de todos los nav links
    const allLinks = document.querySelectorAll('[data-route]');
    for (const link of allLinks) {
      link.classList.remove('nav-active');
      link.removeAttribute('aria-current');
    }

    if (!routeName) return;

    // El link activo es el que corresponde a la ruta actual o a su padre
    // (e.g. 'clientes/edit' activa el link de 'clientes')
    const segments = routeName.split('/');

    // Intentar match exacto primero, luego el padre
    let matched = false;
    for (let i = segments.length; i >= 1; i--) {
      const candidate = segments.slice(0, i).join('/');
      const link = document.querySelector(`[data-route="${CSS.escape(candidate)}"]`);
      if (link) {
        link.classList.add('nav-active');
        link.setAttribute('aria-current', 'page');
        matched = true;
        break;
      }
    }

    // También buscar por href que contenga el hash
    if (!matched) {
      const hashLink = document.querySelector(`a[href="#/${routeName}"]`);
      if (hashLink) {
        hashLink.classList.add('nav-active');
        hashLink.setAttribute('aria-current', 'page');
      }
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // INICIALIZACIÓN
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Inicializa el router. Debe llamarse una vez al cargar la app.
   * - Agrega el listener de hashchange.
   * - Renderiza la ruta actual del hash.
   * - Si no hay hash, navega a la ruta por defecto.
   */
  init() {
    // Listener de hashchange
    window.addEventListener('hashchange', () => this._handleHashChange());

    // Listener de popstate (para compatibilidad con historial del browser)
    window.addEventListener('popstate', () => this._handleHashChange());

    // Interceptar clicks en links con data-route para navegación sin recarga
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (!link) return;
      const route = link.getAttribute('data-route');
      if (!route) return;
      e.preventDefault();
      this.navigate(route);
    });

    // Renderizar ruta inicial
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      this.navigate(this._defaultRoute);
    } else {
      this._handleHashChange();
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera un título legible desde un nombre de ruta si no está en ROUTE_TITLES.
 * @param {string} routeName
 * @returns {string}
 */
function _titleFromRoute(routeName) {
  if (!routeName) return '';
  return routeName
    .split('/')
    .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join(' › ');
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS DE NAV ACTIVO (inyectados dinámicamente para no depender de CSS externo)
// ─────────────────────────────────────────────────────────────────────────────

(function _injectNavStyles() {
  if (document.getElementById('router-nav-styles')) return;
  const style = document.createElement('style');
  style.id = 'router-nav-styles';
  style.textContent = `
    /* Estilo base del nav-active — puede ser sobreescrito por el CSS de la app */
    .nav-active {
      background-color: rgba(16, 185, 129, 0.15) !important; /* emerald-500/15 */
      color: #10B981 !important;                              /* emerald-500 */
      border-left-color: #10B981 !important;
    }
    .nav-active svg,
    .nav-active .nav-icon {
      color: #10B981 !important;
    }
  `;
  // Inyectar cuando el DOM esté listo
  if (document.head) {
    document.head.appendChild(style);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
  }
})();
