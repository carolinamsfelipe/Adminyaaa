/**
 * state.js — Mini store reactivo y event bus para AdminYAAA.
 *
 * Uso:
 *   import { AppState, Events } from './state.js';
 *   AppState.set('user', { nombre: 'Carolina' });
 *   AppState.subscribe('user', (val) => console.log('user cambió:', val));
 *   Events.emit('cliente:guardado', { id: 'x7k2m9p' });
 */

// ─────────────────────────────────────────────────────────────────────────────
// STORE REACTIVO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene el valor de un objeto con notación de punto.
 * @param {Object} obj
 * @param {string} path  e.g. 'user.nombre'
 * @returns {any}
 */
function getPath(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj);
}

/**
 * Establece el valor en un objeto con notación de punto.
 * Crea objetos intermedios si no existen.
 * Retorna una copia superficial modificada del objeto raíz.
 * @param {Object} obj
 * @param {string} path
 * @param {any} value
 * @returns {Object}
 */
function setPath(obj, path, value) {
  if (!path) return value;
  const keys = path.split('.');
  const root = { ...obj };
  let current = root;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    // Clonar el nivel actual para no mutar el original
    current[key] = current[key] != null && typeof current[key] === 'object'
      ? { ...current[key] }
      : {};
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return root;
}

/**
 * Crea un store reactivo minimal.
 *
 * @param {Object} initialState  Estado inicial del store.
 * @returns {{
 *   get: (key: string) => any,
 *   set: (key: string, value: any) => void,
 *   update: (key: string, updater: Function) => void,
 *   subscribe: (key: string, callback: Function) => Function,
 *   getAll: () => Object,
 * }}
 */
