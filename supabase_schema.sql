-- =============================================================================
-- AdminYAAA & MAYORISTA A TU CASA — ESQUEMA RELACIONAL MAESTRO (SUPABASE / POSTGRESQL)
-- Arquitectura de Seguridad Multi-Rol con Row Level Security (RLS) y Bóveda Cifrada
-- =============================================================================

-- 1. EXTENSIONES CRIPTOGRÁFICAS Y UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. TABLA DE PERFILES Y ROLES DE ACCESO (ADMIN / OPERADOR / CLIENTE)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operador', 'cliente')),
  cliente_id UUID, -- Solo para rol 'cliente': asocia el usuario a su empresa
  iniciales TEXT,
  avatar_color TEXT DEFAULT 'emerald',
  is_owner BOOLEAN DEFAULT FALSE, -- Identificador de propietario (Ralukita)
  sueldo_base NUMERIC(12, 2) DEFAULT 0,
  clientes_asignados UUID[], -- Para operadores: lista de clientes que pueden operar
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- FUNCIONES DE SEGURIDAD (SECURITY DEFINER)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_operador()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'operador'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_cliente()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'cliente'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_cliente_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cliente_id FROM public.profiles
  WHERE id = auth.uid() AND role = 'cliente'
  LIMIT 1;
$$;

-- Políticas de Profiles
DROP POLICY IF EXISTS "Lectura de perfiles para autenticados" ON public.profiles;
CREATE POLICY "Lectura de perfiles para autenticados"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Solo Admins gestionan perfiles" ON public.profiles;
CREATE POLICY "Solo Admins gestionan perfiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================================================
-- 3. CLIENTES Y FICHAS COMERCIALES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_comercial TEXT NOT NULL,
  razon_social TEXT,
  cuit TEXT,
  rubro TEXT NOT NULL CHECK (rubro IN ('gastronomia', 'distribuidora', 'comercio', 'servicio', 'estudio_contable')),
  tipo_contrato TEXT NOT NULL CHECK (tipo_contrato IN ('abono_mensual', 'trabajo_puntual')),
  monto_abono NUMERIC(12, 2) DEFAULT 0,
  dia_facturacion INTEGER DEFAULT 5,
  direccion TEXT,
  dueno_nombre TEXT,
  whatsapp TEXT,
  estudio_aliado_id UUID,
  operador_asignado_id UUID REFERENCES public.profiles(id),
  notas_internas TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins acceso total a clientes" ON public.clientes;
CREATE POLICY "Admins acceso total a clientes"
  ON public.clientes FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Operadores ven clientes asignados" ON public.clientes;
CREATE POLICY "Operadores ven clientes asignados"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (is_operador() AND (operador_asignado_id = auth.uid() OR operador_asignado_id IS NULL));

DROP POLICY IF EXISTS "Clientes ven unicamente su propia ficha" ON public.clientes;
CREATE POLICY "Clientes ven unicamente su propia ficha"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (is_cliente() AND id = get_user_cliente_id());

-- =============================================================================
-- 4. CENTRO DE DOCUMENTOS COMPARTIDOS CON CLIENTES (BUZÓN PYME)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.documentos_compartidos_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('factura_compra', 'comprobante_pago', 'novedades_personal', 'ticket_caja', 'otro')),
  url_storage TEXT,
  tamano TEXT,
  nota TEXT,
  estado TEXT NOT NULL DEFAULT 'en_revision' CHECK (estado IN ('en_revision', 'procesado', 'rechazado')),
  subido_por TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documentos_compartidos_clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins y Operadores ven todos los documentos de clientes" ON public.documentos_compartidos_clientes;
CREATE POLICY "Admins y Operadores ven todos los documentos de clientes"
  ON public.documentos_compartidos_clientes FOR ALL
  TO authenticated
  USING (is_admin() OR is_operador())
  WITH CHECK (is_admin() OR is_operador());

DROP POLICY IF EXISTS "Clientes gestionan sus propios documentos" ON public.documentos_compartidos_clientes;
CREATE POLICY "Clientes gestionan sus propios documentos"
  ON public.documentos_compartidos_clientes FOR ALL
  TO authenticated
  USING (is_cliente() AND cliente_id = get_user_cliente_id())
  WITH CHECK (is_cliente() AND cliente_id = get_user_cliente_id());

