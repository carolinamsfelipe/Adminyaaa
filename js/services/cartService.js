/**
 * CART SERVICE — Motor del carrito de compras mayorista
 */
import { StorageService } from './storageService.js';
import { STORE_CONFIG } from '../config.js';

const CART_KEY = 'cart';
const listeners = new Set();

export const CartService = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  notify() {
    const totals = this.getTotals();
    const items = this.getItems();
    listeners.forEach(fn => fn({ items, totals }));
  },

  getItems() {
    return StorageService.get(CART_KEY, []);
  },

  _saveItems(items) {
    StorageService.set(CART_KEY, items);
    this.notify();
  },

  addProduct(product, quantity = 1, optionsNote = '') {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const items = this.getItems();
    const itemId = `prod_${product.id}`;

    const existingIndex = items.findIndex(it => it.id === itemId);
    if (existingIndex > -1) {
      items[existingIndex].quantity += qty;
      if (optionsNote) items[existingIndex].optionsNote = optionsNote;
    } else {
      items.push({
        id: itemId,
        type: 'product',
        productId: product.id,
        name: product.name,
        brand: product.brand,
        unit: product.unit || 'un.',
        price: product.price,
        oldPrice: product.oldPrice || null,
        image: product.image,
        badge: product.badge,
        quantity: qty,
        optionsNote: optionsNote || ''
      });
    }

    this._saveItems(items);
    return items;
  },

  addCombo(combo, quantity = 1) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const items = this.getItems();
    const itemId = `combo_${combo.id}`;

    const existingIndex = items.findIndex(it => it.id === itemId);
    if (existingIndex > -1) {
      items[existingIndex].quantity += qty;
    } else {
      items.push({
        id: itemId,
        type: 'combo',
        comboId: combo.id,
        name: combo.name,
        brand: 'Combo Mayorista',
        unit: 'combo',
        price: combo.price,
        oldPrice: combo.oldPrice,
        image: combo.image,
        badge: combo.badge,
        totalUnitsInCombo: combo.totalUnits || combo.items?.length || 1,
        itemsBreakdown: combo.items || [],
        quantity: qty,
        optionsNote: ''
      });
    }

    this._saveItems(items);
    return items;
  },

  updateQuantity(itemId, quantity) {
    let items = this.getItems();
    const qty = parseInt(quantity, 10);

    if (qty <= 0) {
      items = items.filter(it => it.id !== itemId);
    } else {
      const item = items.find(it => it.id === itemId);
      if (item) item.quantity = qty;
    }

    this._saveItems(items);
  },

  removeItem(itemId) {
    let items = this.getItems();
    items = items.filter(it => it.id !== itemId);
    this._saveItems(items);
  },

  clear() {
    this._saveItems([]);
  },

  getTotals(zoneCost = 0, deliveryType = 'domicilio') {
    const items = this.getItems();
    let subtotal = 0;
    let savings = 0;
    let totalUnits = 0;

    items.forEach(it => {
      const lineSub = it.price * it.quantity;
      subtotal += lineSub;

      if (it.oldPrice && it.oldPrice > it.price) {
        savings += (it.oldPrice - it.price) * it.quantity;
      }

      if (it.type === 'combo') {
        totalUnits += (it.totalUnitsInCombo || 1) * it.quantity;
      } else {
        totalUnits += it.quantity;
      }
    });

    let effectiveShipping = 0;
    if (deliveryType === 'retiro') {
      effectiveShipping = 0;
    } else if (zoneCost !== null) {
      // Envío gratis si supera el umbral bonificado o si la zona es costo 0 (Ituzaingó)
      if (zoneCost === 0 || (STORE_CONFIG.freeShippingMinARS && subtotal >= STORE_CONFIG.freeShippingMinARS)) {
        effectiveShipping = 0;
      } else {
        effectiveShipping = zoneCost;
      }
    } else {
      effectiveShipping = null; // A coordinar
    }

    const grandTotal = effectiveShipping !== null ? subtotal + effectiveShipping : subtotal;

    return {
      subtotal,
      savings,
      shippingCost: effectiveShipping,
      isFreeShipping: effectiveShipping === 0,
      total: grandTotal,
      totalUnits,
      itemCount: items.length
    };
  }
};
