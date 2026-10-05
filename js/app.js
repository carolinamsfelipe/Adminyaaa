/**
 * APLICACIÓN PRINCIPAL — Mayorista a tu Casa
 * Una iniciativa de AdminYAAA
 * Orquestador de catálogo, filtros, carrito, checkout, cuentas y WhatsApp
 */

import { STORE_CONFIG } from './config.js';
import { PRODUCTS, PRODUCT_BY_ID } from './data/catalog.js';
import { COMBOS, COMBO_BY_ID } from './data/combos.js';
import { SECTIONS } from './data/categories.js';

import { StorageService } from './services/storageService.js';
import { AuthService } from './services/authService.js';
import { AddressService } from './services/addressService.js';
import { PaymentService } from './services/paymentService.js';
import { FavoritesService } from './services/favoritesService.js';
import { CartService } from './services/cartService.js';
import { OrdersService } from './services/ordersService.js';
import { WhatsAppService } from './services/whatsappService.js';

import { Toast } from './ui/toast.js';
import { Modal } from './ui/modal.js';
import { Drawer } from './ui/drawer.js';
import { QuickView } from './ui/quickView.js';
import { MegaMenu } from './ui/megaMenu.js';

// Sincronización en vivo con inventario y precios del Panel Administrativo (/admin)
function getLiveProducts() {
  const stored = StorageService.get('wholesale_products', null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    stored.forEach(p => {
      PRODUCT_BY_ID.set(p.id, {
        ...p,
        inStock: (p.stock !== undefined ? p.stock > 0 : true) && p.status !== 'inactivo'
      });
    });
    return stored.map(p => ({
      ...p,
      inStock: (p.stock !== undefined ? p.stock > 0 : true) && p.status !== 'inactivo'
    }));
  }
  return PRODUCTS;
}

// Estado global de la vista
const state = {
  selectedSection: 'todos',
  selectedCategory: 'todas',
  searchQuery: '',
  sortBy: 'destacados', // destacados, precio-menor, precio-mayor, nombre, ofertas
  filterBadge: 'todos',
  checkoutStep: 1,
  checkoutData: {
    customer: {},
    deliveryType: 'domicilio',
    selectedZone: 'Ituzaingó',
    selectedAddressId: null,
    manualAddress: {},
    paymentMethod: 'efectivo',
    selectedCardId: null,
    customerNotes: ''
  }
};

// ============================================================
// 1. INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  Modal.init();
  Drawer.init();

  // Inicializar Mega Menú de Categorías (Estilo Club de Beneficios)
  MegaMenu.init({
    onSelectCategory: ({ section, category, anchor }) => {
      handleMegaMenuSelect({ section, category, anchor });
    }
  });

  // Sincronizar catálogo inicial desde Storage si existe
  getLiveProducts();

  renderTopbar();
  renderBrandHeader();
  renderHeroCombosPreview();
  renderCombosSection();
  renderSectionFilterPills();
  renderCatalog();
  renderOffersSection();
  renderTopSellersSection();
  renderCartDrawer();
  updateAuthUI();

  bindEventListeners();
  subscribeToServices();
});

function subscribeToServices() {
  AuthService.subscribe(() => {
    updateAuthUI();
    renderSavedAddressesInProfile();
    renderSavedCardsInProfile();
    renderOrdersInProfile();
  });

  CartService.subscribe(() => {
    renderCartDrawer();
    updateCartBadges();
    updateCardSteppers();
  });

  FavoritesService.subscribe(() => {
    updateFavoritesUI();
  });

  // Re-renderizar si el administrador modifica precios o stock en otra pestaña
  window.addEventListener('storage', (e) => {
    if (e.key === 'wholesale_products') {
      getLiveProducts();
      renderSectionFilterPills();
      renderCatalog();
      renderOffersSection();
      renderTopSellersSection();
    }
  });
}

// ============================================================
// 2. RENDER DE HEADER Y TOPBAR
// ============================================================
function renderTopbar() {
  const topbar = document.getElementById('topbar-info');
  if (topbar) {
    topbar.innerHTML = `
      <div class="topbar-messages">
        <span class="topbar-badge">Atención Directa</span>
        <span>Envíos sin cargo en Ituzaingó · Pedidos por WhatsApp al <strong>${STORE_CONFIG.whatsappVisible}</strong></span>
      </div>
      <div class="topbar-links">
        <a href="#como-comprar" class="topbar-link">Cómo comprar</a>
        <a href="#preguntas" class="topbar-link">Preguntas frecuentes</a>
        <a href="#contacto" class="topbar-link">Contacto</a>
      </div>
    `;
  }
}

function renderBrandHeader() {
  const brandSub = document.querySelectorAll('.brand-sub-initiative');
  brandSub.forEach(el => {
    el.innerHTML = `Una iniciativa de <strong>AdminYAAA</strong>`;
  });
}

function updateCartBadges() {
  const totals = CartService.getTotals();
  const badges = document.querySelectorAll('.cart-count-badge');
  badges.forEach(b => {
    b.textContent = totals.totalUnits;
    b.style.display = totals.totalUnits > 0 ? 'flex' : 'none';
  });

  const cartTotalLabels = document.querySelectorAll('.cart-total-badge');
  cartTotalLabels.forEach(lbl => {
    lbl.textContent = '$' + totals.subtotal.toLocaleString('es-AR');
  });
}

function updateFavoritesUI() {
  const user = AuthService.getCurrentUser();
  const favCount = FavoritesService.getFavorites(user?.id).length;
  const favBadges = document.querySelectorAll('.fav-count-badge');
  favBadges.forEach(b => {
    b.textContent = favCount;
    b.style.display = favCount > 0 ? 'flex' : 'none';
  });

  // Actualizar corazones en tarjetas visibles
  document.querySelectorAll('.product-card-fav').forEach(btn => {
    const pid = btn.dataset.productId;
    const isFav = FavoritesService.isFavorite(user?.id, pid);
    btn.classList.toggle('is-fav', isFav);
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
  });
}

function updateAuthUI() {
  const user = AuthService.getCurrentUser();
  const btnAuth = document.getElementById('header-btn-account');
  const btnMobileAuth = document.getElementById('mobile-nav-account');

  if (user) {
    if (btnAuth) btnAuth.innerHTML = `<span class="user-avatar-tag">${user.firstName[0]}</span> ${user.firstName}`;
    if (btnMobileAuth) btnMobileAuth.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Mi Perfil</span>`;
  } else {
    if (btnAuth) btnAuth.innerHTML = `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Ingresar`;
    if (btnMobileAuth) btnMobileAuth.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Cuenta</span>`;
  }

  // Visibilidad condicional del acceso de Administración (solo para administradores o demo)
  const adminSession = StorageService.get('wholesale_admin_session', null);
  const urlParams = new URLSearchParams(window.location.search);
  const hasAdminAccess = (adminSession && adminSession.authenticated) || 
                         urlParams.has('admin') || 
                         urlParams.has('demo') || 
                         (user && (user.role === 'admin' || user.email?.includes('admin')));

  const navAdmin = document.getElementById('nav-header-admin-link');
  if (navAdmin) {
    navAdmin.style.display = hasAdminAccess ? 'inline-flex' : 'none';
  }
  const mobileAdmin = document.getElementById('mobile-drawer-admin-link');
  if (mobileAdmin) {
    mobileAdmin.style.display = hasAdminAccess ? 'flex' : 'none';
  }
}

// ============================================================
// 3. COMBOS DESTACADOS
// ============================================================
function renderHeroCombosPreview() {
  const container = document.getElementById('hero-combos-preview');
  if (!container) return;

  const featured = COMBOS.find(c => c.id === 'C200') || COMBOS[0];
  container.innerHTML = `
    <div class="hero-visual-card">
      <span class="badge badge--nuevo" style="margin-bottom:0.75rem">Combo Recomendado</span>
      <h3 class="hero-visual-card-title">${featured.name}</h3>
      <div class="hero-visual-card-price">$${featured.price.toLocaleString('es-AR')}</div>
      <p style="font-size:0.875rem;color:#CBD5E1">${featured.totalUnits} unidades de primeras marcas</p>
      <div class="hero-visual-items-preview">
        ${featured.items.slice(0, 4).map(it => `
          <img src="${it.image}" alt="${it.name}" class="hero-visual-thumb" title="${it.name} (${it.quantity} un.)">
        `).join('')}
      </div>
      <button class="btn btn--primary btn--block" data-action="add-combo" data-combo-id="${featured.id}">
        Agregar este combo
      </button>
    </div>
  `;
}

