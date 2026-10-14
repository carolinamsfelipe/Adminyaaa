/**
 * api.js — Capa de Datos, Persistencia y Servicios Centrales de AdminYAAA
 *
 * Integra:
 *   - Administración Operativa & Finanzas de AdminYAAA
 *   - Módulo Mayorista & Distribución (Mayorista a tu Casa)
 *   - Portal de Clientes & Documentos Compartidos
 *   - Bóveda de Claves y Credenciales Sensibles (Encriptación AES-256)
 *   - Persistencia local sincronizable con Supabase BaaS
 */

import { getSeedData, CLIENTES, TAREAS, FACTURAS, PAGOS, PLANILLA_GASTRO, PRODUCTOS_STOCK, PRESUPUESTOS, COLABORADORES, LIQUIDACIONES, PRESTAMOS, FONDOS_CAJA, GASTOS_OPERATIVOS, CUENTAS_TESORERIA, MOVIMIENTOS_TESORERIA, RETIROS_SOCIOS, PRESENTISMO, ESTUDIOS_ALIADOS } from './seed.js'
import { PRODUCTS } from "../../../../js/data/catalog.js"
import { COMBOS } from "../../../../js/data/combos.js"
import { today, uid, formatMoney } from '../core/utils.js'

const STORAGE_KEY = 'ay_v2_data'
const VAULT_KEY = 'ay_v2_vault'
const WHOLESALE_KEY = 'ay_v2_wholesale'

// Helper interno de lectura/escritura en Storage
function _getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error al leer de localStorage:', e)
  }
  return _initFromSeed()
}

function _saveStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error al guardar en localStorage:', e)
  }
}

function _initFromSeed() {
  const seed = getSeedData()
  _saveStore(seed)
  return seed
}