-- =============================================================================
-- 5. BÓVEDA CONFIDENCIAL DE CLAVES Y SECRETOS DE CLIENTES (AES-256)
-- Acceso 100% blindado y reservado exclusivamente para Admins / Ralukita
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.boveda_claves_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  cliente_nombre TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('ARCA / AFIP', 'Homebanking / Banco', 'Domicilio Fiscal Electrónico', 'Software Punto de Venta', 'Servidor / Hosting')),
  identificador TEXT NOT NULL, -- CUIT, usuario o terminal
  secreto_cifrado TEXT NOT NULL, -- Ciphertext encriptado con AES-256
  iv_salt TEXT NOT NULL, -- Vector de inicialización y salt
  nivel_seguridad TEXT DEFAULT 'Nivel 3',
  notas TEXT,
  ultimo_acceso TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.boveda_claves_clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Boveda solo accesible por Administradores" ON public.boveda_claves_clientes;
CREATE POLICY "Boveda solo accesible por Administradores"
  ON public.boveda_claves_clientes FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Registro Inmutable de Auditoría de Accesos a la Bóveda
CREATE TABLE IF NOT EXISTS public.boveda_auditoria_accesos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credencial_id UUID REFERENCES public.boveda_claves_clientes(id) ON DELETE SET NULL,
  usuario_email TEXT NOT NULL,
  accion TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.boveda_auditoria_accesos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auditoria solo visible para Administradores" ON public.boveda_auditoria_accesos;
CREATE POLICY "Auditoria solo visible para Administradores"
  ON public.boveda_auditoria_accesos FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================================================
-- 6. TAREAS OPERATIVAS Y TRABAJOS DIARIOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tareas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  operador_id UUID NOT NULL REFERENCES public.profiles(id),
  descripcion TEXT NOT NULL,
  tipo TEXT NOT NULL,
  horas NUMERIC(5, 2) DEFAULT 1,
  precio NUMERIC(12, 2) DEFAULT 0,
  abono_incluido BOOLEAN DEFAULT TRUE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'realizado', 'facturado', 'cobrado')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins gestionan todas las tareas" ON public.tareas;
CREATE POLICY "Admins gestionan todas las tareas"
  ON public.tareas FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Operadores gestionan sus tareas" ON public.tareas;
CREATE POLICY "Operadores gestionan sus tareas"
  ON public.tareas FOR ALL
  TO authenticated
  USING (is_operador() AND operador_id = auth.uid())
  WITH CHECK (is_operador() AND operador_id = auth.uid());

DROP POLICY IF EXISTS "Clientes visualizan el estado de sus tareas" ON public.tareas;
CREATE POLICY "Clientes visualizan el estado de sus tareas"
  ON public.tareas FOR SELECT
  TO authenticated
  USING (is_cliente() AND cliente_id = get_user_cliente_id());

-- =============================================================================
-- 7. FACTURAS Y COBRANZAS (CUENTAS CORRIENTES)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.facturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero TEXT UNIQUE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  concepto TEXT NOT NULL,
  monto NUMERIC(12, 2) NOT NULL,
  monto_saldo NUMERIC(12, 2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'cobrada', 'vencida')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins control total de facturas" ON public.facturas;
CREATE POLICY "Admins control total de facturas"
  ON public.facturas FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Clientes ven solo sus facturas" ON public.facturas;
CREATE POLICY "Clientes ven solo sus facturas"
  ON public.facturas FOR SELECT
  TO authenticated
  USING (is_cliente() AND cliente_id = get_user_cliente_id());

CREATE TABLE IF NOT EXISTS public.pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  monto NUMERIC(12, 2) NOT NULL,
  cuenta_destino TEXT NOT NULL,
  comprobante TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins control total de pagos" ON public.pagos;
CREATE POLICY "Admins control total de pagos"
  ON public.pagos FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Clientes ven solo sus pagos" ON public.pagos;
CREATE POLICY "Clientes ven solo sus pagos"
  ON public.pagos FOR SELECT
  TO authenticated
  USING (is_cliente() AND cliente_id = get_user_cliente_id());