export function createStore(initialState = {}) {
  // Estado interno (nunca expuesto directamente)
  let _state = { ...initialState };

  // Mapa de suscriptores: { 'key.path': Set<Function> }
  const _subscribers = new Map();

  /**
   * Notifica a todos los suscriptores de una clave y sus claves padre.
   * @param {string} changedKey
   */
  function _notify(changedKey) {
    // Notificar suscriptores exactos de la clave
    if (_subscribers.has(changedKey)) {
      const val = getPath(_state, changedKey);
      for (const cb of _subscribers.get(changedKey)) {
        try { cb(val, changedKey); } catch (e) { console.error('[Store] Error en suscriptor:', e); }
      }
    }

    // Notificar suscriptores de claves padre (e.g. si cambia 'user.nombre', avisar a 'user')
    const parts = changedKey.split('.');
    for (let i = parts.length - 1; i >= 1; i--) {
      const parentKey = parts.slice(0, i).join('.');
      if (_subscribers.has(parentKey)) {
        const val = getPath(_state, parentKey);
        for (const cb of _subscribers.get(parentKey)) {
          try { cb(val, changedKey); } catch (e) { console.error('[Store] Error en suscriptor padre:', e); }
        }
      }
    }

    // Suscriptores globales (clave vacía = cualquier cambio)
    if (_subscribers.has('*')) {
      for (const cb of _subscribers.get('*')) {
        try { cb(_state, changedKey); } catch (e) { console.error('[Store] Error en suscriptor global:', e); }
      }
    }
  }

  return {
    /**
     * Obtiene el valor de una clave (soporta notación de punto).
     * @param {string} key
     * @returns {any}
     */
    get(key) {
      return getPath(_state, key);
    },

    /**
     * Establece el valor de una clave y notifica suscriptores.
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
      _state = setPath(_state, key, value);
      _notify(key);
    },

    /**
     * Actualiza el valor de una clave mediante una función.
     * La función recibe el valor actual y debe retornar el nuevo valor.
     * @param {string} key
     * @param {Function} updater  (currentValue) => newValue
     */
    update(key, updater) {
      if (typeof updater !== 'function') {
        console.warn('[Store] update() requiere una función como updater.');
        return;
      }
      const current = getPath(_state, key);
      const next = updater(current);
      _state = setPath(_state, key, next);
      _notify(key);
    },

    /**
     * Suscribe una función a cambios en una clave.
     * Retorna una función de cancelación (unsubscribe).
     * Usar '*' para suscribirse a cualquier cambio.
     * @param {string} key
     * @param {Function} callback  (value, changedKey) => void
     * @returns {Function}  unsubscribe()
     */
    subscribe(key, callback) {
      if (typeof callback !== 'function') {
        console.warn('[Store] subscribe() requiere una función como callback.');
        return () => {};
      }
      if (!_subscribers.has(key)) {
        _subscribers.set(key, new Set());
      }
      _subscribers.get(key).add(callback);

      // Retornar función de cancelación
      return () => {
        const subs = _subscribers.get(key);
        if (subs) {
          subs.delete(callback);
          if (subs.size === 0) _subscribers.delete(key);
        }
      };
    },

    /**
     * Retorna una copia inmutable del estado completo.
     * @returns {Object}
     */
    getAll() {
      return { ..._state };
    },

    /**
     * Resetea el store a su estado inicial.
     * Útil para logout o tests.
     */
    reset() {
      _state = { ...initialState };
      _notify('*');
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO GLOBAL DE LA APLICACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Store global de AdminYAAA.
 *
 * Claves predefinidas:
 *   user    — objeto del usuario autenticado (null si no hay sesión)
 *   role    — 'admin' | 'operador'
 *   filters — estado de filtros por página { [pageId]: { ... } }
 *   loading — boolean global de carga
 */
export const AppState = createStore({
  user: null,
  role: null,
  filters: {},
  loading: false,
});

// ─────────────────────────────────────────────────────────────────────────────
// EVENT BUS SIMPLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bus de eventos desacoplado para comunicación entre módulos.
 *
 * Uso:
 *   Events.on('cliente:guardado', ({ id }) => { ... });
 *   Events.emit('cliente:guardado', { id: 'x7k2m9p' });
 *   Events.off('cliente:guardado', handlerRef);
 *
 * Convención de nombres: '{entidad}:{acción}'
 *   e.g. 'cliente:creado', 'pago:registrado', 'sesion:cerrada'
 */
export const Events = (() => {
  /** @type {Map<string, Set<Function>>} */
  const _handlers = new Map();

  return {
    /**
     * Suscribe un handler a un evento.
     * @param {string} event
     * @param {Function} handler  (data) => void
     * @returns {Function}  Función de cancelación
     */
    on(event, handler) {
      if (typeof handler !== 'function') {
        console.warn(`[Events] on('${event}') requiere una función.`);
        return () => {};
      }
      if (!_handlers.has(event)) {
        _handlers.set(event, new Set());
      }
      _handlers.get(event).add(handler);
      return () => Events.off(event, handler);
    },

    /**
     * Elimina un handler de un evento.
     * @param {string} event
     * @param {Function} handler
     */
    off(event, handler) {
      const set = _handlers.get(event);
      if (set) {
        set.delete(handler);
        if (set.size === 0) _handlers.delete(event);
      }
    },

    /**
     * Emite un evento con datos opcionales.
     * Todos los handlers se ejecutan sincrónicamente.
     * @param {string} event
     * @param {any} [data]
     */
    emit(event, data) {
      const set = _handlers.get(event);
      if (!set || set.size === 0) return;
      for (const handler of set) {
        try {
          handler(data);
        } catch (e) {
          console.error(`[Events] Error en handler de '${event}':`, e);
        }
      }
      // Emitir también al handler comodín '*' si existe
      const wildcard = _handlers.get('*');
      if (wildcard) {
        for (const handler of wildcard) {
          try { handler({ event, data }); } catch (e) { /* ignorar */ }
        }
      }
    },

    /**
     * Suscribe un handler que se ejecuta una sola vez y luego se desregistra.
     * @param {string} event
     * @param {Function} handler
     * @returns {Function}  Función de cancelación
     */
    once(event, handler) {
      const wrapper = (data) => {
        Events.off(event, wrapper);
        handler(data);
      };
      return Events.on(event, wrapper);
    },

    /**
     * Elimina todos los handlers (útil en tests o hot-reload).
     */
    clear() {
      _handlers.clear();
    },

    /**
     * Lista los eventos actualmente registrados (útil para debug).
     * @returns {string[]}
     */
    listEvents() {
      return Array.from(_handlers.keys());
    },
  };
})();
