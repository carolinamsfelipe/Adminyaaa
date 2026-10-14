/**
 * api.js — Capa de datos de AdminYAAA
 *
 * Simula una API RESTful con datos de demo almacenados en memoria.
 * Cada función es async para que el reemplazo por Supabase sea sin fricción:
 *   - Cambiar el cuerpo de la función por `supabase.from('tabla').select(...)`
 *   - Mantener la misma firma y tipo de retorno
 *
 * Convenciones:
 *   - Soft delete: los registros eliminados tienen `deleted_at` != null
 *   - IDs: strings cortos prefijados por entidad (c1, t1, f1, p1, etc.)
 *   - Fechas en storage: 'YYYY-MM-DD'
 *   - Montos en números enteros (pesos sin decimales)
 */

import { today } from '../core/utils.js'
import { DEMO_USERS } from '../core/auth.js'

// ─── Latencia simulada ─────────────────────────────────────────────────────────
const delay = (ms = 120) => new Promise(r => setTimeout(r, ms))

// ─── IDs de equipo ─────────────────────────────────────────────────────────────
export const TEAM = DEMO_USERS.map(u => ({
  id:       u.id,
  nombre:   u.nombre,
  iniciales: u.iniciales,
  role:     u.role,
  avatar_color: u.avatar_color,
}))

// ─── Estudios aliados ──────────────────────────────────────────────────────────
export const ESTUDIOS_ALIADOS = [
  { id: 'ea1', nombre: 'Estudio Russo & Asoc.' },
  { id: 'ea2', nombre: 'Estudio Pérez Contadores' },
  { id: 'ea3', nombre: 'Dr. Marcelo Gauna CPN' },
]

// ─────────────────────────────────────────────────────────────────────────────
// DATOS DE DEMO EN MEMORIA
// ─────────────────────────────────────────────────────────────────────────────

