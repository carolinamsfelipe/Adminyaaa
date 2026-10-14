/**
 * STORAGE SERVICE — Abstracción de persistencia segura local
 */
export const StorageService = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`mayorista_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Error reading localStorage key ${key}`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`mayorista_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Error writing localStorage key ${key}`, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(`mayorista_${key}`);
      return true;
    } catch (e) {
      console.warn(`Error removing localStorage key ${key}`, e);
      return false;
    }
  }
};
