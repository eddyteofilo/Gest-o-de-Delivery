-- Script de Criação de Tabelas para Supabase (PostgreSQL)
-- 1. Restaurantes
CREATE TABLE IF NOT EXISTS restaurants (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    slogan TEXT,
    logo_url TEXT,
    mercadopago_token TEXT,
    pagseguro_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Categorias
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);
-- 3. Produtos
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE
    SET NULL,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url TEXT,
        available BOOLEAN DEFAULT TRUE,
        is_daily_offer BOOLEAN DEFAULT FALSE
);
-- 4. Opções de Produto
CREATE TABLE IF NOT EXISTS product_options (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);
-- 5. Entregadores
CREATE TABLE IF NOT EXISTS couriers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    rg TEXT,
    address TEXT,
    vehicle_type TEXT,
    vehicle_plate TEXT,
    vehicle_renavam TEXT,
    photo_url TEXT,
    active BOOLEAN DEFAULT TRUE
);
-- 6. Clientes
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 7. Pedidos
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    -- pending, preparing, ready, delivering, completed, cancelled
    courier_id BIGINT REFERENCES couriers(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 8. Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    options JSONB -- Guardar detalhes das opções selecionadas
);
-- 9. Desativar RLS (Row Level Security) 
-- Necessário para que o backend Express consiga inserir dados sem políticas complexas.
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE couriers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;