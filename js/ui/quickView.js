/**
 * QUICK VIEW — Vista rápida interactiva de producto o combo
 */
import { Modal } from './modal.js';
import { Drawer } from './drawer.js';
import { CartService } from '../services/cartService.js';
import { FavoritesService } from '../services/favoritesService.js';
import { AuthService } from '../services/authService.js';
import { Toast } from './toast.js';
import { PRODUCT_BY_ID } from '../data/catalog.js';

export const QuickView = {
  open(productId) {
    const product = PRODUCT_BY_ID.get(productId);
    if (!product) return;

    const modal = document.getElementById('quick-view-modal');
    if (!modal) return;

    const modalBody = modal.querySelector('.quick-view-body');
    const user = AuthService.getCurrentUser();
    const isFav = FavoritesService.isFavorite(user?.id, product.id);

    const priceFormatted = '$' + product.price.toLocaleString('es-AR');
    const oldPriceFormatted = product.oldPrice ? '$' + product.oldPrice.toLocaleString('es-AR') : '';
    const unitLabel = product.unit === 'kg' ? 'el kg' : 'por unidad';

    modalBody.innerHTML = `
      <div class="qv-grid">
        <div class="qv-image-box">
          <img src="${product.image}" alt="${product.name}" class="qv-img" loading="lazy">
          ${product.badge ? `<span class="badge badge--${product.badge.toLowerCase().replace(/\s+/g, '-')} qv-badge">${product.badge}</span>` : ''}
        </div>
        <div class="qv-info">
          <div class="qv-header">
            <span class="qv-category">${product.section} · ${product.category}</span>
            <span class="qv-brand">${product.brand}</span>
          </div>
          <h2 class="qv-title">${product.name}</h2>
          <div class="qv-pricing">
            <span class="qv-price">${priceFormatted}</span>
            <span class="qv-unit">/ ${unitLabel}</span>
            ${product.oldPrice ? `<span class="qv-old-price">${oldPriceFormatted}</span>` : ''}
          </div>
          ${product.oldPrice ? `<div class="qv-saving-tag">Ahorrás $${(product.oldPrice - product.price).toLocaleString('es-AR')} comprando a precio mayorista</div>` : ''}
          
          <p class="qv-desc">${product.description}</p>
          ${product.note ? `<p class="qv-note"><strong>Nota:</strong> ${product.note}</p>` : ''}

          ${product.hasOptions ? `
            <div class="qv-field">
              <label for="qv-options" class="form-label">Variedad / Sabor / Marca preferida (opcional):</label>
              <input type="text" id="qv-options" class="form-input" placeholder="Ej: Fideos tirabuzón / Atún al natural">
              <small class="form-help">Si no lo aclarás ahora, lo coordinamos al confirmar por WhatsApp.</small>
            </div>
          ` : ''}

          <div class="qv-actions">
            <div class="qty-selector" aria-label="Cantidad">
              <button type="button" class="qty-btn" id="qv-minus" aria-label="Disminuir cantidad">-</button>
              <input type="number" id="qv-qty" class="qty-input" value="1" min="1" max="999" aria-label="Cantidad a comprar">
              <button type="button" class="qty-btn" id="qv-plus" aria-label="Aumentar cantidad">+</button>
            </div>
            <button type="button" class="btn btn--primary btn--lg qv-add-btn" id="qv-add-cart">
              <svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Agregar al carrito
            </button>
            <button type="button" class="btn btn--secondary btn--icon qv-fav-btn ${isFav ? 'is-fav' : ''}" id="qv-fav" aria-label="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
              <svg class="icon" viewBox="0 0 24 24" width="22" height="22" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // Conectar eventos internos
    const minusBtn = modalBody.querySelector('#qv-minus');
    const plusBtn = modalBody.querySelector('#qv-plus');
    const qtyInput = modalBody.querySelector('#qv-qty');
    const addBtn = modalBody.querySelector('#qv-add-cart');
    const favBtn = modalBody.querySelector('#qv-fav');
    const optionsInput = modalBody.querySelector('#qv-options');

    minusBtn.addEventListener('click', () => {
      const current = parseInt(qtyInput.value, 10) || 1;
      if (current > 1) qtyInput.value = current - 1;
    });

    plusBtn.addEventListener('click', () => {
      const current = parseInt(qtyInput.value, 10) || 1;
      qtyInput.value = current + 1;
    });

    addBtn.addEventListener('click', () => {
      const qty = parseInt(qtyInput.value, 10) || 1;
      const opts = optionsInput ? optionsInput.value.trim() : '';
      CartService.addProduct(product, qty, opts);
      Toast.success(`Agregaste ${qty} × ${product.name} al carrito`);
      Modal.close('quick-view-modal');
      Drawer.open('cart-drawer');
      const drawerBody = document.getElementById('cart-drawer-items');
      if (drawerBody) {
        drawerBody.classList.add('scroll-flash');
        setTimeout(() => drawerBody.classList.remove('scroll-flash'), 1200);
        setTimeout(() => {
          const itemEl = drawerBody.querySelector(`[data-item-id="prod_${product.id}"]`);
          if (itemEl) {
            itemEl.classList.add('cart-item--new');
            itemEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => itemEl.classList.remove('cart-item--new'), 1500);
          }
        }, 120);
      }
    });

    favBtn.addEventListener('click', () => {
      const added = FavoritesService.toggleFavorite(user?.id, product.id);
      favBtn.classList.toggle('is-fav', added);
      favBtn.querySelector('svg').setAttribute('fill', added ? 'currentColor' : 'none');
      if (added) {
        Toast.success(`Agregaste "${product.name}" a tus favoritos`);
      } else {
        Toast.info(`Quitaste "${product.name}" de tus favoritos`);
      }
    });

    Modal.open('quick-view-modal');
  }
};