/** @type {Cliente[]} */
let _clientes = [
  {
    id:               'c1',
    nombre_comercial: 'La Birra Bar',
    razon_social:     'Fernández Hnos. SRL',
    cuit:             '30-71234567-9',
    rubro:            'Gastronomía',
    tipo_contrato:    'abono_mensual',
    monto_abono:      85000,
    dia_facturacion:  5,
    direccion:        'Av. Corrientes 1845, CABA',
    duenio_contacto:  'Rodrigo Fernández',
    whatsapp:         '5491144556677',
    estudio_aliado:   'ea1',
    operador_id:      'u2',
    notas:            'Cliente desde 2022. Siempre puntual. Prefiere comunicación por WhatsApp.',
    estado:           'activo',
    desde:            '2022-03-10',
    deleted_at:       null,
  },
  {
    id:               'c2',
    nombre_comercial: 'Distribuidora Norte SRL',
    razon_social:     'Norte Distribuciones SRL',
    cuit:             '30-68891234-5',
    rubro:            'Distribuidora',
    tipo_contrato:    'abono_mensual',
    monto_abono:      120000,
    dia_facturacion:  1,
    direccion:        'Ruta 8 km 42, Pilar',
    duenio_contacto:  'Gustavo Almada',
    whatsapp:         '5491122334455',
    estudio_aliado:   null,
    operador_id:      'u2',
    notas:            'Distribuidora de alimentos. Requiere planilla mensual.',
    estado:           'activo',
    desde:            '2021-07-15',
    deleted_at:       null,
  },
  {
    id:               'c3',
    nombre_comercial: 'Comercio El Parque',
    razon_social:     'Parque Comercio SA',
    cuit:             '30-70012345-6',
    rubro:            'Comercio',
    tipo_contrato:    'trabajo_puntual',
    monto_abono:      null,
    dia_facturacion:  15,
    direccion:        'San Martín 342, Morón',
    duenio_contacto:  'Patricia Leiva',
    whatsapp:         '5491155443322',
    estudio_aliado:   'ea2',
    operador_id:      'u2',
    notas:            '',
    estado:           'activo',
    desde:            '2023-01-20',
    deleted_at:       null,
  },
  {
    id:               'c4',
    nombre_comercial: 'Pizzería Don Lucho',
    razon_social:     'Luciano Herrera',
    cuit:             '20-28765432-1',
    rubro:            'Gastronomía',
    tipo_contrato:    'abono_mensual',
    monto_abono:      65000,
    dia_facturacion:  10,
    direccion:        'Belgrano 1290, Ramos Mejía',
    duenio_contacto:  'Luciano Herrera',
    whatsapp:         '5491166778899',
    estudio_aliado:   null,
    operador_id:      'u3',
    notas:            'Pago atrasado recurrente. Recordatorio cada 5 del mes.',
    estado:           'activo',
    desde:            '2022-11-03',
    deleted_at:       null,
  },
  {
    id:               'c5',
    nombre_comercial: 'Tech Solutions SA',
    razon_social:     'Tech Solutions SA',
    cuit:             '30-71567890-2',
    rubro:            'Servicio',
    tipo_contrato:    'abono_mensual',
    monto_abono:      150000,
    dia_facturacion:  20,
    direccion:        'Reconquista 775 6°B, CABA',
    duenio_contacto:  'María Sol Tronco',
    whatsapp:         '5491177889900',
    estudio_aliado:   'ea3',
    operador_id:      'u3',
    notas:            '',
    estado:           'activo',
    desde:            '2023-05-09',
    deleted_at:       null,
  },
  {
    id:               'c6',
    nombre_comercial: 'Estudio Gómez CPN',
    razon_social:     'Claudia Gómez',
    cuit:             '27-23456789-4',
    rubro:            'Estudio Contable',
    tipo_contrato:    'trabajo_puntual',
    monto_abono:      null,
    dia_facturacion:  null,
    direccion:        'Av. Santa Fe 2100, CABA',
    duenio_contacto:  'Claudia Gómez',
    whatsapp:         '5491133221100',
    estudio_aliado:   null,
    operador_id:      'u1',
    notas:            'Aliada. Nos envía derivaciones frecuentes.',
    estado:           'activo',
    desde:            '2020-08-01',
    deleted_at:       null,
  },
  {
    id:               'c7',
    nombre_comercial: 'Panadería La Unión',
    razon_social:     'Omar Ríos',
    cuit:             '20-16789012-3',
    rubro:            'Comercio',
    tipo_contrato:    'abono_mensual',
    monto_abono:      45000,
    dia_facturacion:  1,
    direccion:        'Mitre 780, Haedo',
    duenio_contacto:  'Omar Ríos',
    whatsapp:         '5491199887766',
    estudio_aliado:   null,
    operador_id:      'u2',
    notas:            '',
    estado:           'inactivo',
    desde:            '2021-02-14',
    deleted_at:       null,
  },
]

/** @type {Tarea[]} */
let _tareas = [
  {
    id:          't1',
    cliente_id:  'c1',
    operador_id: 'u2',
    descripcion: 'Liquidación mensual de IVA',
    fecha:       '2026-09-15',
    estado:      'completada',
    tipo:        'abono',
    deleted_at:  null,
  },
  {
    id:          't2',
    cliente_id:  'c1',
    operador_id: 'u2',
    descripcion: 'Planilla de personal (Septiembre)',
    fecha:       '2026-09-20',
    estado:      'completada',
    tipo:        'abono',
    deleted_at:  null,
  },
  {
    id:          't3',
    cliente_id:  'c2',
    operador_id: 'u2',
    descripcion: 'Liquidación de Ganancias',
    fecha:       '2026-09-10',
    estado:      'completada',
    tipo:        'abono',
    deleted_at:  null,
  },
  {
    id:          't4',
    cliente_id:  'c3',
    operador_id: 'u2',
    descripcion: 'Presentación DDJJ Mensual',
    fecha:       '2026-09-28',
    estado:      'pendiente',
    tipo:        'puntual',
    deleted_at:  null,
  },
  {
    id:          't5',
    cliente_id:  'c4',
    operador_id: 'u3',
    descripcion: 'Liquidación de sueldos (Septiembre)',
    fecha:       '2026-09-25',
    estado:      'completada',
    tipo:        'abono',
    deleted_at:  null,
  },
  {
    id:          't6',
    cliente_id:  'c5',
    operador_id: 'u3',
    descripcion: 'Asesoría societaria — revisión estatuto',
    fecha:       '2026-09-18',
    estado:      'completada',
    tipo:        'puntual',
    deleted_at:  null,
  },
  {
    id:          't7',
    cliente_id:  'c5',
    operador_id: 'u3',
    descripcion: 'Presentación IVA Agosto',
    fecha:       '2026-09-05',
    estado:      'completada',
    tipo:        'abono',
    deleted_at:  null,
  },
  {
    id:          't8',
    cliente_id:  'c4',
    operador_id: 'u3',
    descripcion: 'Habilitación municipal',
    fecha:       today(),
    estado:      'en_progreso',
    tipo:        'puntual',
    deleted_at:  null,
  },
  {
    id:          't9',
    cliente_id:  'c2',
    operador_id: 'u2',
    descripcion: 'Cierre contable mensual',
    fecha:       today(),
    estado:      'pendiente',
    tipo:        'abono',
    deleted_at:  null,
  },
  {
    id:          't10',
    cliente_id:  'c6',
    operador_id: 'u1',
    descripcion: 'Reunión de coordinación trimestral',
    fecha:       '2026-09-12',
    estado:      'completada',
    tipo:        'puntual',
    deleted_at:  null,
  },
]