function renderCombosSection() {
  const grid = document.getElementById('combos-grid');
  if (!grid) return;

  grid.innerHTML = COMBOS.map(combo => `
    <article class="combo-card">
      <div class="combo-card-header">
        <span class="badge badge--combo combo-card-badge">${combo.badge}</span>
        <h3 class="combo-card-title">${combo.name}</h3>
        <p class="combo-card-desc">${combo.description}</p>
      </div>

      <div class="combo-card-highlight">
        <span class="combo-card-units">${combo.totalUnits} unidades (${combo.itemCount} productos)</span>
        <span class="combo-card-savings">Ahorro: $${combo.savingARS.toLocaleString('es-AR')}</span>
      </div>

      <div class="combo-card-pricing">
        <div class="combo-card-price-row">
          <span class="combo-card-price">$${combo.price.toLocaleString('es-AR')}</span>
          <span class="combo-card-old-price">$${combo.oldPrice.toLocaleString('es-AR')}</span>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button type="button" class="btn btn--primary btn--block" data-action="add-combo" data-combo-id="${combo.id}">
            Agregar combo
          </button>
          <button type="button" class="btn btn--outline btn--icon" data-action="view-combo-details" data-combo-id="${combo.id}" aria-label="Ver productos incluidos">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

// ============================================================
// 4. CATÁLOGO, FILTROS Y BÚSQUEDA
// ============================================================
function renderSectionFilterPills() {
  const container = document.getElementById('category-filter-pills');
  if (!container) return;

  const totalAll = getLiveProducts().length;
  let html = `
    <button type="button" class="pill-btn ${state.selectedSection === 'todos' ? 'is-active' : ''}" data-section="todos">
      Todos (${totalAll})
    </button>
  `;

  SECTIONS.forEach(sec => {
    html += `
      <button type="button" class="pill-btn ${state.selectedSection === sec.section ? 'is-active' : ''}" data-section="${sec.section}">
        ${sec.section} (${sec.totalProducts})
      </button>
    `;
  });

  container.innerHTML = html;
}

function getFilteredProducts() {
  let list = [...getLiveProducts()];

  // Filtro por Sección
  if (state.selectedSection !== 'todos') {
    list = list.filter(p => p.section === state.selectedSection);
  }

  // Filtro por Categoría específica si se seleccionó
  if (state.selectedCategory !== 'todas') {
    list = list.filter(p => p.category === state.selectedCategory);
  }

  // Filtro por Búsqueda
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.originalName.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.section.toLowerCase().includes(q)
    );
  }

  // Filtro por Badges
  if (state.filterBadge !== 'todos') {
    list = list.filter(p => p.badge === state.filterBadge);
  }

  // Ordenamiento
  switch (state.sortBy) {
    case 'precio-menor':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'precio-mayor':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'nombre':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'ofertas':
      list.sort((a, b) => (b.oldPrice ? b.oldPrice - b.price : 0) - (a.oldPrice ? a.oldPrice - a.price : 0));
      break;
    default:
      // destacados
      list.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
      break;
  }

  return list;
}

function getCartItemQty(productId) {
  const items = CartService.getItems();
  const item = items.find(it => it.id === `prod_${productId}`);
  return item ? item.quantity : 0;
}

function updateCardSteppers() {
  document.querySelectorAll('[data-product-id]').forEach(card => {
    const pid = card.dataset.productId;
    if (!pid) return;
    const footer = card.querySelector('.product-card-footer');
    if (!footer) return;

    const inCartQty = getCartItemQty(pid);
    const existingStepper = footer.querySelector('.product-card-stepper');
    const existingAddBtn = footer.querySelector('.product-card-add-btn');

    if (inCartQty > 0) {
      if (existingStepper) {
        const numEl = existingStepper.querySelector('.stepper-qty-num');
        if (numEl) numEl.textContent = inCartQty;
      } else if (existingAddBtn) {
        existingAddBtn.outerHTML = `
          <div class="product-card-stepper" data-product-id="${pid}">
            <button type="button" class="stepper-btn" data-action="stepper-minus" data-product-id="${pid}" aria-label="Disminuir cantidad">−</button>
            <span class="stepper-qty-num" data-product-id="${pid}">${inCartQty}</span>
            <button type="button" class="stepper-btn" data-action="stepper-plus" data-product-id="${pid}" aria-label="Aumentar cantidad">+</button>
          </div>
        `;
      }
    } else {
      if (existingStepper) {
        existingStepper.outerHTML = `
          <button type="button" class="btn btn--primary btn--sm product-card-add-btn" data-action="add-product" data-product-id="${pid}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Agregar
          </button>
        `;
      }
    }
  });
}

function renderCatalog() {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('catalog-count');
  if (!grid) return;

  const products = getFilteredProducts();
  if (countEl) countEl.textContent = `${products.length} productos`;

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </div>
        <h3 class="empty-state-title">No encontramos productos</h3>
        <p class="empty-state-desc">Probá con otra palabra clave o limpiá los filtros aplicados.</p>
        <button type="button" class="btn btn--outline" id="btn-reset-filters">Limpiar filtros</button>
      </div>
    `;
    const resetBtn = grid.querySelector('#btn-reset-filters');
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    return;
  }

  const user = AuthService.getCurrentUser();

  grid.innerHTML = products.map(p => {
    const isFav = FavoritesService.isFavorite(user?.id, p.id);
    const unitLabel = p.unit === 'kg' ? 'el kg' : 'c/u';
    const inCartQty = getCartItemQty(p.id);

    return `
      <article class="product-card" data-product-id="${p.id}">
        <div class="product-card-top">
          <div class="product-card-badges">
            ${p.badge ? `<span class="badge badge--${p.badge.toLowerCase().replace(/\s+/g, '-')}">${p.badge}</span>` : ''}
          </div>
          <button type="button" class="product-card-fav ${isFav ? 'is-fav' : ''}" data-action="toggle-fav" data-product-id="${p.id}" aria-label="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <img src="${p.image}" alt="${p.name}" class="product-card-img" loading="lazy">
        </div>

        <div class="product-card-body">
          <div class="product-card-meta">
            <span class="product-card-brand">${p.brand}</span>
            <span>${p.category}</span>
          </div>
          <h3 class="product-card-title" title="${p.name}">${p.name}</h3>
          
          <div class="product-card-pricing">
            <div class="product-card-price-row">
              <span class="product-card-price">$${p.price.toLocaleString('es-AR')}</span>
              <span class="product-card-unit">/ ${unitLabel}</span>
              ${p.oldPrice ? `<span class="product-card-old-price">$${p.oldPrice.toLocaleString('es-AR')}</span>` : ''}
            </div>
            ${p.hasOptions ? `<p class="product-card-options-tag">★ Varias opciones disponibles</p>` : ''}
          </div>

          <div class="product-card-footer">
            ${inCartQty > 0 ? `
              <div class="product-card-stepper" data-product-id="${p.id}">
                <button type="button" class="stepper-btn" data-action="stepper-minus" data-product-id="${p.id}" aria-label="Disminuir cantidad">−</button>
                <span class="stepper-qty-num" data-product-id="${p.id}">${inCartQty}</span>
                <button type="button" class="stepper-btn" data-action="stepper-plus" data-product-id="${p.id}" aria-label="Aumentar cantidad">+</button>
              </div>
            ` : `
              <button type="button" class="btn btn--primary btn--sm product-card-add-btn" data-action="add-product" data-product-id="${p.id}">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Agregar
              </button>
            `}
            <button type="button" class="product-card-qv-btn" data-action="quick-view" data-product-id="${p.id}" aria-label="Vista rápida de ${p.name}">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function handleMegaMenuSelect({ section, category, anchor }) {
  if (anchor) {
    const el = document.querySelector(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  }

  if (section) {
    state.selectedSection = section;
    state.selectedCategory = (category && category !== 'todas') ? category : 'todas';
    state.searchQuery = '';
    const searchInput = document.getElementById('catalog-search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    if (searchInput) searchInput.value = '';
    if (searchClearBtn) searchClearBtn.classList.remove('is-visible');

    // Sincronizar pills de catálogo y chips de departamento
    document.querySelectorAll('.pill-btn, .dept-chip[data-section-filter]').forEach(p => {
      const s = p.dataset.section || p.dataset.sectionFilter;
      p.classList.toggle('is-active', s === section);
    });

    renderSectionFilterPills();
    renderCatalog();

    const catSection = document.getElementById('catalogo');
    if (catSection) {
      catSection.scrollIntoView({ behavior: 'smooth' });
    }
    Toast.show(`Mostrando ${category && category !== 'todas' ? category : section}`, 'info');
  }
}

function resetFilters() {
  state.selectedSection = 'todos';
  state.selectedCategory = 'todas';
  state.searchQuery = '';
  state.filterBadge = 'todos';
  state.sortBy = 'destacados';

  const searchInput = document.getElementById('catalog-search-input');
  if (searchInput) searchInput.value = '';

  renderSectionFilterPills();
  renderCatalog();
}

// ============================================================
// 5. SECCIÓN DE OFERTAS DE LA SEMANA
// ============================================================
function renderOffersSection() {
  const container = document.getElementById('offers-grid');
  if (!container) return;

  const deals = getLiveProducts().filter(p => p.badge === 'OFERTA').slice(0, 4);
  const user = AuthService.getCurrentUser();

  container.innerHTML = deals.map(p => {
    const isFav = FavoritesService.isFavorite(user?.id, p.id);
    const saving = p.oldPrice - p.price;
    const inCartQty = getCartItemQty(p.id);

    return `
      <article class="product-card" data-product-id="${p.id}">
        <div class="product-card-top">
          <div class="product-card-badges">
            <span class="badge badge--oferta">OFERTA</span>
          </div>
          <button type="button" class="product-card-fav ${isFav ? 'is-fav' : ''}" data-action="toggle-fav" data-product-id="${p.id}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <img src="${p.image}" alt="${p.name}" class="product-card-img" loading="lazy">
        </div>

        <div class="product-card-body">
          <div class="product-card-meta">
            <span class="product-card-brand">${p.brand}</span>
            <span class="text-success font-bold">Ahorrás $${saving.toLocaleString('es-AR')}</span>
          </div>
          <h3 class="product-card-title">${p.name}</h3>
          
          <div class="product-card-pricing">
            <div class="product-card-price-row">
              <span class="product-card-price">$${p.price.toLocaleString('es-AR')}</span>
              <span class="product-card-old-price">$${p.oldPrice.toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div class="product-card-footer">
            ${inCartQty > 0 ? `
              <div class="product-card-stepper" data-product-id="${p.id}">
                <button type="button" class="stepper-btn" data-action="stepper-minus" data-product-id="${p.id}" aria-label="Disminuir cantidad">−</button>
                <span class="stepper-qty-num" data-product-id="${p.id}">${inCartQty}</span>
                <button type="button" class="stepper-btn" data-action="stepper-plus" data-product-id="${p.id}" aria-label="Aumentar cantidad">+</button>
              </div>
            ` : `
              <button type="button" class="btn btn--primary btn--sm product-card-add-btn" data-action="add-product" data-product-id="${p.id}">
                Aprovechar oferta
              </button>
            `}
            <button type="button" class="product-card-qv-btn" data-action="quick-view" data-product-id="${p.id}" aria-label="Vista rápida de ${p.name}">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// ============================================================
// 6. LOS MÁS ELEGIDOS (RANKING 1, 2, 3, 4)
// ============================================================
function renderTopSellersSection() {
  const container = document.getElementById('top-sellers-grid');
  if (!container) return;

  const topItems = getLiveProducts().filter(p => p.badge === 'MÁS VENDIDO').slice(0, 4);

  container.innerHTML = topItems.map((p, idx) => `
    <div class="top-seller-item" style="display:flex;align-items:center;gap:1rem;background:#FFFFFF;border:1px solid var(--color-border);padding:1rem;border-radius:var(--radius-lg)">
      <span style="font-family:var(--font-heading);font-size:1.75rem;font-weight:800;color:var(--color-accent-500);width:32px;text-align:center">${idx + 1}</span>
      <img src="${p.image}" alt="${p.name}" style="width:56px;height:56px;object-fit:contain">
      <div style="flex:1">
        <h4 style="font-size:0.875rem;font-weight:700;line-height:1.3;margin-bottom:0.25rem">${p.name}</h4>
        <span style="font-size:0.9375rem;font-weight:800;color:var(--color-primary-900)">$${p.price.toLocaleString('es-AR')}</span>
      </div>
      <button class="btn btn--secondary btn--sm" data-action="add-product" data-product-id="${p.id}">
        +
      </button>
    </div>
  `).join('');
}

// ============================================================
// 7. DRAWER DEL CARRITO DE COMPRAS
// ============================================================
function renderCartDrawer() {
  const itemsContainer = document.getElementById('cart-drawer-items');
  const summaryContainer = document.getElementById('cart-drawer-summary');
  if (!itemsContainer || !summaryContainer) return;

  const items = CartService.getItems();
  const totals = CartService.getTotals(0, 'domicilio');

  if (items.length === 0) {
    itemsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </div>
        <h3 class="empty-state-title">Tu pedido está vacío</h3>
        <p class="empty-state-desc">Explorá nuestros combos sugeridos o elegí productos de almacén, limpieza y fiambrería.</p>
        <button type="button" class="btn btn--primary" data-close-drawer="cart-drawer">
          Ver productos
        </button>
      </div>
    `;
    summaryContainer.style.display = 'none';
    return;
  }

  summaryContainer.style.display = 'block';

  itemsContainer.innerHTML = `
    <div class="cart-items-list">
      ${items.map(it => `
        <div class="cart-item" data-item-id="${it.id}">
          <img src="${it.image}" alt="${it.name}" class="cart-item-img">
          <div class="cart-item-info">
            <h4 class="cart-item-name">${it.name}</h4>
            <div class="cart-item-price">$${it.price.toLocaleString('es-AR')} ${it.unit === 'kg' ? 'el kg' : 'c/u'}</div>
            ${it.optionsNote ? `<small class="text-accent">${it.optionsNote}</small>` : ''}
            
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.5rem">
              <div class="qty-selector">
                <button type="button" class="qty-btn" data-action="cart-minus" data-item-id="${it.id}">-</button>
                <input type="number" class="qty-input" value="${it.quantity}" readonly>
                <button type="button" class="qty-btn" data-action="cart-plus" data-item-id="${it.id}">+</button>
              </div>
              <button type="button" class="cart-item-remove" data-action="cart-remove" data-item-id="${it.id}">Eliminar</button>
            </div>
          </div>
          <div class="cart-item-subtotal">
            $${(it.price * it.quantity).toLocaleString('es-AR')}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  summaryContainer.innerHTML = `
    <div style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;font-size:0.875rem">
        <span class="text-muted">Subtotal mercadería (${totals.totalUnits} un.)</span>
        <strong>$${totals.subtotal.toLocaleString('es-AR')}</strong>
      </div>
      ${totals.savings > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;font-size:0.875rem" class="text-success">
          <span>Ahorro mayorista</span>
          <strong>-$${totals.savings.toLocaleString('es-AR')}</strong>
        </div>
      ` : ''}
      <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;font-size:0.875rem">
        <span class="text-muted">Envío</span>
        <span>${totals.isFreeShipping ? '<strong class="text-success">Gratis en Ituzaingó</strong>' : 'A calcular en checkout'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:1.25rem;font-weight:800;border-top:1px solid var(--color-border);padding-top:0.75rem;margin-top:0.5rem">
        <span>Total estimado:</span>
        <span class="text-accent">$${totals.total.toLocaleString('es-AR')}</span>
      </div>
    </div>

    <button type="button" class="btn btn--primary btn--lg btn--block" id="btn-start-checkout">
      Finalizar pedido
    </button>
  `;

  const checkoutBtn = summaryContainer.querySelector('#btn-start-checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      Drawer.close('cart-drawer');
      openCheckoutModal();
    });
  }
}

// ============================================================
// 8. CHECKOUT EN 5 PASOS CON CONFIRMACIÓN POR WHATSAPP
// ============================================================
function openCheckoutModal() {
  const user = AuthService.getCurrentUser();
  state.checkoutStep = 1;

  // Pre-cargar datos del usuario si está logueado
  if (user) {
    state.checkoutData.customer = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone
    };
    const defaultAddr = AddressService.getDefaultAddress(user.id);
    if (defaultAddr) {
      state.checkoutData.selectedAddressId = defaultAddr.id;
      state.checkoutData.selectedZone = defaultAddr.city;
    }
    const defaultCard = PaymentService.getDefaultCard(user.id);
    if (defaultCard) {
      state.checkoutData.selectedCardId = defaultCard.id;
    }
  }

  renderCheckoutStep(1);
  Modal.open('checkout-modal');
}

function renderCheckoutStep(stepNumber) {
  state.checkoutStep = stepNumber;
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  // Actualizar indicadores visuales de pasos
  const stepIndicators = modal.querySelectorAll('.checkout-step-indicator');
  stepIndicators.forEach((ind, idx) => {
    const stepIdx = idx + 1;
    ind.classList.remove('is-active', 'is-done');
    if (stepIdx === stepNumber) ind.classList.add('is-active');
    else if (stepIdx < stepNumber) ind.classList.add('is-done');
  });

  const contentArea = modal.querySelector('#checkout-step-content');
  const user = AuthService.getCurrentUser();
  const totals = CartService.getTotals(getZoneCost(state.checkoutData.selectedZone), state.checkoutData.deliveryType);

  switch (stepNumber) {
    case 1:
      // PASO 1: DATOS PERSONALES
      contentArea.innerHTML = `
        <h3 class="modal-step-title">Paso 1: Tus datos personales</h3>
        <p class="text-muted" style="margin-bottom:1.5rem;font-size:0.875rem">Para coordinar la preparación y confirmación de tu pedido.</p>
        
        <form id="form-checkout-step-1">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="co-name">Nombre *</label>
              <input type="text" id="co-name" class="form-input" required value="${state.checkoutData.customer.firstName || ''}">
            </div>
            <div class="form-group">
              <label class="form-label" for="co-lastname">Apellido *</label>
              <input type="text" id="co-lastname" class="form-input" required value="${state.checkoutData.customer.lastName || ''}">
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="co-phone">Teléfono / WhatsApp *</label>
              <input type="tel" id="co-phone" class="form-input" required placeholder="Ej: 11 3033-2341" value="${state.checkoutData.customer.phone || ''}">
            </div>
            <div class="form-group">
              <label class="form-label" for="co-email">Email (opcional)</label>
              <input type="email" id="co-email" class="form-input" placeholder="tu@email.com" value="${state.checkoutData.customer.email || ''}">
            </div>
          </div>

          ${!user ? `
            <div style="background:var(--color-primary-50);padding:0.875rem;border-radius:var(--radius-md);margin-bottom:1.25rem;font-size:0.8125rem">
              💡 <strong>¿Tenés cuenta?</strong> <a href="#" id="link-login-from-checkout" style="color:var(--color-accent-600);font-weight:700">Iniciá sesión</a> para usar tus direcciones y tarjetas guardadas.
            </div>
          ` : ''}

          <div class="modal-footer" style="padding-left:0;padding-right:0">
            <button type="button" class="btn btn--outline" data-close-modal="checkout-modal">Seguir comprando</button>
            <button type="submit" class="btn btn--primary">Continuar a entrega →</button>
          </div>
        </form>
      `;

      const f1 = contentArea.querySelector('#form-checkout-step-1');
      f1.addEventListener('submit', (e) => {
        e.preventDefault();
        state.checkoutData.customer = {
          firstName: f1.querySelector('#co-name').value.trim(),
          lastName: f1.querySelector('#co-lastname').value.trim(),
          phone: f1.querySelector('#co-phone').value.trim(),
          email: f1.querySelector('#co-email').value.trim()
        };
        renderCheckoutStep(2);
      });

      const loginLink = contentArea.querySelector('#link-login-from-checkout');
      if (loginLink) {
        loginLink.addEventListener('click', (e) => {
          e.preventDefault();
          Modal.close('checkout-modal');
          Modal.open('login-modal');
        });
      }
      break;

    case 2:
      // PASO 2: DIRECCIÓN Y LOCALIDAD
      const addresses = user ? AddressService.getAddresses(user.id) : [];
      contentArea.innerHTML = `
        <h3 class="modal-step-title">Paso 2: Dirección de entrega</h3>
        <p class="text-muted" style="margin-bottom:1.5rem;font-size:0.875rem">¿Dónde recibís tu compra mayorista?</p>
        
        ${addresses.length > 0 ? `
          <div style="margin-bottom:1.25rem">
            <label class="form-label">Elegí una de tus direcciones guardadas:</label>
            <div style="display:flex;flex-direction:column;gap:0.75rem">
              ${addresses.map(a => `
                <label style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.875rem;border:1.5px solid ${state.checkoutData.selectedAddressId === a.id ? 'var(--color-accent-500)' : 'var(--color-border)'};border-radius:var(--radius-md);cursor:pointer;background:${state.checkoutData.selectedAddressId === a.id ? 'var(--color-accent-50)' : '#FFFFFF'}">
                  <input type="radio" name="co-saved-addr" value="${a.id}" ${state.checkoutData.selectedAddressId === a.id ? 'checked' : ''} style="margin-top:0.25rem">
                  <div style="flex:1">
                    <strong>${a.name}</strong> — ${a.street} ${a.number} ${a.floorApt ? `(${a.floorApt})` : ''}, ${a.city}
                    ${a.references ? `<div style="font-size:0.75rem;color:var(--color-text-subtle)">Ref: ${a.references}</div>` : ''}
                  </div>
                </label>
              `).join('')}
            </div>
            <div style="text-align:right;margin-top:0.5rem">
              <button type="button" class="btn btn--outline btn--sm" id="btn-add-addr-in-co">+ Cargar otra dirección</button>
            </div>
          </div>
        ` : ''}

        <div id="co-manual-address-wrap" style="${addresses.length > 0 && state.checkoutData.selectedAddressId ? 'display:none' : 'display:block'}">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="co-street">Calle *</label>
              <input type="text" id="co-street" class="form-input" required value="${state.checkoutData.manualAddress.street || ''}">
            </div>
            <div class="form-group">
              <label class="form-label" for="co-num">Altura *</label>
              <input type="text" id="co-num" class="form-input" required value="${state.checkoutData.manualAddress.number || ''}">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="co-floor">Piso / Dpto (opcional)</label>
              <input type="text" id="co-floor" class="form-input" placeholder="Ej: 3 B" value="${state.checkoutData.manualAddress.floorApt || ''}">
            </div>
            <div class="form-group">
              <label class="form-label" for="co-zone">Localidad o Zona *</label>
              <select id="co-zone" class="form-select">
                ${STORE_CONFIG.deliveryZones.map(z => `
                  <option value="${z.zone}" ${state.checkoutData.selectedZone === z.zone ? 'selected' : ''}>${z.zone} (${z.cost === 0 ? 'Sin cargo' : z.cost !== null ? '$' + z.cost : 'A coordinar'})</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="co-ref">Referencias de entrega (opcional)</label>
            <input type="text" id="co-ref" class="form-input" placeholder="Ej: Portón negro, timbre B, entre calles..." value="${state.checkoutData.manualAddress.references || ''}">
          </div>
        </div>

        <div class="modal-footer" style="padding-left:0;padding-right:0">
          <button type="button" class="btn btn--outline" id="btn-co-back-1">← Atrás</button>
          <button type="button" class="btn btn--primary" id="btn-co-next-2">Continuar a envío →</button>
        </div>
      `;

      // Eventos paso 2
      contentArea.querySelector('#btn-co-back-1').addEventListener('click', () => renderCheckoutStep(1));
      
      const rads = contentArea.querySelectorAll('input[name="co-saved-addr"]');
      rads.forEach(r => r.addEventListener('change', (e) => {
        state.checkoutData.selectedAddressId = e.target.value;
        const chosen = addresses.find(a => a.id === e.target.value);
        if (chosen) state.checkoutData.selectedZone = chosen.city;
        renderCheckoutStep(2);
      }));

      const addAddrBtn = contentArea.querySelector('#btn-add-addr-in-co');
      if (addAddrBtn) {
        addAddrBtn.addEventListener('click', () => {
          state.checkoutData.selectedAddressId = null;
          contentArea.querySelector('#co-manual-address-wrap').style.display = 'block';
        });
      }

      contentArea.querySelector('#btn-co-next-2').addEventListener('click', () => {
        if (!state.checkoutData.selectedAddressId) {
          const street = contentArea.querySelector('#co-street')?.value.trim();
          const number = contentArea.querySelector('#co-num')?.value.trim();
          const zone = contentArea.querySelector('#co-zone')?.value;
          if (!street || !number) {
            Toast.error('Completá calle y altura para el envío.');
            return;
          }
          state.checkoutData.manualAddress = {
            street,
            number,
            floorApt: contentArea.querySelector('#co-floor')?.value.trim(),
            city: zone,
            references: contentArea.querySelector('#co-ref')?.value.trim()
          };
          state.checkoutData.selectedZone = zone;
        }
        renderCheckoutStep(3);
      });
      break;

    case 3:
      // PASO 3: MODALIDAD DE ENTREGA
      contentArea.innerHTML = `
        <h3 class="modal-step-title">Paso 3: Modalidad de entrega</h3>
        <p class="text-muted" style="margin-bottom:1.5rem;font-size:0.875rem">Elegí cómo querés recibir o retirar tus productos.</p>

        <div style="display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem">
          <label style="display:flex;gap:1rem;padding:1.25rem;border:2px solid ${state.checkoutData.deliveryType === 'domicilio' ? 'var(--color-accent-500)' : 'var(--color-border)'};border-radius:var(--radius-lg);cursor:pointer;background:${state.checkoutData.deliveryType === 'domicilio' ? 'var(--color-accent-50)' : '#FFFFFF'}">
            <input type="radio" name="co-del-type" value="domicilio" ${state.checkoutData.deliveryType === 'domicilio' ? 'checked' : ''} style="margin-top:0.25rem">
            <div>
              <strong style="font-size:1.0625rem">🚚 Envío a domicilio</strong>
              <p style="font-size:0.875rem;color:var(--color-text-muted);margin:0.25rem 0">Entrega en ${state.checkoutData.selectedZone}. Coordinamos franja horaria por WhatsApp.</p>
              <span class="badge ${totals.isFreeShipping ? 'badge--oferta' : 'badge--combo'}">
                ${totals.isFreeShipping ? 'Envío Bonificado / Sin Cargo' : totals.shippingCost ? '$' + totals.shippingCost.toLocaleString('es-AR') : 'Costo a coordinar'}
              </span>
            </div>
          </label>

          <label style="display:flex;gap:1rem;padding:1.25rem;border:2px solid ${state.checkoutData.deliveryType === 'retiro' ? 'var(--color-accent-500)' : 'var(--color-border)'};border-radius:var(--radius-lg);cursor:pointer;background:${state.checkoutData.deliveryType === 'retiro' ? 'var(--color-accent-50)' : '#FFFFFF'}">
            <input type="radio" name="co-del-type" value="retiro" ${state.checkoutData.deliveryType === 'retiro' ? 'checked' : ''} style="margin-top:0.25rem">
            <div>
              <strong style="font-size:1.0625rem">🏬 Retiro en depósito Ituzaingó</strong>
              <p style="font-size:0.875rem;color:var(--color-text-muted);margin:0.25rem 0">Sin costo de envío. Te avisamos por WhatsApp apenas el pedido esté armado.</p>
              <span class="badge badge--nuevo">Sin Costo ($0)</span>
            </div>
          </label>
        </div>

        <div class="form-group">
          <label class="form-label" for="co-notes">Observaciones / Preferencia de horarios</label>
          <textarea id="co-notes" class="form-textarea" rows="2" placeholder="Ej: Entregar por la mañana, tocar timbre fuerte, o consultar stock de opciones.">${state.checkoutData.customerNotes || ''}</textarea>
        </div>

        <div class="modal-footer" style="padding-left:0;padding-right:0">
          <button type="button" class="btn btn--outline" id="btn-co-back-2">← Atrás</button>
          <button type="button" class="btn btn--primary" id="btn-co-next-3">Continuar a pago →</button>
        </div>
      `;

      contentArea.querySelector('#btn-co-back-2').addEventListener('click', () => renderCheckoutStep(2));
      
      const delRadios = contentArea.querySelectorAll('input[name="co-del-type"]');
      delRadios.forEach(r => r.addEventListener('change', (e) => {
        state.checkoutData.deliveryType = e.target.value;
        renderCheckoutStep(3);
      }));

      contentArea.querySelector('#btn-co-next-3').addEventListener('click', () => {
        state.checkoutData.customerNotes = contentArea.querySelector('#co-notes')?.value.trim() || '';
        renderCheckoutStep(4);
      });
      break;

    case 4:
      // PASO 4: MEDIO DE PAGO
      const cards = user ? PaymentService.getCards(user.id) : [];
      contentArea.innerHTML = `
        <h3 class="modal-step-title">Paso 4: Medio de pago preferido</h3>
        <p class="text-muted" style="margin-bottom:1.5rem;font-size:0.875rem">Elegí cómo abonarás tu compra al recibirla o confirmarla.</p>

        <div style="display:flex;flex-direction:column;gap:0.875rem;margin-bottom:1.5rem">
          ${STORE_CONFIG.paymentMethods.map(pm => `
            <label style="display:flex;align-items:flex-start;gap:1rem;padding:1rem;border:1.5px solid ${state.checkoutData.paymentMethod === pm.id ? 'var(--color-accent-500)' : 'var(--color-border)'};border-radius:var(--radius-md);cursor:pointer;background:${state.checkoutData.paymentMethod === pm.id ? 'var(--color-accent-50)' : '#FFFFFF'}">
              <input type="radio" name="co-pm" value="${pm.id}" ${state.checkoutData.paymentMethod === pm.id ? 'checked' : ''} style="margin-top:0.25rem">
              <div>
                <strong>${pm.name}</strong>
                <p style="font-size:0.8125rem;color:var(--color-text-muted);margin-top:0.15rem">${pm.desc}</p>
              </div>
            </label>
          `).join('')}
        </div>

        ${state.checkoutData.paymentMethod === 'tarjeta' ? `
          <div style="background:var(--color-bg-surface);padding:1.25rem;border-radius:var(--radius-lg);margin-bottom:1.25rem">
            <h4 style="font-size:0.9375rem;margin-bottom:0.75rem">Tarjetas registradas en tu billetera:</h4>
            ${cards.length > 0 ? `
              <div style="display:flex;flex-direction:column;gap:0.5rem">
                ${cards.map(c => `
                  <label style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:#FFFFFF;border:1px solid var(--color-border);border-radius:var(--radius-md)">
                    <input type="radio" name="co-saved-card" value="${c.id}" ${state.checkoutData.selectedCardId === c.id ? 'checked' : ''}>
                    <span>Tarjeta <strong>${c.brand.toUpperCase()}</strong> •••• ${c.last4} (${c.holderName})</span>
                  </label>
                `).join('')}
              </div>
            ` : `
              <p style="font-size:0.8125rem;color:var(--color-text-muted);margin-bottom:0.75rem">No tenés tarjetas agregadas.</p>
              <button type="button" class="btn btn--outline btn--sm" id="btn-add-card-in-co">+ Cargar tarjeta (Simulación segura)</button>
            `}
            <small style="display:block;margin-top:0.75rem;font-size:0.75rem;color:var(--color-text-subtle)">
              🔒 Arquitectura segura: No se cobra en línea de forma automática ni se guardan datos de CVV. El cobro se procesa al confirmar.
            </small>
          </div>
        ` : ''}

        <div class="modal-footer" style="padding-left:0;padding-right:0">
          <button type="button" class="btn btn--outline" id="btn-co-back-3">← Atrás</button>
          <button type="button" class="btn btn--primary" id="btn-co-next-4">Revisar pedido →</button>
        </div>
      `;

      contentArea.querySelector('#btn-co-back-3').addEventListener('click', () => renderCheckoutStep(3));
      
      const pmRadios = contentArea.querySelectorAll('input[name="co-pm"]');
      pmRadios.forEach(r => r.addEventListener('change', (e) => {
        state.checkoutData.paymentMethod = e.target.value;
        renderCheckoutStep(4);
      }));

      const addCardBtn = contentArea.querySelector('#btn-add-card-in-co');
      if (addCardBtn) {
        addCardBtn.addEventListener('click', () => {
          Modal.open('add-card-modal');
        });
      }

      contentArea.querySelector('#btn-co-next-4').addEventListener('click', () => {
        renderCheckoutStep(5);
      });
      break;

    case 5:
      // PASO 5: RESUMEN Y CONFIRMACIÓN
      const items = CartService.getItems();
      const currentTotals = CartService.getTotals(getZoneCost(state.checkoutData.selectedZone), state.checkoutData.deliveryType);
      
      let finalAddress = null;
      if (state.checkoutData.selectedAddressId && user) {
        finalAddress = AddressService.getAddresses(user.id).find(a => a.id === state.checkoutData.selectedAddressId);
      } else {
        finalAddress = state.checkoutData.manualAddress;
      }

      contentArea.innerHTML = `
        <h3 class="modal-step-title">Paso 5: Revisá tu pedido</h3>
        <p class="text-muted" style="margin-bottom:1.25rem;font-size:0.875rem">Verificá los detalles antes de generar tu pedido por WhatsApp.</p>

        <div style="background:var(--color-bg-surface);padding:1.25rem;border-radius:var(--radius-lg);margin-bottom:1.5rem">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem;font-size:0.875rem">
            <strong>Cliente:</strong>
            <span>${state.checkoutData.customer.firstName} ${state.checkoutData.customer.lastName} (${state.checkoutData.customer.phone})</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem;font-size:0.875rem">
            <strong>Modalidad:</strong>
            <span>${state.checkoutData.deliveryType === 'retiro' ? 'Retiro en depósito Ituzaingó' : 'Envío a domicilio'}</span>
          </div>
          ${state.checkoutData.deliveryType === 'domicilio' && finalAddress ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem;font-size:0.875rem">
              <strong>Dirección:</strong>
              <span>${finalAddress.street} ${finalAddress.number}, ${finalAddress.city}</span>
            </div>
          ` : ''}
          <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem;font-size:0.875rem">
            <strong>Medio de pago:</strong>
            <span style="text-transform:capitalize">${state.checkoutData.paymentMethod}</span>
          </div>
          ${state.checkoutData.customerNotes ? `
            <div style="display:flex;justify-content:space-between;font-size:0.875rem">
              <strong>Observaciones:</strong>
              <span>"${state.checkoutData.customerNotes}"</span>
            </div>
          ` : ''}
        </div>

        <h4 style="font-size:0.9375rem;margin-bottom:0.75rem">Resumen de productos (${currentTotals.totalUnits} unidades):</h4>
        <div style="max-height:180px;overflow-y:auto;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:0.75rem;margin-bottom:1.25rem">
          ${items.map(it => `
            <div style="display:flex;justify-content:space-between;font-size:0.8125rem;padding:0.35rem 0;border-bottom:1px solid var(--color-border)">
              <span>${it.name} × ${it.quantity}</span>
              <strong>$${(it.price * it.quantity).toLocaleString('es-AR')}</strong>
            </div>
          `).join('')}
        </div>

        <div style="border-top:2px solid var(--color-border);padding-top:1rem;margin-bottom:1.5rem">
          <div style="display:flex;justify-content:space-between;font-size:0.9375rem;margin-bottom:0.35rem">
            <span>Subtotal:</span>
            <span>$${currentTotals.subtotal.toLocaleString('es-AR')}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.9375rem;margin-bottom:0.5rem">
            <span>Costo de envío:</span>
            <span>${currentTotals.isFreeShipping ? '<strong class="text-success">Sin cargo</strong>' : currentTotals.shippingCost ? '$' + currentTotals.shippingCost.toLocaleString('es-AR') : 'A coordinar'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:1.35rem;font-weight:800;color:var(--color-primary-900)">
            <span>Total estimado:</span>
            <span class="text-accent">$${currentTotals.total.toLocaleString('es-AR')}</span>
          </div>
        </div>

        <div class="modal-footer" style="padding-left:0;padding-right:0">
          <button type="button" class="btn btn--outline" id="btn-co-back-4">← Modificar</button>
          <button type="button" class="btn btn--wa btn--lg" id="btn-co-confirm">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.3-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.6 6.6 0 0 1-2-1.2 7.3 7.3 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.4c.1-.1.2-.3.3-.4s.1-.3 0-.4-.5-1.3-.7-1.8-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8s2 3 4.8 4.2c.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 2-1.4s.2-1.3.1-1.4-.2-.1-.5-.2z"/></svg>
            Confirmar y Enviar por WhatsApp
          </button>
        </div>
      `;

      contentArea.querySelector('#btn-co-back-4').addEventListener('click', () => renderCheckoutStep(4));
      
      contentArea.querySelector('#btn-co-confirm').addEventListener('click', () => {
        // Crear orden
        const newOrder = OrdersService.createOrder({
          userId: user?.id || null,
          customer: state.checkoutData.customer,
          items: items,
          deliveryType: state.checkoutData.deliveryType,
          address: finalAddress,
          paymentMethod: state.checkoutData.paymentMethod,
          paymentCard: state.checkoutData.selectedCardId ? PaymentService.getCards(user?.id).find(c => c.id === state.checkoutData.selectedCardId) : null,
          customerNotes: state.checkoutData.customerNotes,
          totals: currentTotals
        });

        // Vaciar carrito
        CartService.clear();

        // Mostrar pantalla de éxito
        renderCheckoutSuccess(newOrder);
      });
      break;
  }
}

function getZoneCost(zoneName) {
  const z = STORE_CONFIG.deliveryZones.find(item => item.zone === zoneName);
  return z ? z.cost : 0;
}

function renderCheckoutSuccess(order) {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  const contentArea = modal.querySelector('#checkout-step-content');
  const waUrl = WhatsAppService.getOrderWhatsAppUrl(order);

  contentArea.innerHTML = `
    <div style="text-align:center;padding:1.5rem 0">
      <div style="width:72px;height:72px;border-radius:50%;background:var(--color-success-100);color:var(--color-success-600);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span class="badge badge--nuevo" style="margin-bottom:0.75rem">Pedido #${order.id} Registrado</span>
      <h2 style="font-size:1.75rem;margin-bottom:0.75rem">¡Tu pedido está preparado!</h2>
      <p style="color:var(--color-text-muted);max-width:440px;margin:0 auto 2rem;font-size:0.9375rem">
        Para finalizar, enviá el resumen automático a nuestro WhatsApp de atención mayorista al <strong>${STORE_CONFIG.whatsappVisible}</strong>.
      </p>

      <div style="display:flex;flex-direction:column;gap:0.75rem;max-width:380px;margin:0 auto">
        <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn--wa btn--lg btn--block" id="btn-open-wa-order">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.3-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.6 6.6 0 0 1-2-1.2 7.3 7.3 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.4c.1-.1.2-.3.3-.4s.1-.3 0-.4-.5-1.3-.7-1.8-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8s2 3 4.8 4.2c.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 2-1.4s.2-1.3.1-1.4-.2-.1-.5-.2z"/></svg>
          Enviar pedido por WhatsApp
        </a>
        <button type="button" class="btn btn--outline btn--block" id="btn-copy-wa-text">
          Copiar texto del pedido
        </button>
        <button type="button" class="btn btn--secondary btn--block" data-close-modal="checkout-modal">
          Volver a la tienda
        </button>
      </div>
    </div>
  `;

  contentArea.querySelector('#btn-copy-wa-text').addEventListener('click', () => {
    const text = WhatsAppService.buildOrderMessage(order);
    navigator.clipboard.writeText(text).then(() => {
      Toast.success('¡Texto del pedido copiado al portapapeles!');
    });
  });
}

// ============================================================
// 9. EVENT LISTENERS GENERALES
// ============================================================
function bindEventListeners() {
  // Delegación de clics globales
  document.addEventListener('click', (e) => {
    // Agregar producto directo
    const addProdBtn = e.target.closest('[data-action="add-product"]');
    if (addProdBtn) {
      e.preventDefault();
      const pid = addProdBtn.dataset.productId;
      const product = PRODUCT_BY_ID.get(pid);
      if (product) {
        CartService.addProduct(product, 1);
        Toast.success(`Agregaste "${product.name}" al pedido`);
      }
      return;
    }

    // Stepper Plus en card (Estilo DIA / Carrefour)
    const plusBtn = e.target.closest('[data-action="stepper-plus"]');
    if (plusBtn) {
      e.preventDefault();
      const pid = plusBtn.dataset.productId;
      const currentQty = getCartItemQty(pid);
      CartService.updateQuantity(`prod_${pid}`, currentQty + 1);
      return;
    }

    // Stepper Minus en card (Estilo DIA / Carrefour)
    const minusBtn = e.target.closest('[data-action="stepper-minus"]');
    if (minusBtn) {
      e.preventDefault();
      const pid = minusBtn.dataset.productId;
      const currentQty = getCartItemQty(pid);
      CartService.updateQuantity(`prod_${pid}`, currentQty - 1);
      return;
    }

    // Agregar combo directo
    const addComboBtn = e.target.closest('[data-action="add-combo"]');
    if (addComboBtn) {
      e.preventDefault();
      const cid = addComboBtn.dataset.comboId;
      const combo = COMBO_BY_ID.get(cid);
      if (combo) {
        CartService.addCombo(combo, 1);
        Toast.success(`Agregaste "${combo.name}" al pedido`);
      }
      return;
    }

    // Toggle Favorito
    const favBtn = e.target.closest('[data-action="toggle-fav"]');
    if (favBtn) {
      e.preventDefault();
      const pid = favBtn.dataset.productId;
      const user = AuthService.getCurrentUser();
      const added = FavoritesService.toggleFavorite(user?.id, pid);
      favBtn.classList.toggle('is-fav', added);
      const svg = favBtn.querySelector('svg');
      if (svg) svg.setAttribute('fill', added ? 'currentColor' : 'none');
      Toast.show({
        message: added ? 'Agregado a favoritos' : 'Eliminado de favoritos',
        type: added ? 'success' : 'info'
      });
      return;
    }

    // Vista rápida de producto
    const qvBtn = e.target.closest('[data-action="quick-view"]');
    if (qvBtn) {
      e.preventDefault();
      const pid = qvBtn.dataset.productId;
      QuickView.open(pid);
      return;
    }

    // Ver desglose de combo
    const viewComboBtn = e.target.closest('[data-action="view-combo-details"]');
    if (viewComboBtn) {
      e.preventDefault();
      const cid = viewComboBtn.dataset.comboId;
      openComboDetailsModal(cid);
      return;
    }

    // Botones de Carrito en Drawer
    const cartMinus = e.target.closest('[data-action="cart-minus"]');
    if (cartMinus) {
      const it = CartService.getItems().find(i => i.id === cartMinus.dataset.itemId);
      if (it) CartService.updateQuantity(it.id, it.quantity - 1);
      return;
    }

    const cartPlus = e.target.closest('[data-action="cart-plus"]');
    if (cartPlus) {
      const it = CartService.getItems().find(i => i.id === cartPlus.dataset.itemId);
      if (it) CartService.updateQuantity(it.id, it.quantity + 1);
      return;
    }

    const cartRemove = e.target.closest('[data-action="cart-remove"]');
    if (cartRemove) {
      CartService.removeItem(cartRemove.dataset.itemId);
      Toast.info('Producto eliminado del pedido');
      return;
    }

    // Click en botón de cuenta / perfil
    if (e.target.closest('#header-btn-account') || e.target.closest('#mobile-nav-account')) {
      e.preventDefault();
      if (AuthService.isAuthenticated()) {
        openProfileModal();
      } else {
        Modal.open('login-modal');
      }
      return;
    }

    // Click en botón de favoritos del header
    if (e.target.closest('#header-btn-fav') || e.target.closest('#mobile-nav-fav')) {
      e.preventDefault();
      openFavoritesModal();
      return;
    }

    // Filtros de sección en pills y barra rápida de supermercado
    const pill = e.target.closest('.pill-btn, .dept-chip[data-section-filter]');
    if (pill) {
      const section = pill.dataset.section || pill.dataset.sectionFilter;
      if (section) {
        document.querySelectorAll('.pill-btn, .dept-chip[data-section-filter]').forEach(p => {
          const s = p.dataset.section || p.dataset.sectionFilter;
          p.classList.toggle('is-active', s === section);
        });
        state.selectedSection = section;
        state.selectedCategory = 'todas';
        renderCatalog();
        if (pill.classList.contains('dept-chip')) {
          const catSection = document.getElementById('catalogo');
          if (catSection) catSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
      return;
    }
  });

  // Botón de favoritos en barra inferior móvil
  const mobFavBtn = document.getElementById('mobile-nav-fav-btn');
  if (mobFavBtn) {
    mobFavBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const favHeaderBtn = document.getElementById('header-btn-fav');
      if (favHeaderBtn) favHeaderBtn.click();
    });
  }

  // Búsqueda en tiempo real con debounce y botón limpiar
  const searchInput = document.getElementById('catalog-search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.classList.toggle('is-visible', val.length > 0);
      }
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        state.searchQuery = val;
        renderCatalog();
        if (val.trim().length > 1) {
          const catSection = document.getElementById('catalogo');
          if (catSection && window.scrollY < 200) {
            catSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 200);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const catSection = document.getElementById('catalogo');
        if (catSection) catSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.classList.remove('is-visible');
        state.searchQuery = '';
        renderCatalog();
        searchInput.focus();
      });
    }
  }

  // Ordenamiento select
  const sortSelect = document.getElementById('catalog-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderCatalog();
    });
  }

  // Filtro por badge
  const badgeSelect = document.getElementById('catalog-badge-filter');
  if (badgeSelect) {
    badgeSelect.addEventListener('change', (e) => {
      state.filterBadge = e.target.value;
      renderCatalog();
    });
  }

  // Formulario de Login
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('#login-email').value;
      const pass = loginForm.querySelector('#login-pass').value;
      try {
        const user = AuthService.login({ email, password: pass });
        Toast.success(`¡Bienvenido/a, ${user.firstName}!`);
        Modal.close('login-modal');
      } catch (err) {
        Toast.error(err.message);
      }
    });

    const demoLoginBtn = loginForm.querySelector('#btn-login-demo');
    if (demoLoginBtn) {
      demoLoginBtn.addEventListener('click', () => {
        try {
          const user = AuthService.login({ email: 'carolina@adminya.com.ar', password: 'demo123' });
          Toast.success(`¡Ingresaste como ${user.firstName} (Usuario de demostración)!`);
          Modal.close('login-modal');
        } catch (err) {
          Toast.error(err.message);
        }
      });
    }

    const openRegisterLink = loginForm.querySelector('#link-open-register');
    if (openRegisterLink) {
      openRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        Modal.close('login-modal');
        Modal.open('register-modal');
      });
    }

    const forgotPassLink = loginForm.querySelector('#link-forgot-pass');
    if (forgotPassLink) {
      forgotPassLink.addEventListener('click', (e) => {
        e.preventDefault();
        Modal.close('login-modal');
        Modal.open('forgot-pass-modal');
      });
    }
  }

  // Formulario de Registro
  const registerForm = document.getElementById('form-register');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const user = AuthService.register({
          firstName: registerForm.querySelector('#reg-name').value,
          lastName: registerForm.querySelector('#reg-lastname').value,
          email: registerForm.querySelector('#reg-email').value,
          phone: registerForm.querySelector('#reg-phone').value,
          password: registerForm.querySelector('#reg-pass').value,
          confirmPassword: registerForm.querySelector('#reg-confirm-pass').value
        });
        Toast.success(`¡Cuenta creada con éxito! Bienvenido/a, ${user.firstName}.`);
        Modal.close('register-modal');
      } catch (err) {
        Toast.error(err.message);
      }
    });

    const backToLoginLink = registerForm.querySelector('#link-back-to-login');
    if (backToLoginLink) {
      backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        Modal.close('register-modal');
        Modal.open('login-modal');
      });
    }
  }

  // Formulario de Recuperación de Contraseña
  const forgotForm = document.getElementById('form-forgot-pass');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = forgotForm.querySelector('#forgot-email').value;
      try {
        const res = AuthService.recoverPassword(email);
        Toast.success(res.message);
        Modal.close('forgot-pass-modal');
      } catch (err) {
        Toast.error(err.message);
      }
    });
  }

  // Modal de Agregar Tarjeta (Simulación segura)
  const addCardForm = document.getElementById('form-add-card');
  if (addCardForm) {
    const cardNumInput = addCardForm.querySelector('#card-number');
    const brandPreview = addCardForm.querySelector('.card-preview-brand');
    const numPreview = addCardForm.querySelector('.card-preview-number');
    const holderInput = addCardForm.querySelector('#card-holder');
    const holderPreview = addCardForm.querySelector('.card-preview-holder');
    const monthSelect = addCardForm.querySelector('#card-month');
    const yearSelect = addCardForm.querySelector('#card-year');
    const expiryPreview = addCardForm.querySelector('.card-preview-expiry');

    // Detección en vivo
    cardNumInput.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '').substring(0, 16);
      e.target.value = val.replace(/(\d{4})/g, '$1 ').trim();
      const brand = PaymentService.detectCardBrand(val);
      if (brandPreview) brandPreview.textContent = brand.toUpperCase();
      if (numPreview) numPreview.textContent = val ? val.padEnd(16, '•').replace(/(\d{4}|\•{4})/g, '$1 ') : '•••• •••• •••• ••••';
    });

    holderInput.addEventListener('input', (e) => {
      if (holderPreview) holderPreview.textContent = e.target.value || 'NOMBRE Y APELLIDO';
    });

    const updateExpiryPreview = () => {
      const m = monthSelect.value || 'MM';
      const y = yearSelect.value ? yearSelect.value.slice(-2) : 'AA';
      if (expiryPreview) expiryPreview.textContent = `${m}/${y}`;
    };
    monthSelect.addEventListener('change', updateExpiryPreview);
    yearSelect.addEventListener('change', updateExpiryPreview);

    addCardForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = AuthService.getCurrentUser();
      if (!user) {
        Toast.error('Iniciá sesión para guardar una tarjeta en tu billetera.');
        return;
      }
      try {
        PaymentService.addCard(user.id, {
          rawNumber: cardNumInput.value,
          holderName: holderInput.value,
          expiryMonth: monthSelect.value,
          expiryYear: yearSelect.value,
          isDefault: addCardForm.querySelector('#card-default')?.checked || false
        });
        Toast.success('¡Tarjeta guardada de forma segura en tu billetera!');
        Modal.close('add-card-modal');
        renderSavedCardsInProfile();
      } catch (err) {
        Toast.error(err.message);
      }
    });
  }

  // Modal de Agregar Dirección
  const addAddrForm = document.getElementById('form-add-address');
  if (addAddrForm) {
    addAddrForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = AuthService.getCurrentUser();
      if (!user) {
        Toast.error('Iniciá sesión para guardar una dirección.');
        return;
      }
      try {
        AddressService.addAddress(user.id, {
          name: addAddrForm.querySelector('#addr-name').value,
          street: addAddrForm.querySelector('#addr-street').value,
          number: addAddrForm.querySelector('#addr-number').value,
          floorApt: addAddrForm.querySelector('#addr-floor').value,
          city: addAddrForm.querySelector('#addr-city').value,
          postalCode: addAddrForm.querySelector('#addr-cp').value,
          references: addAddrForm.querySelector('#addr-ref').value,
          isDefault: addAddrForm.querySelector('#addr-default')?.checked || false
        });
        Toast.success('Dirección guardada exitosamente.');
        Modal.close('add-address-modal');
        renderSavedAddressesInProfile();
      } catch (err) {
        Toast.error(err.message);
      }
    });
  }

  // Logout desde perfil
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AuthService.logout();
      Toast.info('Cerraste tu sesión.');
      Modal.close('profile-modal');
    });
  }

  // Links del footer
  const fLogin = document.getElementById('footer-link-login');
  if (fLogin) fLogin.addEventListener('click', (e) => {
    e.preventDefault();
    if (AuthService.isAuthenticated()) openProfileModal();
    else Modal.open('login-modal');
  });

  const fOrders = document.getElementById('footer-link-orders');
  if (fOrders) fOrders.addEventListener('click', (e) => {
    e.preventDefault();
    if (AuthService.isAuthenticated()) openProfileModal();
    else Modal.open('login-modal');
  });

  const fFavs = document.getElementById('footer-link-favs');
  if (fFavs) fFavs.addEventListener('click', (e) => {
    e.preventDefault();
    openFavoritesModal();
  });

  // Botón cuenta en menú móvil
  const mobileAcct = document.getElementById('mobile-nav-account');
  if (mobileAcct) {
    mobileAcct.addEventListener('click', () => {
      Drawer.close('mobile-drawer');
      if (AuthService.isAuthenticated()) openProfileModal();
      else Modal.open('login-modal');
    });
  }
}

