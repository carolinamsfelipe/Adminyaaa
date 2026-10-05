/**
 * CONFIGURACIÓN COMERCIAL Y OPERATIVA — Mayorista a tu Casa
 * Una iniciativa de AdminYAAA.
 */
export const STORE_CONFIG = {
  brandName: 'Mayorista a tu Casa',
  subtitle: 'Una iniciativa de AdminYAAA',
  whatsappNumber: '5491130332341',
  whatsappVisible: '11 3033-2341',
  contactEmail: 'adminyaaa@gmail.com',
  minimumOrderARS: 0, // Sin mínimo obligatorio para compras sueltas, combos desde $200.000
  freeShippingMinARS: 250000,
  deliveryZones: [
    { zone: 'Ituzaingó', cost: 0, description: 'Envío gratis en Ituzaingó' },
    { zone: 'Castelar / Morón / Haedo', cost: 2500, description: 'Gratis superando $250.000' },
    { zone: 'Ramos Mejía / San Justo / Ciudadela', cost: 3500, description: 'Gratis superando $250.000' },
    { zone: 'Merlo / Padua / Moreno', cost: 4000, description: 'Entrega coordinada semanal' },
    { zone: 'CABA (Capital Federal)', cost: 5000, description: 'Ruta de entregas programadas' },
    { zone: 'Otras localidades GBA / Interior', cost: null, description: 'A coordinar por WhatsApp según bultos' }
  ],
  paymentMethods: [
    { id: 'efectivo', name: 'Efectivo contra entrega', icon: 'cash', desc: 'Pagás en mano al recibir tus productos.' },
    { id: 'transferencia', name: 'Transferencia bancaria / Alias', icon: 'bank', desc: 'Transferís desde tu banco o billetera virtual.' },
    { id: 'mercadopago', name: 'Mercado Pago (Transferencia / QR)', icon: 'mp', desc: 'Pagá con dinero en cuenta de Mercado Pago.' },
    { id: 'tarjeta', name: 'Tarjeta Débito / Crédito (Gestión Segura)', icon: 'card', desc: 'Medio de pago registrado en tu billetera.' }
  ],
  deliveryTypes: [
    { id: 'domicilio', name: 'Envío a domicilio', desc: 'Recibí en la comodidad de tu casa o negocio.' },
    { id: 'retiro', name: 'Retiro en depósito (Ituzaingó)', desc: 'Retirás sin costo una vez preparado el pedido.' }
  ]
};
