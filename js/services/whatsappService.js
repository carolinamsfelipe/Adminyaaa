/**
 * WHATSAPP SERVICE — Generador estructurado de mensajes comerciales para WhatsApp
 * Destino: 11 3033-2341 (5491130332341)
 */
import { STORE_CONFIG } from '../config.js';

export const WhatsAppService = {
  formatCurrency(amount) {
    return '$' + Number(amount || 0).toLocaleString('es-AR');
  },

  buildOrderMessage(order) {
    const { customer, items, deliveryType, address, paymentMethod, paymentCard, customerNotes, totals, id } = order;
    const lines = [];

    lines.push(`🛒 *PEDIDO MAYORISTA — MAYORISTA A TU CASA*`);
    lines.push(`*Iniciativa de AdminYAAA*`);
    if (id) lines.push(`*N° de Pedido:* #${id}`);
    lines.push(`*Fecha:* ${new Date().toLocaleDateString('es-AR')}`);
    lines.push(``);

    lines.push(`👤 *DATOS DEL CLIENTE*`);
    lines.push(`• *Nombre:* ${customer.firstName} ${customer.lastName}`);
    lines.push(`• *Teléfono:* ${customer.phone}`);
    if (customer.email) lines.push(`• *Email:* ${customer.email}`);
    lines.push(``);

    lines.push(`📦 *DETALLE DE PRODUCTOS Y COMBOS*`);
    items.forEach(it => {
      const unitLabel = it.unit === 'kg' ? 'el kg' : 'c/u';
      const lineSub = it.price * it.quantity;
      if (it.type === 'combo') {
        lines.push(`⭐ *${it.name}* × ${it.quantity} — ${this.formatCurrency(it.price)} = *${this.formatCurrency(lineSub)}*`);
      } else {
        const optText = it.optionsNote ? ` _(${it.optionsNote})_` : '';
        lines.push(`• *${it.name}* × ${it.quantity} ${unitLabel} (${this.formatCurrency(it.price)})${optText} = *${this.formatCurrency(lineSub)}*`);
      }
    });
    lines.push(``);

    lines.push(`💰 *RESUMEN ECONÓMICO*`);
    lines.push(`• *Subtotal mercadería:* ${this.formatCurrency(totals.subtotal)} (${totals.totalUnits} un.)`);
    if (totals.savings > 0) {
      lines.push(`• *Ahorro mayorista:* -${this.formatCurrency(totals.savings)}`);
    }
    if (totals.couponDiscount && totals.couponDiscount > 0) {
      lines.push(`• *Cupón aplicado (${totals.coupon?.code || 'DESCUENTO'}):* -${this.formatCurrency(totals.couponDiscount)}`);
    }
    
    if (deliveryType === 'retiro') {
      lines.push(`• *Modalidad de entrega:* Retiro en depósito Ituzaingó (Sin costo)`);
    } else {
      lines.push(`• *Modalidad de entrega:* Envío a domicilio`);
      if (totals.shippingCost === 0) {
        lines.push(`• *Costo de envío:* Bonificado / Sin cargo`);
      } else if (totals.shippingCost > 0) {
        lines.push(`• *Costo de envío:* ${this.formatCurrency(totals.shippingCost)}`);
      } else {
        lines.push(`• *Costo de envío:* A coordinar por WhatsApp`);
      }
    }

    lines.push(`• *TOTAL ESTIMADO:* *${this.formatCurrency(totals.total)}*`);
    lines.push(``);

    if (deliveryType === 'domicilio' && address) {
      lines.push(`📍 *DIRECCIÓN DE ENTREGA*`);
      let addrLine = `${address.street} ${address.number}`;
      if (address.floorApt) addrLine += `, ${address.floorApt}`;
      addrLine += `, ${address.city}`;
      if (address.postalCode) addrLine += ` (CP ${address.postalCode})`;
      lines.push(`• *Ubicación:* ${addrLine}`);
      if (address.references) lines.push(`• *Referencias:* ${address.references}`);
      lines.push(``);
    }

    lines.push(`💳 *MEDIO DE PAGO PREFERIDO*`);
    let payText = paymentMethod || 'Efectivo';
    if (paymentCard) {
      payText += ` (Tarjeta ${paymentCard.brand.toUpperCase()} terminada en •••• ${paymentCard.last4})`;
    }
    lines.push(`• ${payText}`);
    lines.push(``);

    if (customerNotes && customerNotes.trim()) {
      lines.push(`📝 *OBSERVACIONES / HORARIOS*`);
      lines.push(`• "${customerNotes.trim()}"`);
      lines.push(``);
    }

    lines.push(`---`);
    lines.push(`_Pedido preparado en la web de Mayorista a tu Casa._`);
    lines.push(`_Quedo a la espera de confirmación de stock y entrega. ¡Muchas gracias!_`);

    return lines.join('\n');
  },

  getOrderWhatsAppUrl(order) {
    const rawNumber = String(STORE_CONFIG.whatsappNumber).replace(/\D/g, '');
    const message = this.buildOrderMessage(order);
    return `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`;
  },

  getInquiryUrl(message = '¡Hola! Quiero consultar por compras mayoristas en Mayorista a tu Casa.') {
    const rawNumber = String(STORE_CONFIG.whatsappNumber).replace(/\D/g, '');
    return `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`;
  }
};