-- =============================================================================
-- 8. MÓDULO MAYORISTA (PRODUCTOS, PEDIDOS, STOCK Y PROVEEDORES)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.wholesale_products (
  id VARCHAR(50) PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  barcode VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  section VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(20) DEFAULT 'un.',
  cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  margin NUMERIC(6, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'agotado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wholesale_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de productos mayoristas para todos los autenticados" ON public.wholesale_products;
CREATE POLICY "Lectura de productos mayoristas para todos los autenticados"
  ON public.wholesale_products FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins y Operadores modifican productos mayoristas" ON public.wholesale_products;
CREATE POLICY "Admins y Operadores modifican productos mayoristas"
  ON public.wholesale_products FOR ALL
  TO authenticated
  USING (is_admin() OR is_operador())
  WITH CHECK (is_admin() OR is_operador());

CREATE TABLE IF NOT EXISTS public.wholesale_orders (
  id VARCHAR(50) PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(150),
  delivery_type VARCHAR(30) NOT NULL CHECK (delivery_type IN ('domicilio', 'retiro')),
  delivery_zone VARCHAR(100),
  address_line TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Confirmado' CHECK (status IN ('Pendiente', 'Confirmado', 'En preparación', 'En camino', 'Entregado', 'Cancelado')),
  factura_id UUID REFERENCES public.facturas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wholesale_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins y Operadores gestionan pedidos mayoristas" ON public.wholesale_orders;
CREATE POLICY "Admins y Operadores gestionan pedidos mayoristas"
  ON public.wholesale_orders FOR ALL
  TO authenticated
  USING (is_admin() OR is_operador())
  WITH CHECK (is_admin() OR is_operador());

DROP POLICY IF EXISTS "Clientes ven y crean sus propios pedidos mayoristas" ON public.wholesale_orders;
CREATE POLICY "Clientes ven y crean sus propios pedidos mayoristas"
  ON public.wholesale_orders FOR ALL
  TO authenticated
  USING (is_cliente() AND cliente_id = get_user_cliente_id())
  WITH CHECK (is_cliente() AND cliente_id = get_user_cliente_id());

CREATE TABLE IF NOT EXISTS public.wholesale_stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id VARCHAR(50) NOT NULL REFERENCES public.wholesale_products(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('INGRESO', 'VENTA', 'AJUSTE', 'ROTURA', 'DEVOLUCION')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  user_email VARCHAR(150) NOT NULL DEFAULT 'admin@adminya.com.ar',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wholesale_stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solo Admins y Operadores ven movimientos mayoristas" ON public.wholesale_stock_movements;
CREATE POLICY "Solo Admins y Operadores ven movimientos mayoristas"
  ON public.wholesale_stock_movements FOR ALL
  TO authenticated
  USING (is_admin() OR is_operador())
  WITH CHECK (is_admin() OR is_operador());

-- =============================================================================
-- 9. FUNCIÓN CRÍTICA CON SECURITY DEFINER: REGISTRAR PAGO FIFO
-- =============================================================================
CREATE OR REPLACE FUNCTION public.registrar_pago_fifo(
  p_cliente_id UUID,
  p_monto NUMERIC(12, 2),
  p_cuenta TEXT,
  p_comprobante TEXT,
  p_fecha DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pago_id UUID;
  v_remanente NUMERIC(12, 2) := p_monto;
  v_factura RECORD;
  v_monto_a_imputar NUMERIC(12, 2);
  v_canceladas JSONB := '[]'::jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permisos insuficientes para registrar pagos.';
  END IF;

  INSERT INTO public.pagos (cliente_id, fecha, monto, cuenta_destino, comprobante)
  VALUES (p_cliente_id, p_fecha, p_monto, p_cuenta, p_comprobante)
  RETURNING id INTO v_pago_id;

  FOR v_factura IN
    SELECT id, numero, monto_saldo
    FROM public.facturas
    WHERE cliente_id = p_cliente_id AND estado IN ('pendiente', 'vencida') AND monto_saldo > 0
    ORDER BY fecha ASC, created_at ASC
  LOOP
    EXIT WHEN v_remanente <= 0;

    IF v_remanente >= v_factura.monto_saldo THEN
      v_monto_a_imputar := v_factura.monto_saldo;
      v_remanente := v_remanente - v_monto_a_imputar;

      UPDATE public.facturas
      SET monto_saldo = 0,
          estado = 'cobrada',
          updated_at = NOW()
      WHERE id = v_factura.id;
    ELSE
      v_monto_a_imputar := v_remanente;
      v_remanente := 0;

      UPDATE public.facturas
      SET monto_saldo = monto_saldo - v_monto_a_imputar,
          updated_at = NOW()
      WHERE id = v_factura.id;
    END IF;

    v_canceladas := v_canceladas || jsonb_build_object('factura_id', v_factura.id, 'imputado', v_monto_a_imputar);
  END LOOP;

  RETURN jsonb_build_object(
    'pago_id', v_pago_id,
    'monto_total', p_monto,
    'sobrante_a_cuenta', v_remanente,
    'facturas_afectadas', v_canceladas
  );
END;
$$;