/** @type {Factura[]} */
let _facturas = [
  {
    id:          'f1',
    cliente_id:  'c1',
    concepto:    'Abono mensual — Septiembre 2026',
    monto:       85000,
    fecha:       '2026-09-05',
    estado:      'cobrada',
    deleted_at:  null,
  },
  {
    id:          'f2',
    cliente_id:  'c2',
    concepto:    'Abono mensual — Septiembre 2026',
    monto:       120000,
    fecha:       '2026-09-01',
    estado:      'cobrada',
    deleted_at:  null,
  },
  {
    id:          'f3',
    cliente_id:  'c4',
    concepto:    'Abono mensual — Septiembre 2026',
    monto:       65000,
    fecha:       '2026-09-10',
    estado:      'emitida',
    deleted_at:  null,
  },
  {
    id:          'f4',
    cliente_id:  'c5',
    concepto:    'Abono mensual — Septiembre 2026',
    monto:       150000,
    fecha:       '2026-09-20',
    estado:      'emitida',
    deleted_at:  null,
  },
  {
    id:          'f5',
    cliente_id:  'c1',
    concepto:    'Abono mensual — Agosto 2026',
    monto:       85000,
    fecha:       '2026-08-05',
    estado:      'cobrada',
    deleted_at:  null,
  },
  {
    id:          'f6',
    cliente_id:  'c2',
    concepto:    'Abono mensual — Agosto 2026',
    monto:       120000,
    fecha:       '2026-08-01',
    estado:      'cobrada',
    deleted_at:  null,
  },
  {
    id:          'f7',
    cliente_id:  'c4',
    concepto:    'Abono mensual — Agosto 2026',
    monto:       65000,
    fecha:       '2026-08-10',
    estado:      'cobrada',
    deleted_at:  null,
  },
  {
    id:          'f8',
    cliente_id:  'c3',
    concepto:    'Presentación DDJJ — Trabajo puntual',
    monto:       35000,
    fecha:       '2026-09-28',
    estado:      'pendiente',
    deleted_at:  null,
  },
]

/** @type {Pago[]} */
let _pagos = [
  {
    id:          'p1',
    cliente_id:  'c1',
    factura_id:  'f1',
    monto:       85000,
    fecha:       '2026-09-06',
    metodo:      'transferencia',
    deleted_at:  null,
  },
  {
    id:          'p2',
    cliente_id:  'c2',
    factura_id:  'f2',
    monto:       120000,
    fecha:       '2026-09-02',
    metodo:      'transferencia',
    deleted_at:  null,
  },
  {
    id:          'p3',
    cliente_id:  'c1',
    factura_id:  'f5',
    monto:       85000,
    fecha:       '2026-08-06',
    metodo:      'efectivo',
    deleted_at:  null,
  },
  {
    id:          'p4',
    cliente_id:  'c2',
    factura_id:  'f6',
    monto:       120000,
    fecha:       '2026-08-02',
    metodo:      'transferencia',
    deleted_at:  null,
  },
  {
    id:          'p5',
    cliente_id:  'c4',
    factura_id:  'f7',
    monto:       65000,
    fecha:       '2026-08-15',
    metodo:      'efectivo',
    deleted_at:  null,
  },
]

