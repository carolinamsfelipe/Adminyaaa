/**
 * FAVORITES SERVICE — Gestión de productos favoritos
 */
import { StorageService } from './storageService.js';

const FAVORITES_KEY_PREFIX = 'favorites_';
const listeners = new Set();

export const FavoritesService = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  notify() {
    listeners.forEach(fn => fn());
  },

  _getKey(userId) {
    return `${FAVORITES_KEY_PREFIX}${userId || 'guest'}`;
  },

  getFavorites(userId) {
    return StorageService.get(this._getKey(userId), []);
  },

  isFavorite(userId, productId) {
    const list = this.getFavorites(userId);
    return list.includes(productId);
  },

  toggleFavorite(userId, productId) {
    const key = this._getKey(userId);
    let list = StorageService.get(key, []);
    let isAdded = false;

    if (list.includes(productId)) {
      list = list.filter(id => id !== productId);
      isAdded = false;
    } else {
      list.push(productId);
      isAdded = true;
    }

    StorageService.set(key, list);
    this.notify();
    return isAdded;
  }
};
