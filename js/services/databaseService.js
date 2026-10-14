/**
 * @file databaseService.js
 * @description Capa de persistencia agnóstica con patrón Adapter para Mayorista a tu Casa.
 * Soporta almacenamiento local (LocalStorage) y Supabase BaaS (PostgreSQL) con suscripciones en tiempo real.
 * Una iniciativa de AdminYAAA.
 * @author Equipo de Arquitectura — Mayorista a tu Casa
 */

import { STORE_CONFIG } from '../config.js';
import { StorageService } from './storageService.js';
import { PRODUCTS } from '../data/catalog.js';

/**
 * @typedef {Object} ProductEntity
 * @property {string} id
 * @property {string} sku
 * @property {string} [barcode]
 * @property {string} name
 * @property {string} brand
 * @property {string} section
 * @property {string} category
 * @property {string} unit
 * @property {string} [presentation]
 * @property {number} cost
 * @property {number} price
 * @property {number} margin
 * @property {number} stock
 * @property {number} minStock
 * @property {number} maxStock
 * @property {string} [image]
 * @property {boolean} [isFeatured]
 * @property {boolean} [isOffer]
 * @property {number} [offerPrice]
 * @property {'activo' | 'inactivo' | 'agotado'} status
 */

/**
 * @typedef {Object} OrderEntity
 * @property {string} id
 * @property {string} customerName
 * @property {string} customerPhone
 * @property {string} [customerEmail]
 * @property {'domicilio' | 'retiro'} deliveryType
 * @property {string} [deliveryZone]
 * @property {string} [addressLine]
 * @property {Array<Object>} items
 * @property {number} subtotal
 * @property {number} deliveryFee
 * @property {number} total
 * @property {string} paymentMethod
 * @property {'pendiente' | 'aprobado' | 'rechazado'} [paymentStatus]
 * @property {'Pendiente' | 'Confirmado' | 'En preparación' | 'En camino' | 'Entregado' | 'Cancelado'} status
 * @property {string} [notes]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

class DatabaseService {
  constructor() {
    this.provider = STORE_CONFIG.DATABASE?.provider || 'local';
    this.supabaseClient = null;
    this.isInitialized = false;
    this.subscribers = new Map();
  }

  /**
   * Inicializa la conexión con el proveedor configurado.
   * @returns {Promise<boolean>}
   */
  async init() {
    if (this.isInitialized) return true;

    if (this.provider === 'supabase') {
      try {
        const { supabaseUrl, supabaseAnonKey } = STORE_CONFIG.DATABASE || {};
        const isDummy = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('TU-PROYECTO');

        if (isDummy) {
          console.info('[DatabaseService] Modo LocalStorage activo (credenciales de Supabase no configuradas o en modo demo).');
          this.provider = 'local';
        } else {
          // Importación dinámica ESM del cliente oficial sin herramientas de build
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.4');
          this.supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
          await this._verifyAndSeedCloudDatabase();
          console.info('[DatabaseService] Conectado exitosamente a Supabase BaaS (PostgreSQL).');
        }
      } catch (error) {
        console.warn('[DatabaseService] Error al conectar con Supabase. Usando LocalStorage fallback:', error);
        this.provider = 'local';
      }
    }

    if (this.provider === 'local') {
      this._initLocalStorage();
    }

    this.isInitialized = true;
    return true;
  }

  // ==========================================================================
  // OPERACIONES DE PRODUCTOS
  // ==========================================================================

  /**
   * Obtiene todos los productos del catálogo.
   * @returns {Promise<ProductEntity[]>}
   */
  async getProducts() {
    await this.init();

    if (this.provider === 'supabase' && this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient
          .from('products')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          const mapped = data.map(this._mapProductFromDB);
          // Actualizar caché local
          StorageService.set('wholesale_products', mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('[DatabaseService] Falló lectura de Supabase, usando copia local:', err);
      }
    }

    return StorageService.get('wholesale_products', PRODUCTS);
  }

  /**
   * Actualiza un producto existente en la base de datos.
   * @param {string} id
   * @param {Partial<ProductEntity>} productData
   * @returns {Promise<ProductEntity|null>}
   */
  async updateProduct(id, productData) {
    await this.init();

    // Actualización local siempre (offline-first sync)
    const localProducts = StorageService.get('wholesale_products', PRODUCTS);
    const index = localProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      localProducts[index] = { ...localProducts[index], ...productData, updatedAt: new Date().toISOString() };
      StorageService.set('wholesale_products', localProducts);
    }

    if (this.provider === 'supabase' && this.supabaseClient) {
      try {
        const payload = this._mapProductToDB({ ...localProducts[index], ...productData });
        payload.updated_at = new Date().toISOString();

        const { data, error } = await this.supabaseClient
          .from('products')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return this._mapProductFromDB(data);
      } catch (err) {
        console.error(`[DatabaseService] Error actualizando producto ${id} en Supabase:`, err);
      }
    }

    return localProducts[index] || null;
  }

  // ==========================================================================
  // OPERACIONES DE PEDIDOS
  // ==========================================================================

  /**
   * Obtiene la lista completa de pedidos.
   * @returns {Promise<OrderEntity[]>}
   */
  async getOrders() {
    await this.init();

    if (this.provider === 'supabase' && this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          const mapped = data.map(this._mapOrderFromDB);
          StorageService.set('wholesale_orders', mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('[DatabaseService] Error al obtener pedidos de Supabase:', err);
      }
    }

    return StorageService.get('wholesale_orders', []);
  }

  /**
   * Crea un nuevo pedido en el sistema.
   * @param {OrderEntity} order
   * @returns {Promise<OrderEntity>}
   */
  async createOrder(order) {
    await this.init();

    // Persistencia local
    const localOrders = StorageService.get('wholesale_orders', []);
    localOrders.unshift(order);
    StorageService.set('wholesale_orders', localOrders);

    if (this.provider === 'supabase' && this.supabaseClient) {
      try {
        const payload = this._mapOrderToDB(order);
        const { data, error } = await this.supabaseClient
          .from('orders')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        return this._mapOrderFromDB(data);
      } catch (err) {
        console.error('[DatabaseService] Error guardando pedido en Supabase:', err);
      }
    }

    return order;
  }

  /**
   * Actualiza el estado de un pedido existente.
   * @param {string} orderId
   * @param {'Pendiente'|'Confirmado'|'En preparación'|'En camino'|'Entregado'|'Cancelado'} newStatus
   * @returns {Promise<boolean>}
   */
  async updateOrderStatus(orderId, newStatus) {
    await this.init();

    const localOrders = StorageService.get('wholesale_orders', []);
    const order = localOrders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      order.updatedAt = new Date().toISOString();
      StorageService.set('wholesale_orders', localOrders);
    }

    if (this.provider === 'supabase' && this.supabaseClient) {
      try {
        const { error } = await this.supabaseClient
          .from('orders')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId);

        if (error) throw error;
        return true;
      } catch (err) {
        console.error(`[DatabaseService] Error actualizando estado de pedido ${orderId}:`, err);
      }
    }

    return !!order;
  }

  // ==========================================================================
  // SUSCRIPCIONES WEBSOCKET EN TIEMPO REAL
  // ==========================================================================

  /**
   * Suscribe a cambios en vivo de una tabla específica.
   * @param {'products'|'orders'} table
   * @param {Function} callback
   * @returns {Function} Función para cancelar la suscripción (unsubscribe)
   */
  subscribeToChanges(table, callback) {
    if (this.provider === 'supabase' && this.supabaseClient) {
      const channel = this.supabaseClient
        .channel(`realtime_${table}_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          callback(payload);
        })
        .subscribe();

      return () => {
        this.supabaseClient.removeChannel(channel);
      };
    }

    // Fallback para entorno local vía storage y CustomEvent
    const listener = (e) => {
      if (e.key === `wholesale_${table}` || e.detail?.table === table) {
        callback({ eventType: 'UPDATE', new: e.detail?.data });
      }
    };

    window.addEventListener('storage', listener);
    window.addEventListener('local-db-change', listener);

    return () => {
      window.removeEventListener('storage', listener);
      window.removeEventListener('local-db-change', listener);
    };
  }

  // ==========================================================================
  // HELPERS PRIVADOS DE MAPEO Y SEEDING
  // ==========================================================================

  _initLocalStorage() {
    const existing = StorageService.get('wholesale_products', null);
    if (!existing || existing.length === 0) {
      StorageService.set('wholesale_products', PRODUCTS);
    }
  }

  async _verifyAndSeedCloudDatabase() {
    if (!this.supabaseClient) return;

    try {
      const { count, error } = await this.supabaseClient
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (!error && (count === 0 || count === null)) {
        console.info('[DatabaseService] Sembrando 303 productos iniciales en Supabase...');
        const batch = PRODUCTS.map(this._mapProductToDB);

        // Inserción en bloques de 50 para respetar límites de payload
        for (let i = 0; i < batch.length; i += 50) {
          const chunk = batch.slice(i, i + 50);
          await this.supabaseClient.from('products').upsert(chunk);
        }
        console.info('[DatabaseService] Sembrado de productos completado con éxito.');
      }
    } catch (err) {
      console.warn('[DatabaseService] Error durante chequeo de auto-seed:', err);
    }
  }

  _mapProductToDB(p) {
    return {
      id: p.id,
      sku: p.sku || `MAY-${p.id}`,
      barcode: p.barcode || null,
      name: p.name,
      brand: p.brand || 'Genérica',
      section: p.section,
      category: p.category,
      unit: p.unit || 'un.',
      presentation: p.presentation || null,
      cost: Number(p.cost || 0),
      price: Number(p.price || 0),
      margin: Number(p.margin || 0),
      stock: Number(p.stock !== undefined ? p.stock : 20),
      min_stock: Number(p.minStock || 5),
      max_stock: Number(p.maxStock || 100),
      image: p.image || null,
      is_featured: !!p.isFeatured,
      is_offer: !!p.isOffer,
      offer_price: p.offerPrice ? Number(p.offerPrice) : null,
      status: p.status || 'activo'
    };
  }

  _mapProductFromDB(row) {
    return {
      id: row.id,
      sku: row.sku,
      barcode: row.barcode,
      name: row.name,
      brand: row.brand,
      section: row.section,
      category: row.category,
      unit: row.unit,
      presentation: row.presentation,
      cost: Number(row.cost),
      price: Number(row.price),
      margin: Number(row.margin),
      stock: Number(row.stock),
      minStock: Number(row.min_stock),
      maxStock: Number(row.max_stock),
      image: row.image,
      isFeatured: !!row.is_featured,
      isOffer: !!row.is_offer,
      offerPrice: row.offer_price ? Number(row.offer_price) : null,
      status: row.status
    };
  }

  _mapOrderToDB(o) {
    return {
      id: o.id,
      customer_name: o.customerName || o.customer?.firstName || 'Cliente',
      customer_phone: o.customerPhone || o.customer?.phone || '',
      customer_email: o.customerEmail || o.customer?.email || null,
      delivery_type: o.deliveryType || 'domicilio',
      delivery_zone: o.deliveryZone || null,
      address_line: o.addressLine || null,
      items: o.items || [],
      subtotal: Number(o.subtotal || 0),
      delivery_fee: Number(o.deliveryFee || 0),
      total: Number(o.total || 0),
      payment_method: o.paymentMethod || 'efectivo',
      payment_status: o.paymentStatus || 'pendiente',
      status: o.status || 'Pendiente',
      notes: o.notes || null
    };
  }

  _mapOrderFromDB(row) {
    return {
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      deliveryType: row.delivery_type,
      deliveryZone: row.delivery_zone,
      addressLine: row.address_line,
      items: row.items,
      subtotal: Number(row.subtotal),
      deliveryFee: Number(row.delivery_fee),
      total: Number(row.total),
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const db = new DatabaseService();