/** @type {CuentaTesoreria[]} */
const _tesoreria = [
  { id: 'tr1', nombre: 'Cuenta Corriente Banco Galicia', saldo: 1250000 },
  { id: 'tr2', nombre: 'Cuenta Santander Operaciones',   saldo: 780000 },
  { id: 'tr3', nombre: 'Efectivo Caja Central',          saldo: 45000 },
]

/** @type {FondoCaja[]} */
const _fondos = [
  { id: 'fnd1', operador_id: 'u2', nombre: 'Caja Chica Máximo', saldo: 8000,  limite: 50000 },
  { id: 'fnd2', operador_id: 'u3', nombre: 'Caja Chica Carolina', saldo: 4500, limite: 30000 },
]

// ─── Helpers internos ──────────────────────────────────────────────────────────

/** Genera el próximo ID para una colección con prefijo dado. */
function nextId(collection, prefix) {
  const nums = collection
    .map(item => parseInt(item.id.replace(prefix, ''), 10))
    .filter(n => !isNaN(n))
  return prefix + (Math.max(0, ...nums) + 1)
}

/** Retorna una copia sin campos deleted_at != null por defecto. */
function active(arr) {
  return arr.filter(item => item.deleted_at == null)
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTES API
// ─────────────────────────────────────────────────────────────────────────────

export const ClientesAPI = {

  /** Lista todos los clientes activos (no borrados). */
  async list() {
    await delay()
    return active(_clientes)
  },

  /** Obtiene un cliente por ID. */
  async get(id) {
    await delay()
    return _clientes.find(c => c.id === id && c.deleted_at == null) ?? null
  },

  /** Crea un nuevo cliente. */
  async create(data) {
    await delay()
    const nuevo = {
      ...data,
      id:         nextId(_clientes, 'c'),
      estado:     data.estado ?? 'activo',
      desde:      data.desde ?? today(),
      deleted_at: null,
    }
    _clientes.push(nuevo)
    return nuevo
  },

  /** Actualiza campos de un cliente existente. */
  async update(id, data) {
    await delay()
    const idx = _clientes.findIndex(c => c.id === id)
    if (idx === -1) throw new Error(`Cliente ${id} no encontrado`)
    _clientes[idx] = { ..._clientes[idx], ...data }
    return _clientes[idx]
  },

  /** Soft-delete de un cliente. */
  async archive(id) {
    await delay()
    const idx = _clientes.findIndex(c => c.id === id)
    if (idx === -1) throw new Error(`Cliente ${id} no encontrado`)
    _clientes[idx].deleted_at = new Date().toISOString()
    _clientes[idx].estado = 'inactivo'
    return _clientes[idx]
  },

  /** Resumen financiero de un cliente para el tab "Cuenta Corriente". */
  async resumenFinanciero(clienteId) {
    await delay()
    const facturas = _facturas.filter(f => f.cliente_id === clienteId && f.deleted_at == null)
    const pagos    = _pagos.filter(p => p.cliente_id === clienteId && p.deleted_at == null)
    const year     = new Date().getFullYear().toString()

    const totalFacturadoAnio = facturas
      .filter(f => f.fecha?.startsWith(year))
      .reduce((acc, f) => acc + f.monto, 0)

    const totalCobrado = pagos.reduce((acc, p) => acc + p.monto, 0)

    const saldoDeuda = facturas
      .filter(f => f.estado !== 'cobrada')
      .reduce((acc, f) => acc + f.monto, 0)

    return { totalFacturadoAnio, totalCobrado, saldoDeuda }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// TAREAS API
// ─────────────────────────────────────────────────────────────────────────────

export const TareasAPI = {

  /** Lista todas las tareas activas, opcionalmente filtradas por cliente u operador. */
  async list({ clienteId, operadorId, estado, fechaDesde, fechaHasta } = {}) {
    await delay()
    let result = active(_tareas)
    if (clienteId)  result = result.filter(t => t.cliente_id  === clienteId)
    if (operadorId) result = result.filter(t => t.operador_id === operadorId)
    if (estado)     result = result.filter(t => t.estado      === estado)
    if (fechaDesde) result = result.filter(t => t.fecha >= fechaDesde)
    if (fechaHasta) result = result.filter(t => t.fecha <= fechaHasta)
    return result.sort((a, b) => b.fecha.localeCompare(a.fecha))
  },

  /** Obtiene una tarea por ID. */
  async get(id) {
    await delay()
    return _tareas.find(t => t.id === id && t.deleted_at == null) ?? null
  },

  /** Crea una nueva tarea. */
  async create(data) {
    await delay()
    const nueva = {
      ...data,
      id:         nextId(_tareas, 't'),
      fecha:      data.fecha ?? today(),
      estado:     data.estado ?? 'pendiente',
      deleted_at: null,
    }
    _tareas.push(nueva)
    return nueva
  },

  /** Actualiza campos de una tarea. */
  async update(id, data) {
    await delay()
    const idx = _tareas.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Tarea ${id} no encontrada`)
    _tareas[idx] = { ..._tareas[idx], ...data }
    return _tareas[idx]
  },

  /** Soft-delete de una tarea. */
  async delete(id) {
    await delay()
    const idx = _tareas.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Tarea ${id} no encontrada`)
    _tareas[idx].deleted_at = new Date().toISOString()
    return _tareas[idx]
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTURAS API
// ─────────────────────────────────────────────────────────────────────────────

export const FacturasAPI = {

  /** Lista facturas, opcionalmente por cliente o estado. */
  async list({ clienteId, estado, mes, anio } = {}) {
    await delay()
    let result = active(_facturas)
    if (clienteId) result = result.filter(f => f.cliente_id === clienteId)
    if (estado)    result = result.filter(f => f.estado     === estado)
    if (mes && anio) {
      const prefix = `${anio}-${String(mes).padStart(2, '0')}`
      result = result.filter(f => f.fecha?.startsWith(prefix))
    }
    return result.sort((a, b) => b.fecha.localeCompare(a.fecha))
  },

  /** Crea una factura. */
  async create(data) {
    await delay()
    const nueva = {
      ...data,
      id:         nextId(_facturas, 'f'),
      fecha:      data.fecha ?? today(),
      estado:     data.estado ?? 'emitida',
      deleted_at: null,
    }
    _facturas.push(nueva)
    return nueva
  },

  /** Actualiza campos de una factura (ej: marcar como cobrada). */
  async update(id, data) {
    await delay()
    const idx = _facturas.findIndex(f => f.id === id)
    if (idx === -1) throw new Error(`Factura ${id} no encontrada`)
    _facturas[idx] = { ..._facturas[idx], ...data }
    return _facturas[idx]
  },

  /** Marca varias facturas como facturadas (por IDs). */
  async marcarFacturadas(ids) {
    await delay()
    const updated = []
    for (const id of ids) {
      const idx = _facturas.findIndex(f => f.id === id)
      if (idx !== -1) {
        _facturas[idx].estado = 'emitida'
        updated.push(_facturas[idx])
      }
    }
    return updated
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGOS API
// ─────────────────────────────────────────────────────────────────────────────

export const PagosAPI = {

  /** Lista pagos de un cliente o todos. */
  async list({ clienteId } = {}) {
    await delay()
    let result = active(_pagos)
    if (clienteId) result = result.filter(p => p.cliente_id === clienteId)
    return result.sort((a, b) => b.fecha.localeCompare(a.fecha))
  },

  /** Registra un nuevo pago. Aplica FIFO sobre facturas pendientes. */
  async create(data) {
    await delay()
    const nuevo = {
      ...data,
      id:         nextId(_pagos, 'p'),
      fecha:      data.fecha ?? today(),
      deleted_at: null,
    }
    _pagos.push(nuevo)

    // Si se especificó factura_id, marcarla como cobrada
    if (data.factura_id) {
      const idx = _facturas.findIndex(f => f.id === data.factura_id)
      if (idx !== -1) _facturas[idx].estado = 'cobrada'
    }

    return nuevo
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD API
// ─────────────────────────────────────────────────────────────────────────────

export const DashboardAPI = {

  /**
   * Retorna todas las métricas ejecutivas del mes actual.
   */
  async getMetricas() {
    await delay(200)

    const now   = new Date()
    const mesA  = now.getFullYear().toString() + '-' + String(now.getMonth() + 1).padStart(2, '0')
    const mesAnt = (() => {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      return d.getFullYear().toString() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    })()

    // Facturas del mes actual
    const factsMes = _facturas.filter(f => f.deleted_at == null && f.fecha?.startsWith(mesA))
    const factsMesAnt = _facturas.filter(f => f.deleted_at == null && f.fecha?.startsWith(mesAnt))

    const ingresosMes = factsMes.reduce((s, f) => s + f.monto, 0)
    const ingresosMesAnt = factsMesAnt.reduce((s, f) => s + f.monto, 0)

    // Gastos operativos simulados
    const gastosOp = 180000
    const gastosOpAnt = 165000

    const gananciaNeta = ingresosMes - gastosOp
    const margenPct    = ingresosMes > 0 ? Math.round((gananciaNeta / ingresosMes) * 100) : 0

    // Abonos
    const clientesAbono = _clientes.filter(c => c.deleted_at == null && c.tipo_contrato === 'abono_mensual' && c.estado === 'activo')
    const abonosCobrados = _pagos.filter(p => p.deleted_at == null && p.fecha?.startsWith(mesA)).length
    const totalAbonos = clientesAbono.length

    // Tareas completadas este mes
    const tareasCompletadas = _tareas.filter(t =>
      t.deleted_at == null &&
      t.estado === 'completada' &&
      t.fecha?.startsWith(mesA)
    ).length
    const tareasCompletadasAnt = _tareas.filter(t =>
      t.deleted_at == null &&
      t.estado === 'completada' &&
      t.fecha?.startsWith(mesAnt)
    ).length

    // Tesorería
    const saldoTesoreria = _tesoreria.reduce((s, t) => s + t.saldo, 0)

    // Clientes activos
    const clientesActivos = _clientes.filter(c => c.deleted_at == null && c.estado === 'activo').length

    return {
      ingresosMes,
      ingresosMesAnt,
      gananciaNeta,
      margenPct,
      gastosOp,
      abonosCobrados,
      totalAbonos,
      tareasCompletadas,
      tareasCompletadasAnt,
      saldoTesoreria,
      clientesActivos,
    }
  },

  /**
   * Retorna alertas activas del sistema.
   */
  async getAlertas() {
    await delay(150)
    const alertas = []
    const now = new Date()
    const mesA = now.getFullYear().toString() + '-' + String(now.getMonth() + 1).padStart(2, '0')

    // 1. Facturas pendientes de cobro
    const facturasPendientes = _facturas.filter(f =>
      f.deleted_at == null &&
      (f.estado === 'emitida' || f.estado === 'pendiente')
    )
    facturasPendientes.forEach(f => {
      const cliente = _clientes.find(c => c.id === f.cliente_id)
      if (cliente) {
        alertas.push({
          tipo:    'factura_pendiente',
          nivel:   'warning',
          mensaje: `${cliente.nombre_comercial} — Factura pendiente de cobro: ${f.concepto}`,
          monto:   f.monto,
          fecha:   f.fecha,
        })
      }
    })

    // 2. Abonos vencidos hace más de 15 días
    _clientes
      .filter(c => c.deleted_at == null && c.tipo_contrato === 'abono_mensual' && c.estado === 'activo')
      .forEach(c => {
        const tieneFacturaMes = _facturas.some(f =>
          f.cliente_id === c.id &&
          f.fecha?.startsWith(mesA) &&
          f.deleted_at == null
        )
        if (!tieneFacturaMes && c.dia_facturacion) {
          const diaVenc = new Date(now.getFullYear(), now.getMonth(), c.dia_facturacion)
          const diffDias = Math.round((now - diaVenc) / 86400000)
          if (diffDias > 15) {
            alertas.push({
              tipo:    'abono_vencido',
              nivel:   'danger',
              mensaje: `${c.nombre_comercial} — Abono sin facturar hace ${diffDias} días`,
              fecha:   diaVenc.toISOString().substring(0, 10),
            })
          }
        }
      })

    // 3. Fondos por debajo del 20% del límite
    _fondos.forEach(f => {
      const pct = f.limite > 0 ? (f.saldo / f.limite) * 100 : 100
      if (pct < 20) {
        alertas.push({
          tipo:    'fondo_bajo',
          nivel:   'warning',
          mensaje: `${f.nombre} — Saldo bajo: ${Math.round(pct)}% del límite`,
        })
      }
    })

    // 4. Próximos vencimientos en 7 días
    const en7dias = new Date(now)
    en7dias.setDate(en7dias.getDate() + 7)
    _clientes
      .filter(c => c.deleted_at == null && c.tipo_contrato === 'abono_mensual' && c.estado === 'activo' && c.dia_facturacion)
      .forEach(c => {
        const proxVenc = new Date(now.getFullYear(), now.getMonth(), c.dia_facturacion)
        if (proxVenc <= now) proxVenc.setMonth(proxVenc.getMonth() + 1)
        if (proxVenc <= en7dias) {
          alertas.push({
            tipo:    'vencimiento_proximo',
            nivel:   'info',
            mensaje: `${c.nombre_comercial} — Vence el día ${c.dia_facturacion} (en ${Math.round((proxVenc - now) / 86400000)} días)`,
          })
        }
      })

    return alertas
  },

  /**
   * Retorna servicios/abonos listos para facturar este mes.
   */
  async getListoParaFacturar() {
    await delay(100)
    const mesA = (() => {
      const n = new Date()
      return n.getFullYear().toString() + '-' + String(n.getMonth() + 1).padStart(2, '0')
    })()

    const result = []
    _clientes
      .filter(c => c.deleted_at == null && c.tipo_contrato === 'abono_mensual' && c.estado === 'activo')
      .forEach(c => {
        const yaFacturado = _facturas.some(f =>
          f.cliente_id === c.id &&
          f.fecha?.startsWith(mesA) &&
          f.deleted_at == null
        )
        result.push({
          id:          `lf_${c.id}`,
          cliente_id:  c.id,
          cliente:     c.nombre_comercial,
          concepto:    `Abono mensual — ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`,
          monto:       c.monto_abono,
          dia_factura: c.dia_facturacion,
          estado:      yaFacturado ? 'facturado' : 'pendiente',
        })
      })

    return result
  },

  /**
   * Retorna las últimas 10 tareas (todas las del sistema, ordenadas por fecha desc).
   */
  async getActividadReciente() {
    await delay(100)
    const tareas = active(_tareas)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 10)

    return tareas.map(t => {
      const cliente  = _clientes.find(c => c.id === t.cliente_id)
      const operador = TEAM.find(u => u.id === t.operador_id)
      return {
        ...t,
        cliente_nombre:  cliente?.nombre_comercial ?? '—',
        operador_nombre: operador?.nombre ?? '—',
      }
    })
  },

  /**
   * Para operadores: tareas propias (hoy y esta semana).
   */
  async getMisTareas(operadorId) {
    await delay(100)
    const n = new Date()
    const fechaHoy = today()
    const inicioSemana = (() => {
      const d = new Date(n)
      d.setDate(d.getDate() - d.getDay())
      return d.toISOString().substring(0, 10)
    })()

    const tareas = active(_tareas)
      .filter(t => t.operador_id === operadorId && t.fecha >= inicioSemana)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))

    return tareas.map(t => {
      const cliente = _clientes.find(c => c.id === t.cliente_id)
      return { ...t, cliente_nombre: cliente?.nombre_comercial ?? '—', esHoy: t.fecha === fechaHoy }
    })
  },

  /**
   * Para operadores: clientes asignados.
   */
  async getMisClientes(clienteIds) {
    await delay(100)
    if (!clienteIds) return active(_clientes).filter(c => c.estado === 'activo')
    return active(_clientes).filter(c => clienteIds.includes(c.id) && c.estado === 'activo')
  },

  /**
   * Para operadores: saldo de su fondo de caja chica.
   */
  async getMiFondo(operadorId) {
    await delay(50)
    return _fondos.find(f => f.operador_id === operadorId) ?? null
  },
}