// ============================================================
// 10. MODAL DE DETALLE DE COMBO
// ============================================================
function openComboDetailsModal(comboId) {
  const combo = COMBO_BY_ID.get(comboId);
  if (!combo) return;

  const modal = document.getElementById('combo-details-modal');
  if (!modal) return;

  const body = modal.querySelector('.combo-details-body');
  body.innerHTML = `
    <div style="margin-bottom:1.5rem">
      <span class="badge badge--combo" style="margin-bottom:0.5rem">${combo.badge}</span>
      <h2 style="font-size:1.5rem;margin-bottom:0.5rem">${combo.name}</h2>
      <p class="text-muted" style="font-size:0.875rem">${combo.description}</p>
      
      <div style="display:flex;align-items:baseline;gap:0.75rem;margin:1rem 0">
        <span style="font-size:1.75rem;font-weight:800;color:var(--color-primary-900)">$${combo.price.toLocaleString('es-AR')}</span>
        <span style="font-size:1rem;color:var(--color-text-light);text-decoration:line-through">$${combo.oldPrice.toLocaleString('es-AR')}</span>
        <span class="badge badge--oferta">Ahorrás $${combo.savingARS.toLocaleString('es-AR')}</span>
      </div>
    </div>

    <h3 style="font-size:1rem;font-weight:700;margin-bottom:0.75rem;border-bottom:1px solid var(--color-border);padding-bottom:0.5rem">
      Productos incluidos (${combo.totalUnits} unidades en total):
    </h3>

    <div style="max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:0.5rem">
      ${combo.items.map(it => `
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem;background:var(--color-bg-surface);border-radius:var(--radius-md)">
          <img src="${it.image}" alt="${it.name}" style="width:36px;height:36px;object-fit:contain">
          <div style="flex:1">
            <strong style="font-size:0.875rem">${it.name}</strong>
            <div style="font-size:0.75rem;color:var(--color-text-muted)">Cantidad: ${it.quantity} ${it.unit} ($${it.unitPrice.toLocaleString('es-AR')} c/u)</div>
          </div>
          <span style="font-weight:700;font-size:0.875rem">$${it.subtotal.toLocaleString('es-AR')}</span>
        </div>
      `).join('')}
    </div>

    <div class="modal-footer" style="padding-left:0;padding-right:0;margin-top:1.5rem">
      <button type="button" class="btn btn--outline" data-close-modal="combo-details-modal">Cerrar</button>
      <button type="button" class="btn btn--primary" id="btn-modal-add-combo" data-combo-id="${combo.id}">
        Agregar combo al pedido
      </button>
    </div>
  `;

  body.querySelector('#btn-modal-add-combo').addEventListener('click', () => {
    CartService.addCombo(combo, 1);
    Toast.success(`Agregaste "${combo.name}" al carrito`);
    Modal.close('combo-details-modal');
  });

  Modal.open('combo-details-modal');
}

