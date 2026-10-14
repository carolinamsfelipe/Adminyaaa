/**
 * PAYMENT SERVICE — Abstracción segura de tarjetas y billetera
 * 
 * NOTA DE SEGURIDAD ARQUITECTÓNICA:
 * Cumpliendo estrictamente las directivas de seguridad PCI-DSS y las indicaciones del proyecto:
 * 1. NUNCA se almacena el código de seguridad (CVV/CVC).
 * 2. NUNCA se persiste el número de tarjeta completo en texto plano.
 * 3. Se almacenan ÚNICAMENTE los últimos 4 dígitos y la marca detectada para propósitos de visualización.
 * 4. Preparado para que en fase productiva reciba el card_token generado directamente por Mercado Pago SDK.
 * 5. La aplicación actual opera como tomadora de pedidos mayoristas por WhatsApp; no efectúa cargos reales con tarjeta.
 */
import { StorageService } from './storageService.js';

const CARDS_KEY = 'user_cards';

export const PaymentService = {
  detectCardBrand(number) {
    const clean = String(number).replace(/\D/g, '');
    if (/^4/.test(clean)) return 'visa';
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^(6042|6043|6044|5896)/.test(clean)) return 'cabal';
    return 'generic';
  },

  getCards(userId) {
    if (!userId) return [];
    const all = StorageService.get(CARDS_KEY, {});
    return all[userId] || [];
  },

  getDefaultCard(userId) {
    const cards = this.getCards(userId);
    return cards.find(c => c.isDefault) || cards[0] || null;
  },

  /**
   * Guarda de forma segura una tarjeta tokenizable:
   * Solo persiste brand, last4, titular y vencimiento.
   */
  addCard(userId, { rawNumber, holderName, expiryMonth, expiryYear, isDefault = false }) {
    if (!userId) throw new Error('Usuario no identificado.');
    const clean = String(rawNumber).replace(/\D/g, '');

    if (clean.length < 13 || clean.length > 19) {
      throw new Error('Ingresá un número de tarjeta válido (13 a 19 dígitos).');
    }
    if (!holderName || holderName.trim().length < 4) {
      throw new Error('Ingresá el nombre completo tal como figura en el plástico.');
    }
    const month = parseInt(expiryMonth, 10);
    const year = parseInt(expiryYear, 10);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (!month || month < 1 || month > 12) {
      throw new Error('Mes de vencimiento inválido.');
    }
    if (!year || year < currentYear || (year === currentYear && month < currentMonth)) {
      throw new Error('La tarjeta se encuentra vencida.');
    }

    const brand = this.detectCardBrand(clean);
    const last4 = clean.slice(-4);

    const all = StorageService.get(CARDS_KEY, {});
    const userCards = all[userId] || [];

    const shouldBeDefault = isDefault || userCards.length === 0;
    if (shouldBeDefault) {
      userCards.forEach(c => c.isDefault = false);
    }

    const newCard = {
      id: 'card_' + Date.now(),
      brand,
      last4,
      holderName: holderName.trim().toUpperCase(),
      expiry: `${String(month).padStart(2, '0')}/${String(year).padStart(2, '0')}`,
      isDefault: shouldBeDefault,
      tokenMock: 'tok_mp_' + Math.random().toString(36).substring(2, 12), // Preparado para gateway
      createdAt: new Date().toISOString()
    };

    userCards.push(newCard);
    all[userId] = userCards;
    StorageService.set(CARDS_KEY, all);

    return newCard;
  },

  deleteCard(userId, cardId) {
    const all = StorageService.get(CARDS_KEY, {});
    let userCards = all[userId] || [];
    const deletedWasDefault = userCards.find(c => c.id === cardId)?.isDefault;

    userCards = userCards.filter(c => c.id !== cardId);
    if (deletedWasDefault && userCards.length > 0) {
      userCards[0].isDefault = true;
    }

    all[userId] = userCards;
    StorageService.set(CARDS_KEY, all);
    return true;
  },

  setDefaultCard(userId, cardId) {
    const all = StorageService.get(CARDS_KEY, {});
    const userCards = all[userId] || [];
    userCards.forEach(c => {
      c.isDefault = c.id === cardId;
    });
    all[userId] = userCards;
    StorageService.set(CARDS_KEY, all);
    return true;
  }
};
