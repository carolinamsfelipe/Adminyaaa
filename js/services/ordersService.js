/**
 * ORDERS SERVICE — Gestión de pedidos, historial y recompra
 */
import { StorageService } from './storageService.js';
import { CartService } from './cartService.js';

const ORDERS_KEY = 'orders_history';

function initDemoOrders() {
  const allOrders = StorageService.get(ORDERS_KEY, []);
  if (allOrders.length === 0) {
    const demoOrder = {
      id: 'MY-1041',
      userId: 'usr_demo_1',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      customer: {
        firstName: 'Carolina',
        lastName: 'Felipe',
        email: 'carolina@adminya.com.ar',
        phone: '11 3033-2341'
      },
      items: [
        {
          id: 'combo_C200',
          type: 'combo',
          comboId: 'C200',
          name: 'Esenciales para tu casa',
          unit: 'combo',
          price: 200000,
          quantity: 1,
          image: 'img/productos/almacen.webp'
        },
        {
          id: 'prod_M45',
          type: 'product',
          productId: 'M45',
          name: 'Aceite Natura x1500',
          unit: 'un.',
          price: 3200,
          quantity: 2,
          image: 'img/productos/aceite.webp'
        }
      ],
      deliveryType: 'domicilio',
      address: {
        name: 'Casa',
        street: 'Av. Rivadavia',
        number: '21450',
        floorApt: 'Piso 2 Dpto B',
        city: 'Ituzaingó',
        postalCode: '1714',
        references: 'Entre Soler y Mansilla'
      },
      paymentMethod: 'Transferencia bancaria / Alias',
      customerNotes: 'Entregar preferentemente por la mañana.',
      totals: {
        subtotal: 206400,
        shippingCost: 0,
        total: 206400,
        totalUnits: 41
      },
      status: 'Entregado'
    };
    StorageService.set(ORDERS_KEY, [demoOrder]);
  }
}

initDemoOrders();

export const OrdersService = {
  getOrders(userId) {
    const all = StorageService.get(ORDERS_KEY, []);
    if (!userId) return all;
    return all.filter(o => o.userId === userId || !o.userId);
  },

  getOrderById(orderId) {
    const all = StorageService.get(ORDERS_KEY, []);
    return all.find(o => o.id === orderId) || null;
  },

  createOrder(orderData) {
    const all = StorageService.get(ORDERS_KEY, []);
    const sequentialNum = 1042 + all.length;
    const orderId = `MY-${sequentialNum}`;

    const newOrder = {
      id: orderId,
      userId: orderData.userId || null,
      createdAt: new Date().toISOString(),
      customer: orderData.customer,
      items: orderData.items,
      deliveryType: orderData.deliveryType,
      address: orderData.address || null,
      paymentMethod: orderData.paymentMethod,
      paymentCard: orderData.paymentCard || null,
      customerNotes: orderData.customerNotes?.trim() || '',
      totals: orderData.totals,
      status: 'Enviado por WhatsApp'
    };

    all.unshift(newOrder);
    StorageService.set(ORDERS_KEY, all);

    return newOrder;
  },

  repeatOrder(orderId) {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Pedido no encontrado.');

    // Cargar los productos de la orden anterior directamente al carrito
    order.items.forEach(it => {
      if (it.type === 'combo') {
        CartService.addCombo(it, it.quantity);
      } else {
        CartService.addProduct(it, it.quantity, it.optionsNote || '');
      }
    });

    return true;
  }
};