// ============================================================
// 11. MODAL DE MI PERFIL Y CUENTA
// ============================================================
function openProfileModal() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const modal = document.getElementById('profile-modal');
  if (!modal) return;

  modal.querySelector('#profile-user-name').textContent = `${user.firstName} ${user.lastName}`;
  modal.querySelector('#profile-user-email').textContent = user.email;

  renderSavedAddressesInProfile();
  renderSavedCardsInProfile();
  renderOrdersInProfile();

  Modal.open('profile-modal');
}

function renderSavedAddressesInProfile() {
  const container = document.getElementById('profile-addresses-list');
  if (!container) return;

  const user = AuthService.getCurrentUser();
  if (!user) return;

  const addresses = AddressService.getAddresses(user.id);
  if (addresses.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size:0.875rem">No tenés direcciones guardadas.</p>`;
    return;
  }

  container.innerHTML = addresses.map(a => `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-md);margin-bottom:0.5rem">
      <div>
        <strong>${a.name}</strong> ${a.isDefault ? '<span class="badge badge--nuevo" style="font-size:0.6rem">Predeterminada</span>' : ''}
        <div style="font-size:0.8125rem;color:var(--color-text-muted)">${a.street} ${a.number} ${a.floorApt ? `(${a.floorApt})` : ''}, ${a.city}</div>
        ${a.references ? `<div style="font-size:0.75rem;color:var(--color-text-subtle)">${a.references}</div>` : ''}
      </div>
      <button class="btn btn--outline btn--sm text-danger" data-action="delete-address" data-address-id="${a.id}">Eliminar</button>
    </div>
  `).join('');

  container.querySelectorAll('[data-action="delete-address"]').forEach(b => {
    b.addEventListener('click', () => {
      AddressService.deleteAddress(user.id, b.dataset.addressId);
      Toast.info('Dirección eliminada');
      renderSavedAddressesInProfile();
    });
  });
}

