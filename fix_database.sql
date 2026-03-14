
-- SQL para adicionar as colunas de pagamento necessárias à tabela 'orders'
-- Execute este script no SQL Editor do seu Dashboard Supabase

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_qr_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_qr_code_base64 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link TEXT;

-- ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Adicionando colunas de configuração de pagamento na tabela 'restaurants' (se estiverem faltando)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS mercadopago_token TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS mercadopago_public_key TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS pagseguro_token TEXT;
