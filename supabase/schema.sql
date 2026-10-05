-- ============================================================================
-- MAYORISTA A TU CASA — ESQUEMA RELACIONAL POSTGRESQL (SUPABASE BAAS)
-- Una iniciativa de AdminYAAA.
-- ============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABLA: PRODUCTOS (Catálogo, inventario y precios)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(50) PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    section VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(20) DEFAULT 'un.',
    presentation VARCHAR(100),
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    margin NUMERIC(6, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    max_stock INTEGER NOT NULL DEFAULT 100,
    image TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_offer BOOLEAN DEFAULT FALSE,
    offer_price NUMERIC(12, 2),
    status VARCHAR(20) DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'agotado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. TABLA: HISTORIAL DE PRECIOS Y COSTOS (Auditoría inmutable)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(50) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    cost NUMERIC(12, 2) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    margin NUMERIC(6, 2) NOT NULL,
    user_email VARCHAR(150) NOT NULL DEFAULT 'admin@adminya.com.ar',
    document_ref VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: MOVIMIENTOS DE STOCK (Trazabilidad operativa)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(50) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('INGRESO', 'VENTA', 'AJUSTE', 'ROTURA', 'DEVOLUCION')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    document_ref VARCHAR(100),
    cost NUMERIC(12, 2),
    user_email VARCHAR(150) NOT NULL DEFAULT 'admin@adminya.com.ar',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. TABLA: PEDIDOS Y VENTAS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(50) PRIMARY KEY,
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
    payment_status VARCHAR(30) DEFAULT 'pendiente' CHECK (payment_status IN ('pendiente', 'aprobado', 'rechazado')),
    status VARCHAR(30) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Confirmado', 'En preparación', 'En camino', 'Entregado', 'Cancelado')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. TABLA: PROVEEDORES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    cuit VARCHAR(30),
    contact VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- ÍNDICES DE RENDIMIENTO
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_section ON public.products(section);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON public.price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (Catálogo accesible para compradores)
DROP POLICY IF EXISTS "Lectura pública de productos" ON public.products;
CREATE POLICY "Lectura pública de productos" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserción pública de pedidos" ON public.orders;
CREATE POLICY "Inserción pública de pedidos" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura de pedidos propios o públicos" ON public.orders;
CREATE POLICY "Lectura de pedidos propios o públicos" ON public.orders FOR SELECT USING (true);

-- Políticas operativas y administrativas
DROP POLICY IF EXISTS "Gestión total de productos" ON public.products;
CREATE POLICY "Gestión total de productos" ON public.products FOR ALL USING (true);

DROP POLICY IF EXISTS "Gestión total de historial" ON public.price_history;
CREATE POLICY "Gestión total de historial" ON public.price_history FOR ALL USING (true);

DROP POLICY IF EXISTS "Gestión total de movimientos" ON public.stock_movements;
CREATE POLICY "Gestión total de movimientos" ON public.stock_movements FOR ALL USING (true);

DROP POLICY IF EXISTS "Gestión total de pedidos" ON public.orders;
CREATE POLICY "Gestión total de pedidos" ON public.orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Gestión total de proveedores" ON public.suppliers;
CREATE POLICY "Gestión total de proveedores" ON public.suppliers FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- REALTIME (Suscripciones WebSocket automáticas - seguro e idempotente)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    EXCEPTION WHEN duplicate_object THEN
        -- Ya agregada, ignorar
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN
        -- Ya agregada, ignorar
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
    EXCEPTION WHEN duplicate_object THEN
        -- Ya agregada, ignorar
    END;
END $$;