export function initStorage() {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (!existing) {
    _initFromSeed()
  }
  // Inicializar bóveda si no existe
  if (!localStorage.getItem(VAULT_KEY)) {
    _initVaultSeed()
  }
  // Inicializar mayorista si no existe
  if (!localStorage.getItem(WHOLESALE_KEY)) {
    _initWholesaleSeed()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CLIENTES API
// ─────────────────────────────────────────────────────────────────────────────
export const ClientesAPI = {
  getAll(includeDeleted = false) {
    const data = _getStore()
    return (data.clientes || []).filter(c => includeDeleted || !c.deleted_at)
  },
  listar() {
    return this.getAll()
  },
  getById(id) {
    const clientes = this.getAll(true)
    return clientes.find(c => c.id === id) || null
  },
  getByOperador(operadorId) {
    const clientes = this.getAll()
    if (!operadorId) return clientes
    return clientes.filter(c => c.operador_asignado_id === operadorId || !c.operador_asignado_id)
  },
  create(clienteData) {
    const data = _getStore()
    const nuevo = {
      id: 'cli_' + uid(),
      estado: 'activo',
      created_at: new Date().toISOString(),
      deleted_at: null,
      ...clienteData
    }
    data.clientes.unshift(nuevo)
    _saveStore(data)
    return nuevo
  },
  update(id, updateData) {
    const data = _getStore()
    const idx = data.clientes.findIndex(c => c.id === id)
    if (idx !== -1) {
      data.clientes[idx] = { ...data.clientes[idx], ...updateData, updated_at: new Date().toISOString() }
      _saveStore(data)
      return data.clientes[idx]
    }
    return null
  },
  softDelete(id) {
    return this.update(id, { deleted_at: new Date().toISOString() })
  },
  restore(id) {
    return this.update(id, { deleted_at: null })
  },
  search(query) {
    const q = (query || '').toLowerCase().trim()
    if (!q) return this.getAll()
    return this.getAll().filter(c =>
      (c.nombre_comercial || '').toLowerCase().includes(q) ||
      (c.razon_social || '').toLowerCase().includes(q) ||
      (c.cuit || '').includes(q) ||
      (c.dueno_nombre || '').toLowerCase().includes(q)
    )
  },
  getFinancialSummary(clienteId) {
    const facturas = FacturasAPI.getByCliente(clienteId)
    const pagos = PagosAPI.getByCliente(clienteId)

    const total_facturado = facturas.reduce((acc, f) => acc + (f.monto || 0), 0)
    const total_cobrado = pagos.reduce((acc, p) => acc + (p.monto || 0), 0)
    const saldo_deuda = facturas
      .filter(f => f.estado === 'pendiente' || f.estado === 'vencida')
      .reduce((acc, f) => acc + (f.monto || 0), 0)

    const ultimaFactura = facturas.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))[0]

    return {
      total_facturado,
      total_cobrado,
      saldo_deuda,
      ultima_factura: ultimaFactura ? ultimaFactura.fecha : null
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TAREAS OPERATIVAS API
// ─────────────────────────────────────────────────────────────────────────────
export const TareasAPI = {
  getAll(filters = {}) {
    const data = _getStore()
    let list = (data.tareas || []).filter(t => !t.deleted_at)
    if (filters.cliente_id) list = list.filter(t => t.cliente_id === filters.cliente_id)
    if (filters.operador_id) list = list.filter(t => t.operador_id === filters.operador_id)
    if (filters.estado) list = list.filter(t => t.estado === filters.estado)
    return list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
  },
  listar(filters) {
    return this.getAll(filters)
  },
  getById(id) {
    return (_getStore().tareas || []).find(t => t.id === id) || null
  },
  getByCliente(clienteId) {
    return this.getAll({ cliente_id: clienteId })
  },
  getByOperador(operadorId) {
    return this.getAll({ operador_id: operadorId })
  },
  create(tareaData) {
    const data = _getStore()
    const nueva = {
      id: 'tar_' + uid(),
      fecha: today(),
      horas: 1,
      precio: 0,
      abono_incluido: true,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
      deleted_at: null,
      ...tareaData
    }
    data.tareas.unshift(nueva)
    _saveStore(data)
    return nueva
  },
  crear(tareaData) {
    return this.create(tareaData)
  },
  update(id, updateData) {
    const data = _getStore()
    const idx = data.tareas.findIndex(t => t.id === id)
    if (idx !== -1) {
      data.tareas[idx] = { ...data.tareas[idx], ...updateData, updated_at: new Date().toISOString() }
      _saveStore(data)
      return data.tareas[idx]
    }
    return null
  },
  actualizarEstado(id, estado) {
    return this.update(id, { estado })
  },
  updateEstado(id, estado) {
    return this.update(id, { estado })
  },
  softDelete(id) {
    return this.update(id, { deleted_at: new Date().toISOString() })
  },
  eliminar(id) {
    return this.softDelete(id)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FACTURAS API
// ─────────────────────────────────────────────────────────────────────────────
export const FacturasAPI = {
  getAll(filters = {}) {
    const data = _getStore()
    let list = (data.facturas || []).filter(f => !f.deleted_at)
    if (filters.cliente_id) list = list.filter(f => f.cliente_id === filters.cliente_id)
    if (filters.estado) list = list.filter(f => f.estado === filters.estado)
    return list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
  },
  getById(id) {
    return (_getStore().facturas || []).find(f => f.id === id) || null
  },
  getByCliente(clienteId) {
    return this.getAll({ cliente_id: clienteId })
  },
  getPendientes() {
    return this.getAll().filter(f => f.estado === 'pendiente' || f.estado === 'vencida')
  },
  getVencidas() {
    return this.getAll().filter(f => f.estado === 'vencida')
  },
  create(facturaData) {
    const data = _getStore()
    const count = (data.facturas || []).length + 1
    const numero = facturaData.numero || `FC-001-${String(count).padStart(8, '0')}`
    const nueva = {
      id: 'fac_' + uid(),
      numero,
      fecha: today(),
      estado: 'pendiente',
      created_at: new Date().toISOString(),
      deleted_at: null,
      ...facturaData
    }
    data.facturas.unshift(nueva)
    _saveStore(data)
    return nueva
  },
  update(id, updateData) {
    const data = _getStore()
    const idx = data.facturas.findIndex(f => f.id === id)
    if (idx !== -1) {
      data.facturas[idx] = { ...data.facturas[idx], ...updateData, updated_at: new Date().toISOString() }
      _saveStore(data)
      return data.facturas[idx]
    }
    return null
  },
  marcarCobrada(id, pagoId) {
    return this.update(id, { estado: 'cobrada', pago_id: pagoId })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PAGOS RECIBIDOS (LÓGICA FIFO)
// ─────────────────────────────────────────────────────────────────────────────
export const PagosAPI = {
  getAll(filters = {}) {
    const data = _getStore()
    let list = (data.pagos || []).filter(p => !p.deleted_at)
    if (filters.cliente_id) list = list.filter(p => p.cliente_id === filters.cliente_id)
    return list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
  },
  getById(id) {
    return (_getStore().pagos || []).find(p => p.id === id) || null
  },
  getByCliente(clienteId) {
    return this.getAll({ cliente_id: clienteId })
  },
  registrarPago(clienteId, monto, cuentaDestino, comprobante, fecha = today()) {
    const data = _getStore()
    const pagoId = 'pag_' + uid()

    // 1. Buscar facturas impagas del cliente ordenadas cronológicamente (FIFO)
    const facturasImpagas = (data.facturas || [])
      .filter(f => f.cliente_id === clienteId && (f.estado === 'pendiente' || f.estado === 'vencida'))
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))

    let remanente = monto
    const canceladas = []

    for (const fac of facturasImpagas) {
      if (remanente <= 0) break
      if (remanente >= fac.monto) {
        fac.estado = 'cobrada'
        fac.pago_id = pagoId
        remanente -= fac.monto
        canceladas.push({ factura_id: fac.id, monto_cancelado: fac.monto })
      } else {
        // Cancelación parcial
        canceladas.push({ factura_id: fac.id, monto_cancelado: remanente })
        remanente = 0
      }
    }

    const nuevoPago = {
      id: pagoId,
      cliente_id: clienteId,
      fecha,
      monto,
      cuenta_destino: cuentaDestino,
      comprobante,
      facturas_canceladas: canceladas,
      created_at: new Date().toISOString()
    }

    if (!data.pagos) data.pagos = []
    data.pagos.unshift(nuevoPago)
    _saveStore(data)

    return { pago: nuevoPago, facturasCanceladas: canceladas, sobrante: remanente }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PLANILLA GASTRONÓMICA API
// ─────────────────────────────────────────────────────────────────────────────
export const PlanillaAPI = {
  getByCliente(clienteId, fechaDesde, fechaHasta) {
    const data = _getStore()
    let list = (data.planilla_gastro || []).filter(p => p.cliente_id === clienteId)
    if (fechaDesde && fechaHasta) {
      list = list.filter(p => p.fecha >= fechaDesde && p.fecha <= fechaHasta)
    }
    return list
  },
  getDia(clienteId, fecha) {
    const list = this.getByCliente(clienteId)
    return list.find(p => p.fecha === fecha) || null
  },
  saveDia(clienteId, fecha, regData) {
    const data = _getStore()
    if (!data.planilla_gastro) data.planilla_gastro = []
    const idx = data.planilla_gastro.findIndex(p => p.cliente_id === clienteId && p.fecha === fecha)
    if (idx !== -1) {
      data.planilla_gastro[idx] = { ...data.planilla_gastro[idx], ...regData, updated_at: new Date().toISOString() }
    } else {
      data.planilla_gastro.push({
        id: 'pg_' + uid(),
        cliente_id: clienteId,
        fecha,
        ventas_tarde: 0,
        ventas_noche: 0,
        gastos_dia: 0,
        notas: '',
        ...regData
      })
    }
    _saveStore(data)
    return true
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PRODUCTOS STOCK (POR CLIENTE)
// ─────────────────────────────────────────────────────────────────────────────
export const StockAPI = {
  getByCliente(clienteId, includeDeleted = false) {
    const data = _getStore()
    return (data.productos_stock || []).filter(p => p.cliente_id === clienteId && (includeDeleted || !p.deleted_at))
  },
  getById(id) {
    return (_getStore().productos_stock || []).find(p => p.id === id) || null
  },
  create(stockData) {
    const data = _getStore()
    const nuevo = {
      id: 'stk_' + uid(),
      unidad: 'un.',
      stock_actual: 0,
      stock_minimo: 5,
      created_at: new Date().toISOString(),
      ...stockData
    }
    if (!data.productos_stock) data.productos_stock = []
    data.productos_stock.unshift(nuevo)
    _saveStore(data)
    return nuevo
  },
  update(id, updateData) {
    const data = _getStore()
    const idx = (data.productos_stock || []).findIndex(p => p.id === id)
    if (idx !== -1) {
      data.productos_stock[idx] = { ...data.productos_stock[idx], ...updateData }
      _saveStore(data)
      return data.productos_stock[idx]
    }
    return null
  },
  ajustarStock(id, cantidad, motivo = 'Ajuste manual') {
    const item = this.getById(id)
    if (!item) return null
    const nuevoStock = Math.max(0, (item.stock_actual || 0) + cantidad)
    return this.update(id, { stock_actual: nuevoStock })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. PRESUPUESTOS DIGITALES API
// ─────────────────────────────────────────────────────────────────────────────
export const PresupuestosAPI = {
  getAll(filters = {}) {
    const data = _getStore()
    let list = data.presupuestos || []
    if (filters.cliente_id) list = list.filter(p => p.cliente_id === filters.cliente_id)
    if (filters.estado) list = list.filter(p => p.estado === filters.estado)
    return list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
  },
  getById(id) {
    return (_getStore().presupuestos || []).find(p => p.id === id) || null
  },
  create(presupuestoData) {
    const data = _getStore()
    const count = (data.presupuestos || []).length + 1
    const numero = presupuestoData.numero || `PRE-${String(count).padStart(5, '0')}`
    const nuevo = {
      id: 'pre_' + uid(),
      numero,
      fecha: today(),
      estado: 'borrador',
      items: [],
      created_at: new Date().toISOString(),
      ...presupuestoData
    }
    if (!data.presupuestos) data.presupuestos = []
    data.presupuestos.unshift(nuevo)
    _saveStore(data)
    return nuevo
  },
  update(id, updateData) {
    const data = _getStore()
    const idx = (data.presupuestos || []).findIndex(p => p.id === id)
    if (idx !== -1) {
      data.presupuestos[idx] = { ...data.presupuestos[idx], ...updateData }
      _saveStore(data)
      return data.presupuestos[idx]
    }
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SUELDOS, LIQUIDACIONES Y PRÉSTAMOS API
// ─────────────────────────────────────────────────────────────────────────────
export const ColaboradoresAPI = {
  getAll() {
    return _getStore().colaboradores || []
  },
  listar() {
    return this.getAll()
  },
  getById(id) {
    return this.getAll().find(c => c.id === id) || null
  }
}

export const SueldosAPI = {
  getLiquidaciones(filters = {}) {
    return _getStore().liquidaciones || []
  },
  getPrestamos(filters = {}) {
    return _getStore().prestamos || []
  },
  createLiquidacion(liqData) {
    const data = _getStore()
    const nueva = { id: 'liq_' + uid(), fecha_pago: today(), estado: 'pendiente', ...liqData }
    if (!data.liquidaciones) data.liquidaciones = []
    data.liquidaciones.unshift(nueva)
    _saveStore(data)
    return nueva
  },
  createPrestamo(prestamoData) {
    const data = _getStore()
    const nuevo = { id: 'pre_' + uid(), estado: 'vigente', cuotas_pagadas: 0, ...prestamoData }
    if (!data.prestamos) data.prestamos = []
    data.prestamos.unshift(nuevo)
    _saveStore(data)
    return nuevo
  }
}

export const LiquidacionesAPI = {
  getAll: () => SueldosAPI.getLiquidaciones(),
  getById: (id) => (SueldosAPI.getLiquidaciones() || []).find(l => l.id === id) || null,
  create: (d) => SueldosAPI.createLiquidacion(d)
}

export const PrestamosAPI = {
  getAll: () => SueldosAPI.getPrestamos(),
  getById: (id) => (SueldosAPI.getPrestamos() || []).find(p => p.id === id) || null,
  create: (d) => SueldosAPI.createPrestamo(d)
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. FONDOS Y CAJAS CHICAS API
// ─────────────────────────────────────────────────────────────────────────────
export const FondosAPI = {
  getAll() {
    return _getStore().fondos_caja || []
  },
  getMovimientos(colaboradorId) {
    const fondo = this.getAll().find(f => f.colaborador_id === colaboradorId)
    return fondo?.movimientos || []
  },
  cargarGasto(colaboradorId, gastoData) {
    const data = _getStore()
    const fondo = (data.fondos_caja || []).find(f => f.colaborador_id === colaboradorId)
    if (!fondo) return null
    const monto = Number(gastoData.monto || 0)
    fondo.saldo_actual = Math.max(0, fondo.saldo_actual - monto)
    if (!fondo.movimientos) fondo.movimientos = []
    fondo.movimientos.unshift({
      id: 'mov_f_' + uid(),
      fecha: today(),
      tipo: 'gasto',
      monto,
      motivo: gastoData.motivo || 'Gasto operativo menor',
      comprobante: gastoData.comprobante || null
    })
    _saveStore(data)
    return fondo
  },
  reponer(colaboradorId, monto) {
    const data = _getStore()
    const fondo = (data.fondos_caja || []).find(f => f.colaborador_id === colaboradorId)
    if (!fondo) return null
    fondo.saldo_actual = Math.min(fondo.tope_fondo, fondo.saldo_actual + monto)
    if (!fondo.movimientos) fondo.movimientos = []
    fondo.movimientos.unshift({
      id: 'mov_f_' + uid(),
      fecha: today(),
      tipo: 'reposicion',
      monto,
      motivo: 'Reposición de fondo fijo'
    })
    _saveStore(data)
    return fondo
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. GASTOS OPERATIVOS API
// ─────────────────────────────────────────────────────────────────────────────
export const GastosAPI = {
  getAll(filters = {}) {
    const data = _getStore()
    let list = data.gastos_operativos || []
    if (filters.categoria) list = list.filter(g => g.categoria === filters.categoria)
    if (filters.estado) list = list.filter(g => g.estado === filters.estado)
    return list.sort((a, b) => (b.fecha_vencimiento || '').localeCompare(a.fecha_vencimiento || ''))
  },
  create(gastoData) {
    const data = _getStore()
    const nuevo = {
      id: 'gas_' + uid(),
      fecha_vencimiento: today(),
      estado: 'pendiente',
      ...gastoData
    }
    if (!data.gastos_operativos) data.gastos_operativos = []
    data.gastos_operativos.unshift(nuevo)
    _saveStore(data)
    return nuevo
  },
  marcarPagado(id, fechaPago = today()) {
    const data = _getStore()
    const gasto = (data.gastos_operativos || []).find(g => g.id === id)
    if (gasto) {
      gasto.estado = 'pagado'
      gasto.fecha_pago = fechaPago
      _saveStore(data)
      return gasto
    }
    return null
  },
  getVencimientosProximos(dias = 15) {
    return this.getAll().filter(g => g.estado === 'pendiente')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. TESORERÍA API
// ─────────────────────────────────────────────────────────────────────────────
export const TesoreriaAPI = {
  getCuentas() {
    return _getStore().cuentas_tesoreria || []
  },
  getSaldoTotal() {
    return this.getCuentas().reduce((acc, c) => acc + (c.saldo || 0), 0)
  },
  registrarMovimiento(cuentaId, monto, tipo, concepto, referencia = null) {
    const data = _getStore()
    const cuenta = (data.cuentas_tesoreria || []).find(c => c.id === cuentaId || c.nombre === cuentaId)
    if (cuenta) {
      if (tipo === 'ingreso') cuenta.saldo += monto
      if (tipo === 'egreso') cuenta.saldo -= monto
    }

    if (!data.movimientos_tesoreria) data.movimientos_tesoreria = []
    const nuevoMov = {
      id: 'mov_t_' + uid(),
      cuenta_id: cuenta ? cuenta.id : cuentaId,
      cuenta_nombre: cuenta ? cuenta.nombre : cuentaId,
      fecha: today(),
      tipo,
      monto,
      concepto,
      referencia,
      created_at: new Date().toISOString()
    }
    data.movimientos_tesoreria.unshift(nuevoMov)
    _saveStore(data)
    return nuevoMov
  },
  getConciliacion() {
    return _getStore().movimientos_tesoreria || []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. RETIROS DE SOCIOS API
// ─────────────────────────────────────────────────────────────────────────────
export const RetirosAPI = {
  getAll() {
    return _getStore().retiros_socios || []
  },
  create(retiroData) {
    const data = _getStore()
    const nuevo = {
      id: 'ret_' + uid(),
      fecha: today(),
      tipo: 'retiro',
      ...retiroData
    }
    if (!data.retiros_socios) data.retiros_socios = []
    data.retiros_socios.unshift(nuevo)
    _saveStore(data)
    return nuevo
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. ALIANZAS Y ESTUDIOS CONTABLES API
// ─────────────────────────────────────────────────────────────────────────────
export const EstudiosAPI = {
  getAll() {
    return _getStore().estudios_aliados || []
  },
  create(estudioData) {
    const data = _getStore()
    const nuevo = {
      id: 'est_' + uid(),
      ...estudioData
    }
    if (!data.estudios_aliados) data.estudios_aliados = []
    data.estudios_aliados.push(nuevo)
    _saveStore(data)
    return nuevo
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. PRESENTISMO API
// ─────────────────────────────────────────────────────────────────────────────
export const PresentismoAPI = {
  getAll() {
    return _getStore().presentismo || []
  },
  getAusencias(colaboradorId = null) {
    let list = this.getAll()
    if (colaboradorId) list = list.filter(p => p.colaborador_id === colaboradorId)
    return list
  },
  registrar(novedadData) {
    const data = _getStore()
    const nueva = {
      id: 'nov_' + uid(),
      fecha: today(),
      ...novedadData
    }
    if (!data.presentismo) data.presentismo = []
    data.presentismo.unshift(nueva)
    _saveStore(data)
    return nueva
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. DASHBOARD & COBRANZAS METRICS API
// ─────────────────────────────────────────────────────────────────────────────
export const DashboardAPI = {
  getMetricasMes(anio, mes) {
    const facturas = FacturasAPI.getAll()
    const gastos = GastosAPI.getAll()
    const clientes = ClientesAPI.getAll().filter(c => c.tipo_contrato === 'abono_mensual')

    const ingresos_totales = facturas.reduce((acc, f) => acc + (f.monto || 0), 0)
    const egresos_totales = gastos.reduce((acc, g) => acc + (g.monto || 0), 0)
    const ganancia_neta = Math.max(0, ingresos_totales - egresos_totales)

    const cobradas = facturas.filter(f => f.estado === 'cobrada')
    const pendientes = facturas.filter(f => f.estado === 'pendiente' || f.estado === 'vencida')

    return {
      ingresos_totales,
      ganancia_neta,
      promedio_por_cliente: clientes.length > 0 ? Math.round(ingresos_totales / clientes.length) : 0,
      abonos_total_count: clientes.length,
      abonos_cobrados_count: cobradas.length,
      abonos_cobrados_monto: cobradas.reduce((acc, f) => acc + (f.monto || 0), 0),
      abonos_pendientes_monto: pendientes.reduce((acc, f) => acc + (f.monto || 0), 0),
      tareas_ejecutadas: TareasAPI.getAll().filter(t => t.estado === 'realizado' || t.estado === 'cobrado').length
    }
  },
  getAlertasOperativas() {
    const alertas = []
    const vencidas = FacturasAPI.getVencidas()
    vencidas.forEach(f => {
      const cli = ClientesAPI.getById(f.cliente_id)
      alertas.push({
        tipo: 'abono_vencido',
        cliente_nombre: cli?.nombre_comercial || 'Cliente',
        titulo: 'Abono Vencido (>15 días)',
        detalle: `Factura ${f.numero} pendiente de cobro`,
        monto: f.monto,
        dias: 18
      })
    })

    const fondos = FondosAPI.getAll()
    fondos.forEach(f => {
      if (f.saldo_actual < f.tope_fondo * 0.2) {
        alertas.push({
          tipo: 'fondo_agotandose',
          cliente_nombre: f.colaborador_nombre || 'Caja Chica',
          titulo: 'Fondo de Caja Chica Crítico',
          detalle: `Saldo disponible bajo: ${formatMoney(f.saldo_actual)} de ${formatMoney(f.tope_fondo)}`,
          monto: f.saldo_actual
        })
      }
    })

    return alertas
  },
  getListoParaFacturar() {
    const clientes = ClientesAPI.getAll().filter(c => c.tipo_contrato === 'abono_mensual')
    return clientes.map(c => ({
      cliente_id: c.id,
      cliente_nombre: c.nombre_comercial,
      concepto: 'Abono Mensual Recurrente',
      monto: c.monto_abono || 0,
      dia_facturacion: c.dia_facturacion || 5
    }))
  },
  getCashflowProjection(dias = 90) {
    const facturas = FacturasAPI.getAll()
    const gastos = GastosAPI.getAll()
    const baseIngresos = facturas.reduce((acc, f) => acc + (f.monto || 0), 0) || 850000
    const baseEgresos = gastos.reduce((acc, g) => acc + (g.monto || 0), 0) || 320000

    return {
      m1: { ingresos: baseIngresos, egresos: baseEgresos, balance: baseIngresos - baseEgresos },
      m2: { ingresos: Math.round(baseIngresos * 1.05), egresos: Math.round(baseEgresos * 1.02), balance: Math.round(baseIngresos * 1.05 - baseEgresos * 1.02) },
      m3: { ingresos: Math.round(baseIngresos * 1.12), egresos: Math.round(baseEgresos * 1.04), balance: Math.round(baseIngresos * 1.12 - baseEgresos * 1.04) },
    }
  }
}

export const CobranzasAPI = {
  getMorososByAntigüedad() {
    const facturas = FacturasAPI.getPendientes()
    const clientesMap = {}

    facturas.forEach(f => {
      if (!clientesMap[f.cliente_id]) {
        const cli = ClientesAPI.getById(f.cliente_id)
        clientesMap[f.cliente_id] = {
          id: f.cliente_id,
          nombre_comercial: cli?.nombre_comercial || 'Cliente',
          dueno_nombre: cli?.dueno_nombre || 'Contacto',
          whatsapp: cli?.whatsapp,
          rubro: cli?.rubro,
          saldo_deuda: 0,
          fecha_vencimiento_antigua: f.fecha,
        }
      }
      clientesMap[f.cliente_id].saldo_deuda += (f.monto || 0)
    })

    const todos = Object.values(clientesMap)
    return {
      d1_15: todos.slice(0, 2),
      d16_30: todos.slice(2, 4),
      d30_plus: todos.slice(4),
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. MÓDULO MAYORISTA & DISTRIBUCIÓN INTEGRADO (Mayorista a tu Casa)
// ─────────────────────────────────────────────────────────────────────────────
function _initWholesaleSeed() {
  const products = (PRODUCTS || []).map(p => ({
    id: p.id,
    sku: p.sku || 'SKU-' + p.id,
    name: p.name,
    brand: p.brand || 'Genérico',
    section: p.section || 'Almacén',
    category: p.category || 'Almacén',
    unit: p.unit || 'un.',
    cost: p.cost || Math.round(p.price * 0.7),
    price: p.price || 1000,
    margin: p.margin || 30,
    stock: p.stock ?? 25,
    min_stock: p.minStock ?? 5,
    status: p.status || 'activo',
    is_featured: p.isFeatured || false,
    image: p.image || null,
  }))

  const demoOrders = [
    {
      id: 'PED-1041',
      customer_name: 'Hugo Robles (Parrilla Los Robles)',
      customer_phone: '11 5566-7788',
      cliente_id: 'c2',
      delivery_type: 'domicilio',
      delivery_zone: 'Ituzaingó / Castelar',
      items: [
        { name: 'Aceite Natura x1500ml', quantity: 6, unit_price: 3200, subtotal: 19200 },
        { name: 'Arroz Lucchetti 1kg', quantity: 10, unit_price: 1850, subtotal: 18500 },
        { name: 'Combo Limpieza Gastronómica', quantity: 1, unit_price: 45000, subtotal: 45000 }
      ],
      total: 82700,
      payment_method: 'Cuenta Corriente PyME',
      status: 'Confirmado',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'PED-1042',
      customer_name: 'Distribuidora Máximo',
      customer_phone: '11 4455-2210',
      cliente_id: 'c4',
      delivery_type: 'retiro',
      delivery_zone: 'Depósito Ramos Mejía',
      items: [
        { name: 'Fideos Matarazzo Guisero 500g', quantity: 24, unit_price: 1250, subtotal: 30000 },
        { name: 'Puré de Tomate De Cecco', quantity: 36, unit_price: 950, subtotal: 34200 }
      ],
      total: 64200,
      payment_method: 'Transferencia Bancaria',
      status: 'En preparación',
      created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    }
  ]

  const suppliers = [
    { id: 'sup_1', name: 'Molinos Río de la Plata S.A.', cuit: '30-50001234-9', contacto: 'Mariano González', rubros: ['Almacén', 'Pastas'], telefono: '11 4321-8800' },
    { id: 'sup_2', name: 'Arcor Alimentos S.A.', cuit: '30-50279317-5', contacto: 'Luciana Herrera', rubros: ['Golosinas', 'Conservas'], telefono: '11 4310-7000' },
    { id: 'sup_3', name: 'Mastellone Hnos. (La Serenísima)', cuit: '30-50294812-8', contacto: 'Carlos Mendonça', rubros: ['Lácteos', 'Frescos'], telefono: '11 4724-5000' },
    { id: 'sup_4', name: 'Unilever Argentina', cuit: '30-50112233-1', contacto: 'Valeria Castro', rubros: ['Limpieza', 'Cuidado Personal'], telefono: '11 4890-0000' },
  ]

  const wholesaleState = {
    products,
    orders: demoOrders,
    suppliers,
    movements: [
      { id: 'mov_1', fecha: today(), sku: 'SKU-prod_M45', tipo: 'INGRESO', cantidad: 40, motivo: 'Recepción FC Molinos #8942', usuario: 'Máximo F.' },
      { id: 'mov_2', fecha: today(), sku: 'SKU-prod_M45', tipo: 'VENTA', cantidad: 6, motivo: 'Despacho Pedido #PED-1041', usuario: 'Carolina F.' }
    ]
  }

  localStorage.setItem(WHOLESALE_KEY, JSON.stringify(wholesaleState))
}

function _getWholesaleStore() {
  try {
    const raw = localStorage.getItem(WHOLESALE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  _initWholesaleSeed()
  return JSON.parse(localStorage.getItem(WHOLESALE_KEY))
}

function _saveWholesaleStore(data) {
  localStorage.setItem(WHOLESALE_KEY, JSON.stringify(data))
}

export const MayoristaAPI = {
  getProducts(filters = {}) {
    const store = _getWholesaleStore()
    let list = store.products || []
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q))
    }
    if (filters.category && filters.category !== 'todos') {
      list = list.filter(p => p.category === filters.category)
    }
    return list
  },
  getProductById(id) {
    return (_getWholesaleStore().products || []).find(p => p.id === id) || null
  },
  saveProduct(productData) {
    const store = _getWholesaleStore()
    const idx = store.products.findIndex(p => p.id === productData.id)
    if (idx !== -1) {
      store.products[idx] = { ...store.products[idx], ...productData, updated_at: new Date().toISOString() }
    } else {
      const nuevo = { id: 'prod_' + uid(), ...productData, created_at: new Date().toISOString() }
      store.products.unshift(nuevo)
    }
    _saveWholesaleStore(store)
    return true
  },
  ajustarStock(productId, cantidad, motivo = 'Ajuste inventario', usuario = 'Equipo') {
    const store = _getWholesaleStore()
    const p = store.products.find(item => item.id === productId)
    if (!p) return null
    const prev = p.stock || 0
    p.stock = Math.max(0, prev + cantidad)

    store.movements.unshift({
      id: 'mov_' + uid(),
      fecha: today(),
      sku: p.sku,
      producto_nombre: p.name,
      tipo: cantidad >= 0 ? 'INGRESO' : 'AJUSTE',
      cantidad: Math.abs(cantidad),
      motivo,
      usuario
    })
    _saveWholesaleStore(store)
    return p
  },
  getOrders(filters = {}) {
    const store = _getWholesaleStore()
    let list = store.orders || []
    if (filters.status && filters.status !== 'todos') {
      list = list.filter(o => o.status === filters.status)
    }
    if (filters.cliente_id) {
      list = list.filter(o => o.cliente_id === filters.cliente_id)
    }
    return list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  },
  createOrder(orderData) {
    const store = _getWholesaleStore()
    const nuevo = {
      id: 'PED-' + Math.floor(1000 + Math.random() * 9000),
      status: 'Confirmado',
      created_at: new Date().toISOString(),
      ...orderData
    }
    store.orders.unshift(nuevo)

    // Descontar stock automáticamente si coinciden los items
    if (nuevo.items && Array.isArray(nuevo.items)) {
      nuevo.items.forEach(it => {
        const prod = store.products.find(p => p.name === it.name || p.id === it.productId)
        if (prod) {
          prod.stock = Math.max(0, (prod.stock || 0) - (it.quantity || 1))
        }
      })
    }

    _saveWholesaleStore(store)
    return nuevo
  },
  updateOrderStatus(orderId, status) {
    const store = _getWholesaleStore()
    const order = store.orders.find(o => o.id === orderId)
    if (order) {
      order.status = status
      order.updated_at = new Date().toISOString()
      _saveWholesaleStore(store)
      return order
    }
    return null
  },
  convertOrderToClientInvoice(orderId, clienteId) {
    const store = _getWholesaleStore()
    const order = store.orders.find(o => o.id === orderId)
    if (!order) return null

    // Crear factura en Cuentas Corrientes de AdminYAAA
    const cli = ClientesAPI.getById(clienteId)
    const fac = FacturasAPI.create({
      cliente_id: clienteId,
      concepto: `Mercadería Mayorista — Pedido #${order.id}`,
      monto: order.total,
      estado: 'pendiente'
    })

    order.factura_id = fac.id
    order.cliente_id = clienteId
    _saveWholesaleStore(store)
    return fac
  },
  getMovements() {
    return _getWholesaleStore().movements || []
  },
  getSuppliers() {
    return _getWholesaleStore().suppliers || []
  },
  getCombos() {
    return COMBOS || []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. PORTAL DE CLIENTES (DOCUMENTOS COMPARTIDOS Y GESTIÓN CLIENTE)
// ─────────────────────────────────────────────────────────────────────────────
const DOCS_KEY = 'ay_v2_client_docs'

function _getClientDocsStore() {
  try {
    const raw = localStorage.getItem(DOCS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  const seed = [
    {
      id: 'doc_1',
      cliente_id: 'c2',
      nombre_archivo: 'Comprobante_Pago_AFIP_Sep2026.pdf',
      tipo: 'comprobante_pago',
      tamano: '1.2 MB',
      estado: 'procesado',
      fecha: today(),
      subido_por: 'Hugo Robles',
      nota: 'Adjunto el VEP abonado por banco el día de hoy.'
    },
    {
      id: 'doc_2',
      cliente_id: 'c2',
      nombre_archivo: 'Novedades_Personal_Quincena2.xlsx',
      tipo: 'novedades_sueldos',
      tamano: '450 KB',
      estado: 'en_revision',
      fecha: today(),
      subido_por: 'Hugo Robles',
      nota: 'Falta un mozo el fin de semana, están los detalles adentro.'
    }
  ]
  localStorage.setItem(DOCS_KEY, JSON.stringify(seed))
  return seed
}

export const PortalClienteAPI = {
  getClienteData(clienteId) {
    return ClientesAPI.getById(clienteId)
  },
  getDocumentos(clienteId) {
    const all = _getClientDocsStore()
    return all.filter(d => d.cliente_id === clienteId)
  },
  subirDocumento(clienteId, docData) {
    const all = _getClientDocsStore()
    const nuevo = {
      id: 'doc_' + uid(),
      cliente_id: clienteId,
      fecha: today(),
      estado: 'en_revision',
      created_at: new Date().toISOString(),
      ...docData
    }
    all.unshift(nuevo)
    localStorage.setItem(DOCS_KEY, JSON.stringify(all))

    // Registrar tarea para el equipo de AdminYAAA
    TareasAPI.create({
      cliente_id: clienteId,
      descripcion: `Procesar documento subido por cliente: ${nuevo.nombre_archivo}`,
      tipo: 'Revisión Documentación',
      estado: 'pendiente'
    })

    return nuevo
  },
  getMisFacturas(clienteId) {
    return FacturasAPI.getByCliente(clienteId)
  },
  getMisPagos(clienteId) {
    return PagosAPI.getByCliente(clienteId)
  },
  getMisTareas(clienteId) {
    return TareasAPI.getByCliente(clienteId)
  },
  getMisPedidosMayoristas(clienteId) {
    return MayoristaAPI.getOrders({ cliente_id: clienteId })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 18. BÓVEDA DE CLAVES Y CREDENCIALES SENSIBLES (CRIPTO AES-256)
// ─────────────────────────────────────────────────────────────────────────────
function _initVaultSeed() {
  const seedVault = [
    {
      id: 'vlt_1',
      cliente_id: 'c2',
      cliente_nombre: 'Parrilla Los Robles',
      categoria: 'ARCA / AFIP',
      identificador: 'CUIT 30-71458920-4',
      secreto_cifrado: 'U2FsdGVkX19q8a9mZ0GkL4m...', // Simulado AES en demo
      clave_plana_demo: 'RoblesAfip$2026',
      nivel_seguridad: 'Clave Fiscal Nivel 3',
      notas: 'Incluye delegación de Facturación Electrónica al contador.',
      ultimo_acceso: today()
    },
    {
      id: 'vlt_2',
      cliente_id: 'c2',
      cliente_nombre: 'Parrilla Los Robles',
      categoria: 'Homebanking / Banco',
      identificador: 'Banco Galicia (Operador)',
      secreto_cifrado: 'U2FsdGVkX1+v52aWk...',
      clave_plana_demo: 'GaliciaParrilla#99',
      nivel_seguridad: 'Solo consultas y pagos de haberes',
      notas: 'Usuario de consulta bancaria para conciliación.',
      ultimo_acceso: today()
    },
    {
      id: 'vlt_3',
      cliente_id: 'c4',
      cliente_nombre: 'Distribuidora Máximo',
      categoria: 'ARCA / AFIP',
      identificador: 'CUIT 30-68940123-2',
      secreto_cifrado: 'U2FsdGVkX18mN42a...',
      clave_plana_demo: 'MaximoDist2026*',
      nivel_seguridad: 'Clave Fiscal Nivel 3',
      notas: 'Administración de CAEA y Remito Electrónico Cárnico/Almacén.',
      ultimo_acceso: today()
    },
    {
      id: 'vlt_4',
      cliente_id: 'c4',
      cliente_nombre: 'Distribuidora Máximo',
      categoria: 'Software Punto de Venta',
      identificador: 'Tango Gestión / Servidor Local',
      secreto_cifrado: 'U2FsdGVkX19tY29...',
      clave_plana_demo: 'AdminTango#2026!',
      nivel_seguridad: 'Admin BackOffice',
      notas: 'Conexión VPN y base SQL de depósito.',
      ultimo_acceso: today()
    }
  ]

  const auditLog = [
    { id: 'aud_1', fecha: today(), usuario: 'ralukita101@gmail.com', accion: 'Consulta de clave ARCA (Parrilla Los Robles)' },
    { id: 'aud_2', fecha: today(), usuario: 'ralukita101@gmail.com', accion: 'Creación de bóveda de seguridad inicial' }
  ]

  localStorage.setItem(VAULT_KEY, JSON.stringify({ credentials: seedVault, audit: auditLog }))
}

export const BovedaAPI = {
  getAll() {
    try {
      const data = JSON.parse(localStorage.getItem(VAULT_KEY))
      return data?.credentials || []
    } catch {
      return []
    }
  },
  getAuditLog() {
    try {
      const data = JSON.parse(localStorage.getItem(VAULT_KEY))
      return data?.audit || []
    } catch {
      return []
    }
  },
  saveCredential(credData, usuarioEmail = 'ralukita101@gmail.com') {
    const raw = JSON.parse(localStorage.getItem(VAULT_KEY) || '{"credentials":[],"audit":[]}')
    const nuevo = {
      id: 'vlt_' + uid(),
      ultimo_acceso: today(),
      ...credData
    }
    raw.credentials.unshift(nuevo)
    raw.audit.unshift({
      id: 'aud_' + uid(),
      fecha: today(),
      usuario: usuarioEmail,
      accion: `Alta de credencial confidencial para ${credData.cliente_nombre}`
    })
    localStorage.setItem(VAULT_KEY, JSON.stringify(raw))
    return nuevo
  },
  revealCredential(id, usuarioEmail = 'ralukita101@gmail.com') {
    const raw = JSON.parse(localStorage.getItem(VAULT_KEY) || '{"credentials":[],"audit":[]}')
    const item = raw.credentials.find(c => c.id === id)
    if (item) {
      item.ultimo_acceso = new Date().toLocaleString('es-AR')
      raw.audit.unshift({
        id: 'aud_' + uid(),
        fecha: new Date().toLocaleString('es-AR'),
        usuario: usuarioEmail,
        accion: `Clave revelada/copiada: ${item.cliente_nombre} (${item.categoria})`
      })
      localStorage.setItem(VAULT_KEY, JSON.stringify(raw))
      return item.clave_plana_demo || 'ClaveSegura2026!'
    }
    return null
  },
  deleteCredential(id, usuarioEmail = 'ralukita101@gmail.com') {
    const raw = JSON.parse(localStorage.getItem(VAULT_KEY) || '{"credentials":[],"audit":[]}')
    const idx = raw.credentials.findIndex(c => c.id === id)
    if (idx !== -1) {
      const removed = raw.credentials.splice(idx, 1)[0]
      raw.audit.unshift({
        id: 'aud_' + uid(),
        fecha: today(),
        usuario: usuarioEmail,
        accion: `Baja de credencial confidencial de ${removed.cliente_nombre}`
      })
      localStorage.setItem(VAULT_KEY, JSON.stringify(raw))
      return true
    }
    return false
  }
}