function renderSavedCardsInProfile() {
  const container = document.getElementById('profile-cards-list');
  if (!container) return;

  const user = AuthService.getCurrentUser();
  if (!user) return;

  const cards = PaymentService.getCards(user.id);
  if (cards.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size:0.875rem">No tenés tarjetas agregadas a tu billetera.</p>`;
    return;
  }

  container.innerHTML = cards.map(c => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-md);margin-bottom:0.5rem">
      <div>
        <strong>${c.brand.toUpperCase()}</strong> terminada en •••• ${c.last4}
        <div style="font-size:0.75rem;color:var(--color-text-subtle)">Titular: ${c.holderName} · Vence: ${c.expiry}</div>
      </div>
      <button class="btn btn--outline btn--sm text-danger" data-action="delete-card" data-card-id="${c.id}">Eliminar</button>
    </div>
  `).join('');

  container.querySelectorAll('[data-action="delete-card"]').forEach(b => {
    b.addEventListener('click', () => {
      PaymentService.deleteCard(user.id, b.dataset.cardId);
      Toast.info('Tarjeta eliminada de tu billetera');
      renderSavedCardsInProfile();
    });
  });
}

function renderOrdersInProfile() {
  const container = document.getElementById('profile-orders-list');
  if (!container) return;

  const user = AuthService.getCurrentUser();
  if (!user) return;

  const orders = OrdersService.getOrders(user.id);
  if (orders.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size:0.875rem">Todavía no realizaste pedidos con esta cuenta.</p>`;
    return;
  }

  container.innerHTML = orders.map(o => `
    <div style="border:1px solid var(--color-border);border-radius:var(--radius-md);padding:1rem;margin-bottom:0.75rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
        <strong>Pedido #${o.id}</strong>
        <span class="badge badge--combo">${o.status}</span>
      </div>
      <div style="font-size:0.8125rem;color:var(--color-text-muted);margin-bottom:0.5rem">
        Fecha: ${new Date(o.createdAt).toLocaleDateString('es-AR')} · Total: <strong>$${o.totals.total.toLocaleString('es-AR')}</strong> (${o.totals.totalUnits} un.)
      </div>
      <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
        <button type="button" class="btn btn--primary btn--sm" data-action="reorder" data-order-id="${o.id}">
          Volver a comprar
        </button>
        <a href="${WhatsAppService.getOrderWhatsAppUrl(o)}" target="_blank" rel="noopener" class="btn btn--wa btn--sm">
          Reenviar por WhatsApp
        </a>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-action="reorder"]').forEach(b => {
    b.addEventListener('click', () => {
      OrdersService.repeatOrder(b.dataset.orderId);
      Toast.success('¡Productos cargados al carrito con éxito!');
      Modal.close('profile-modal');
      Drawer.open('cart-drawer');
    });
  });
}

// ============================================================
// 12. MODAL DE FAVORITOS
// ============================================================
function openFavoritesModal() {
  const user = AuthService.getCurrentUser();
  const favIds = FavoritesService.getFavorites(user?.id);
  const modal = document.getElementById('favorites-modal');
  if (!modal) return;

  const body = modal.querySelector('.favorites-modal-body');
  if (favIds.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <h3 class="empty-state-title">No tenés favoritos guardados</h3>
        <p class="empty-state-desc">Tocá el corazón en cualquier producto para guardarlo acá y volver a comprarlo cuando quieras.</p>
      </div>
    `;
  } else {
    const prods = favIds.map(id => PRODUCT_BY_ID.get(id)).filter(Boolean);
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.75rem;max-height:360px;overflow-y:auto">
        ${prods.map(p => `
          <div style="display:flex;align-items:center;gap:0.875rem;padding:0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-md)">
            <img src="${p.image}" alt="${p.name}" style="width:48px;height:48px;object-fit:contain">
            <div style="flex:1">
              <strong style="font-size:0.875rem">${p.name}</strong>
              <div style="font-size:0.8125rem;color:var(--color-text-muted)">$${p.price.toLocaleString('es-AR')}</div>
            </div>
            <button class="btn btn--primary btn--sm" data-action="add-product" data-product-id="${p.id}">Agregar</button>
            <button class="btn btn--outline btn--sm text-danger" data-action="toggle-fav" data-product-id="${p.id}">×</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  Modal.open('favorites-modal');
}
