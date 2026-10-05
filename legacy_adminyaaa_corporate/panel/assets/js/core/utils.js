/**
 * utils.js — Módulo de utilidades globales de AdminYAAA
 * Todas las funciones son seguras ante null/undefined.
 */

// ─────────────────────────────────────────────────────────────────────────────
// FORMATEO DE MONEDA Y FECHAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatea un número como moneda argentina sin decimales.
 * @param {number|string|null} n
 * @returns {string} e.g. '$ 150.000'
 */
export function formatMoney(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return '$ 0';
  return '$ ' + num.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Formatea una fecha ISO como DD/MM/AAAA.
 * @param {string|null} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  // Parsear como local para evitar offset UTC
  const parts = String(isoString).substring(0, 10).split('-');
  if (parts.length !== 3) return '—';
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Formatea una fecha ISO como DD/MM/AA (año de 2 dígitos).
 * @param {string|null} isoString
 * @returns {string}
 */
export function formatDateShort(isoString) {
  if (!isoString) return '—';
  const parts = String(isoString).substring(0, 10).split('-');
  if (parts.length !== 3) return '—';
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${String(yyyy).slice(-2)}`;
}

/**
 * Formatea una fecha/hora ISO como DD/MM/AAAA HH:MM.
 * @param {string|null} isoString
 * @returns {string}
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const s = String(isoString);
  const datePart = s.substring(0, 10).split('-');
  if (datePart.length !== 3) return '—';
  const [yyyy, mm, dd] = datePart;
  // Extraer hora y minutos si existen
  const timePart = s.length >= 16 ? s.substring(11, 16) : '00:00';
  return `${dd}/${mm}/${yyyy} ${timePart}`;
}

/**
 * Parsea una fecha en formato DD/MM/AAAA a 'YYYY-MM-DD'.
 * @param {string} ddmmaaaa
 * @returns {string|null}
 */
export function parseDate(ddmmaaaa) {
  if (!ddmmaaaa) return null;
  const clean = String(ddmmaaaa).trim();
  // Soportar separadores / o -
  const parts = clean.split(/[\/\-]/);
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy) return null;
  const year = yyyy.length === 2 ? `20${yyyy}` : yyyy;
  return `${year.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

/**
 * Retorna la fecha de hoy como 'YYYY-MM-DD'.
 * @returns {string}
 */
export function today() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Retorna la fecha de hoy como 'DD/MM/AAAA'.
 * @returns {string}
 */
export function todayDisplay() {
  return formatDate(today());
}

/**
 * Retorna cuántos días pasaron desde una fecha ISO.
 * Positivo = pasado, negativo = futuro.
 * @param {string} isoDate
 * @returns {number}
 */
export function daysAgo(isoDate) {
  if (!isoDate) return 0;
  const then = new Date(String(isoDate).substring(0, 10) + 'T00:00:00');
  const now = new Date(today() + 'T00:00:00');
  return Math.round((now - then) / 86400000);
}

/**
 * Agrega n días a una fecha ISO y retorna 'YYYY-MM-DD'.
 * @param {string} isoDate
 * @param {number} n
 * @returns {string}
 */
export function addDays(isoDate, n) {
  if (!isoDate) return today();
  const d = new Date(String(isoDate).substring(0, 10) + 'T00:00:00');
  d.setDate(d.getDate() + (parseInt(n) || 0));
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Nombres de meses en español (Argentina). */
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Retorna el nombre del mes (1-indexed).
 * @param {number} monthNum  1..12
 * @returns {string}
 */
export function monthName(monthNum) {
  const idx = parseInt(monthNum) - 1;
  return MESES[idx] ?? '—';
}

/**
 * Retorna el mes y año actual como 'Septiembre 2026'.
 * @returns {string}
 */
export function currentMonthYear() {
  const d = new Date();
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE STRINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escapa caracteres HTML para prevenir XSS.
 * @param {any} s
 * @returns {string}
 */
export function escHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convierte un string a slug URL-friendly.
 * @param {string} s
 * @returns {string}
 */
export function slugify(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Retorna las iniciales de un nombre completo (máx. 2 caracteres).
 * @param {string} fullName
 * @returns {string}
 */
export function initials(fullName) {
  if (!fullName) return '??';
  const words = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Trunca un string con elipsis al superar maxLen caracteres.
 * @param {string} s
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(s, maxLen) {
  if (!s) return '';
  const str = String(s);
  const len = parseInt(maxLen) || 50;
  return str.length <= len ? str : str.substring(0, len - 1) + '…';
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE DOM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shortcut para querySelector.
 * @param {string} sel
 * @param {Element|Document} root
 * @returns {Element|null}
 */
export const qs = (sel, root) => (root || document).querySelector(sel);

/**
 * Shortcut para querySelectorAll, retorna Array.
 * @param {string} sel
 * @param {Element|Document} root
 * @returns {Element[]}
 */
export const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

/**
 * Crea un elemento HTML con atributos y children.
 * @param {string} tag
 * @param {Object} attrs  — { class, id, dataset, on, ... }
 * @param {...(string|Element)} children
 * @returns {Element}
 */
export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'class' || key === 'className') {
        element.className = val;
      } else if (key === 'dataset') {
        for (const [dk, dv] of Object.entries(val)) {
          element.dataset[dk] = dv;
        }
      } else if (key.startsWith('on') && typeof val === 'function') {
        element.addEventListener(key.substring(2).toLowerCase(), val);
      } else if (key === 'html') {
        element.innerHTML = val;
      } else if (key === 'text') {
        element.textContent = val;
      } else {
        try { element.setAttribute(key, val); } catch (_) { /* ignorar attrs inválidos */ }
      }
    }
  }
  for (const child of children) {
    if (child == null) continue;
    if (child instanceof Node) {
      element.appendChild(child);
    } else {
      element.appendChild(document.createTextNode(String(child)));
    }
  }
  return element;
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE TOASTS
// ─────────────────────────────────────────────────────────────────────────────

/** Configuración de estilos por tipo de toast. */
const TOAST_STYLES = {
  success: {
    bar:  'bg-emerald-500',
    icon: '✓',
    iconBg: 'bg-emerald-500',
    border: 'border-emerald-500/30',
  },
  error: {
    bar:  'bg-red-500',
    icon: '✕',
    iconBg: 'bg-red-500',
    border: 'border-red-500/30',
  },
  warning: {
    bar:  'bg-amber-500',
    icon: '⚠',
    iconBg: 'bg-amber-500',
    border: 'border-amber-500/30',
  },
  info: {
    bar:  'bg-slate-500',
    icon: 'i',
    iconBg: 'bg-slate-600',
    border: 'border-slate-500/30',
  },
};

const TOAST_DURATION = 3500; // ms
let _toastContainer = null;

/**
 * Inyecta el contenedor de toasts en el DOM. Llamar una vez al cargar la app.
 */
export function initToasts() {
  if (_toastContainer) return;

  // Inyectar estilos de animación
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toastSlideIn {
        from { transform: translateX(110%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
      @keyframes toastSlideOut {
        from { transform: translateX(0);    opacity: 1; }
        to   { transform: translateX(110%); opacity: 0; }
      }
      .toast-enter {
        animation: toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .toast-exit {
        animation: toastSlideOut 0.22s ease-in forwards;
      }
      #toast-container {
        pointer-events: none;
      }
      #toast-container > * {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);
  }

  _toastContainer = document.createElement('div');
  _toastContainer.id = 'toast-container';
  _toastContainer.setAttribute(
    'style',
    'position:fixed;bottom:1.25rem;right:1.25rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;align-items:flex-end;max-width:22rem;'
  );
  document.body.appendChild(_toastContainer);
}

/**
 * Muestra un toast en pantalla.
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} type
 */
export function toast(message, type = 'info') {
  if (!_toastContainer) initToasts();

  const style = TOAST_STYLES[type] ?? TOAST_STYLES.info;

  const wrapper = document.createElement('div');
  wrapper.className = 'toast-enter';
  wrapper.setAttribute(
    'style',
    'width:100%;'
  );

  wrapper.innerHTML = `
    <div class="flex items-start gap-3 rounded-lg border ${style.border} bg-slate-800 shadow-xl px-3 py-3 min-w-[280px] max-w-[340px]">
      <div class="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${style.iconBg} text-white text-xs font-bold leading-none mt-0.5">
        ${style.icon}
      </div>
      <p class="flex-1 text-sm text-slate-100 leading-snug">${escHtml(message)}</p>
      <button class="flex-shrink-0 text-slate-400 hover:text-slate-200 text-lg leading-none mt-[-2px] transition-colors" aria-label="Cerrar">×</button>
    </div>
    <div class="h-0.5 ${style.bar} rounded-b-lg toast-progress" style="width:100%;transition:width linear ${TOAST_DURATION}ms;"></div>
  `;

  // Botón cerrar
  const closeBtn = wrapper.querySelector('button');
  const dismiss = () => {
    wrapper.classList.remove('toast-enter');
    wrapper.classList.add('toast-exit');
    wrapper.addEventListener('animationend', () => wrapper.remove(), { once: true });
  };
  closeBtn.addEventListener('click', dismiss);

  _toastContainer.appendChild(wrapper);

  // Animar la barra de progreso (shrink to 0)
  requestAnimationFrame(() => {
    const bar = wrapper.querySelector('.toast-progress');
    if (bar) bar.style.width = '0%';
  });

  // Auto-dismiss
  const timer = setTimeout(dismiss, TOAST_DURATION);

  // Pausar al hover
  wrapper.addEventListener('mouseenter', () => clearTimeout(timer));
  wrapper.addEventListener('mouseleave', () => setTimeout(dismiss, 800));
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIONES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida el formato y dígito verificador de un CUIT/CUIL argentino.
 * @param {string|number} cuit
 * @returns {boolean}
 */
export function validateCUIT(cuit) {
  if (!cuit) return false;
  // Normalizar: eliminar guiones y espacios
  const clean = String(cuit).replace(/[-\s]/g, '');
  if (!/^\d{11}$/.test(clean)) return false;

  // Prefijos válidos de CUIT/CUIL
  const prefix = parseInt(clean.substring(0, 2));
  const validPrefixes = [20, 23, 24, 27, 30, 33, 34];
  if (!validPrefixes.includes(prefix)) return false;

  // Cálculo del dígito verificador
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i]) * weights[i];
  }
  const remainder = sum % 11;
  let checkDigit;
  if (remainder === 0) {
    checkDigit = 0;
  } else if (remainder === 1) {
    // Dígito verificador inválido para algunos prefijos — aceptar con advertencia
    checkDigit = 9;
  } else {
    checkDigit = 11 - remainder;
  }
  return checkDigit === parseInt(clean[10]);
}

/**
 * Valida un número de teléfono argentino.
 * Acepta formatos: 011-1234-5678, +5491112345678, 1512345678, etc.
 * @param {string} phone
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone) return false;
  const clean = String(phone).replace(/[\s\-\(\)\.]/g, '');
  // Debe tener entre 8 y 15 dígitos (con o sin código de país)
  if (!/^(\+54|54|0)?[\d]{8,13}$/.test(clean)) return false;
  // No puede ser solo ceros
  if (/^0+$/.test(clean)) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE ARRAYS Y OBJETOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Agrupa un array de objetos por el valor de una clave.
 * @param {Object[]} arr
 * @param {string|Function} key
 * @returns {Object.<string, Object[]>}
 */
export function groupBy(arr, key) {
  if (!Array.isArray(arr)) return {};
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item?.[key];
    const groupKey = k == null ? '__undefined__' : String(k);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});
}

/**
 * Ordena un array de objetos por una clave.
 * @param {Object[]} arr
 * @param {string|Function} key
 * @param {'asc'|'desc'} dir
 * @returns {Object[]}
 */
export function sortBy(arr, key, dir = 'asc') {
  if (!Array.isArray(arr)) return [];
  const factor = dir === 'desc' ? -1 : 1;
  return [...arr].sort((a, b) => {
    const va = typeof key === 'function' ? key(a) : a?.[key];
    const vb = typeof key === 'function' ? key(b) : b?.[key];
    if (va == null && vb == null) return 0;
    if (va == null) return factor;
    if (vb == null) return -factor;
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * factor;
    }
    return String(va).localeCompare(String(vb), 'es-AR') * factor;
  });
}

/**
 * Suma los valores numéricos de una clave en un array de objetos.
 * @param {Object[]} arr
 * @param {string|Function} key
 * @returns {number}
 */
export function sum(arr, key) {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((acc, item) => {
    const val = typeof key === 'function' ? key(item) : item?.[key];
    return acc + (parseFloat(val) || 0);
  }, 0);
}

/**
 * Genera un ID único corto (7 caracteres alfanuméricos).
 * @returns {string}
 */
export function uid() {
  // Combinar timestamp reducido con random para evitar colisiones
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return (ts + rand).slice(-7);
}

// ─────────────────────────────────────────────────────────────────────────────
// LÓGICA FIFO DE PAGOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aplica un pago a deudas usando método FIFO (más antiguas primero).
 *
 * @param {Array<{id: string, fecha: string, monto: number, pendiente: number}>} debts
 *   Array de deudas ordenado de más antigua a más nueva.
 *   `pendiente` es el monto aún no pagado de cada deuda.
 *
 * @param {number} payment  Monto total a aplicar.
 *
 * @returns {{
 *   applied: Array<{debtId: string, amount: number}>,
 *   remaining: number
 * }}
 *   `applied` lista qué monto se imputó a cada deuda.
 *   `remaining` es el sobrante del pago (si supera todas las deudas).
 */
export function applyFIFO(debts, payment) {
  if (!Array.isArray(debts) || debts.length === 0) {
    return { applied: [], remaining: parseFloat(payment) || 0 };
  }

  let remaining = parseFloat(payment) || 0;
  const applied = [];

  for (const debt of debts) {
    if (remaining <= 0) break;

    const pendiente = parseFloat(debt.pendiente) || 0;
    if (pendiente <= 0) continue;

    const toApply = Math.min(remaining, pendiente);
    applied.push({
      debtId: debt.id,
      amount: Math.round(toApply * 100) / 100, // evitar floating point noise
    });
    remaining -= toApply;
  }

  return {
    applied,
    remaining: Math.max(0, Math.round(remaining * 100) / 100),
  };
}
