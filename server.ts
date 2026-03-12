console.log('--- SERVER.TS STARTING ---');
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Validação de variáveis de ambiente obrigatórias
const requiredEnvVars = ['JWT_SECRET', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.warn('⚠️ Atenção: Algumas variáveis de ambiente obrigatórias estão ausentes no sistema:', missingVars.join(', '));
  console.warn('Isso pode causar erros 500 nas rotas de API. Verifique as configurações na Vercel.');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY não configurados.');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client initialized.');
const JWT_SECRET = process.env.JWT_SECRET!;

// Database schema is managed via Supabase SQL Editor.
// Use supabase_schema.sql to initialize your tables.

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function startServer() {
  console.log('Starting server...');
  const app = express();

  // Request logging for debugging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(helmet({ contentSecurityPolicy: false })); // CSP desabilitado para SPA
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Rate limiter para rotas de autenticação
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
  });
  app.use('/api/auth', authLimiter);

  app.get('/ping', (req, res) => res.send('pong'));
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
  });

  // --- Input Validation Helper ---
  const validateFields = (body: any, fields: { name: string, type?: string, minLength?: number }[]) => {
    const errors: string[] = [];
    for (const field of fields) {
      const value = body[field.name];
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`Campo '${field.name}' é obrigatório`);
        continue;
      }
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`Campo '${field.name}' deve ser um email válido`);
      }
      if (field.minLength && typeof value === 'string' && value.length < field.minLength) {
        errors.push(`Campo '${field.name}' deve ter no mínimo ${field.minLength} caracteres`);
      }
      if (field.type === 'array' && !Array.isArray(value)) {
        errors.push(`Campo '${field.name}' deve ser uma lista`);
      }
    }
    return errors;
  };

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err: any) {
      const message = err.name === 'TokenExpiredError'
        ? 'Token expirado, faça login novamente'
        : 'Token inválido';
      res.status(401).json({ error: message });
    }
  };

  const authenticateSuperAdmin = (req: any, res: any, next: any) => {
    authenticate(req, res, () => {
      if (req.user?.role !== 'superadmin') {
        return res.status(403).json({ error: 'Acesso negado: Requer privilégios de Super Admin' });
      }
      next();
    });
  };

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, slug } = req.body;
    const errors = validateFields(req.body, [
      { name: 'name', minLength: 2 },
      { name: 'email', type: 'email' },
      { name: 'password', minLength: 6 },
      { name: 'slug', minLength: 3 }
    ]);
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
    console.log('Register request for:', email);
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { data, error } = await supabase
        .from('restaurants')
        .insert([{ name, email, password: hashedPassword, slug }])
        .select('id')
        .single();

      if (error) throw error;
      console.log('Register success:', data.id);
      res.json({ id: data.id });
    } catch (err: any) {
      console.error('Register error:', err.message);
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const errors = validateFields(req.body, [
      { name: 'email', type: 'email' },
      { name: 'password', minLength: 1 }
    ]);
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
    try {
      // 1. Try platform_users table first
      let { data: user, error: pError } = await supabase
        .from('platform_users')
        .select('*')
        .eq('email', email)
        .single();
      
      const isPlatformAdmin = !!user;

      // 2. If not found, try restaurants table
      if (!user) {
        const { data: restaurant, error: rError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('email', email)
          .single();
        user = restaurant;
      }

      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado no sistema' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password || '');

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Senha incorreta para este e-mail' });
      }

      if (user.is_active === false) {
        return res.status(403).json({ error: 'Esta conta está suspensa ou inativa' });
      }

      const token = jwt.sign(
        { id: user.id, slug: user.slug || 'admin', role: user.role || 'restaurant', isPlatform: isPlatformAdmin }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      res.json({ 
        token, 
        restaurant: { 
          id: user.id, 
          name: user.name, 
          slug: user.slug || 'admin',
          role: user.role || (isPlatformAdmin ? 'superadmin' : 'restaurant'),
          isPlatform: isPlatformAdmin
        } 
      });
    } catch (err: any) {
      console.error('Login error:', err.message);
      res.status(500).json({ error: 'Erro interno no login' });
    }
  });

  // --- Restaurant Routes ---
  app.get('/api/restaurant/me', authenticate, async (req: any, res) => {
    try {
      // Check platform users if token says so
      if (req.user.isPlatform) {
        const { data: user, error } = await supabase
          .from('platform_users')
          .select('id, name, email, role')
          .eq('id', req.user.id)
          .single();
        if (error) throw error;
        return res.json({ ...user, slug: 'admin', is_active: true });
      }

      // Default to restaurants
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('id', req.user.id)
        .single();

      if (error) throw error;
      res.json(restaurant);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/restaurant/settings', authenticate, async (req: any, res) => {
    try {
      const { 
        google_tag_id, fb_pixel_id, tiktok_pixel_id, 
        primary_color, secondary_color, payment_config 
      } = req.body;

      const { data, error } = await supabase
        .from('restaurants')
        .update({
          google_tag_id,
          fb_pixel_id,
          tiktok_pixel_id,
          primary_color,
          secondary_color,
          payment_config
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/restaurant/settings', authenticate, async (req: any, res) => {
    const { 
      name, slogan, logo_url, mercadopago_token, pagseguro_token, phone, address,
      google_tag_id, fb_pixel_id, tiktok_pixel_id, primary_color, secondary_color 
    } = req.body;
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          name, slogan, logo_url, mercadopago_token, pagseguro_token, phone, address,
          google_tag_id, fb_pixel_id, tiktok_pixel_id, primary_color, secondary_color 
        })
        .eq('id', req.user.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error updating settings:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/public/restaurant/:slug', async (req, res) => {
    try {
      const { data: restaurant, error: resError } = await supabase
        .from('restaurants')
        .select('id, name, slug, address, phone, slogan, logo_url, google_tag_id, fb_pixel_id, tiktok_pixel_id, primary_color, secondary_color')
        .eq('slug', req.params.slug)
        .single();

      if (resError || !restaurant) return res.status(404).json({ error: 'Restaurant not found' });

      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      const { data: products } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('restaurant_id', restaurant.id)
        .eq('available', true);

      // Fetch options in batch (avoids N+1 queries)
      if (products && products.length > 0) {
        const productIds = products.map((p: any) => p.id);
        const { data: allOptions } = await supabase
          .from('product_options').select('*').in('product_id', productIds);
        const optionsMap = new Map<number, any[]>();
        allOptions?.forEach((opt: any) => {
          if (!optionsMap.has(opt.product_id)) optionsMap.set(opt.product_id, []);
          optionsMap.get(opt.product_id)!.push(opt);
        });
        products.forEach((p: any) => {
          p.options = optionsMap.get(p.id) || [];
          p.category_name = p.categories?.name;
        });
      }

      // Fetch active promotions for this restaurant
      const { data: promotions } = await supabase
        .from('promotions')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      res.json({ restaurant, categories, products, promotions: promotions || [] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Category Routes ---
  app.get('/api/restaurant/categories', authenticate, async (req: any, res) => {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json(categories);
  });

  app.post('/api/restaurant/categories', authenticate, async (req: any, res) => {
    const { name } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .insert([{ restaurant_id: req.user.id, name }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // --- Product Routes ---
  app.get('/api/restaurant/products', authenticate, async (req: any, res) => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('restaurant_id', req.user.id);

      if (error) throw error;

      if (products && products.length > 0) {
        const productIds = products.map((p: any) => p.id);
        const { data: allOptions } = await supabase
          .from('product_options').select('*').in('product_id', productIds);
        const optionsMap = new Map<number, any[]>();
        allOptions?.forEach((opt: any) => {
          if (!optionsMap.has(opt.product_id)) optionsMap.set(opt.product_id, []);
          optionsMap.get(opt.product_id)!.push(opt);
        });
        products.forEach((p: any) => {
          p.options = optionsMap.get(p.id) || [];
          p.category_name = p.categories?.name;
        });
      }
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/restaurant/products', authenticate, async (req: any, res) => {
    const { name, description, price, category_id, image_url, is_daily_offer, options } = req.body;
    try {
      const { data: product, error } = await supabase
        .from('products')
        .insert([{
          restaurant_id: req.user.id,
          name,
          description,
          price,
          category_id,
          image_url,
          is_daily_offer: is_daily_offer ? true : false
        }])
        .select()
        .single();

      if (error) throw error;

      if (options && Array.isArray(options)) {
        const productOptions = options.map(opt => ({
          product_id: product.id,
          name: opt.name,
          price: opt.price
        }));
        const { error: optError } = await supabase
          .from('product_options')
          .insert(productOptions);
        if (optError) throw optError;
      }

      res.json({ id: product.id });
    } catch (err: any) {
      console.error('Error creating product:', err);
      res.status(500).json({ error: 'Erro interno ao criar produto: ' + err.message });
    }
  });

  app.put('/api/restaurant/products/:id', authenticate, async (req: any, res) => {
    const { name, description, price, category_id, image_url, available, is_daily_offer, options } = req.body;
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name,
          description,
          price,
          category_id,
          image_url,
          available: available ? true : false,
          is_daily_offer: is_daily_offer ? true : false
        })
        .eq('id', req.params.id)
        .eq('restaurant_id', req.user.id);

      if (error) throw error;

      // Replace options: delete old, insert new
      await supabase.from('product_options').delete().eq('product_id', req.params.id);

      if (options && Array.isArray(options)) {
        const productOptions = options.map(opt => ({
          product_id: req.params.id,
          name: opt.name,
          price: opt.price
        }));
        await supabase.from('product_options').insert(productOptions);
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/restaurant/products/:id', authenticate, async (req: any, res) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', req.params.id)
        .eq('restaurant_id', req.user.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Order Routes ---
  app.post('/api/public/orders', async (req, res) => {
    const { restaurant_id, customer_name, customer_phone, customer_address, items } = req.body;
    const errors = validateFields(req.body, [
      { name: 'restaurant_id' },
      { name: 'customer_name', minLength: 2 },
      { name: 'customer_phone', minLength: 8 },
      { name: 'customer_address', minLength: 5 },
      { name: 'items', type: 'array' }
    ]);
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
    if (items.length === 0) return res.status(400).json({ error: 'Pedido deve conter pelo menos 1 item' });

    try {
      // Calculate total including options
      let total = 0;
      for (const item of items) {
        let itemTotal = item.price;
        if (item.selectedOptions) {
          for (const opt of item.selectedOptions) {
            itemTotal += opt.price;
          }
        }
        total += itemTotal * item.quantity;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{ restaurant_id, customer_name, customer_phone, customer_address, total }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        options: item.selectedOptions || []
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      res.json({ orderId: order.id });
    } catch (err: any) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/restaurant/orders', authenticate, async (req: any, res) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, couriers(name)')
        .eq('restaurant_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Adapt courier_name for frontend compatibility
      const adaptedOrders = orders.map(o => ({
        ...o,
        courier_name: (o as any).couriers?.name
      }));

      res.json(adaptedOrders);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/restaurant/orders/:id', authenticate, async (req: any, res) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', req.params.id)
        .eq('restaurant_id', req.user.id)
        .single();

      if (orderError || !order) return res.status(404).json({ error: 'Order not found' });

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products(name)')
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;

      const adaptedItems = items.map(i => ({
        ...i,
        product_name: (i as any).products?.name
      }));

      res.json({ ...order, items: adaptedItems });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/restaurant/orders/:id/status', authenticate, async (req: any, res) => {
    const { status, courier_id } = req.body;
    try {
      const updateData: any = { status };
      if (courier_id !== undefined) updateData.courier_id = courier_id;

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', req.params.id)
        .eq('restaurant_id', req.user.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/restaurant/orders/:id', authenticate, async (req: any, res) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', req.params.id)
        .eq('restaurant_id', req.user.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting order:', err);
      res.status(500).json({ error: 'Erro ao excluir pedido: ' + err.message });
    }
  });

  // --- Courier Routes ---
  app.get('/api/restaurant/couriers', authenticate, async (req: any, res) => {
    try {
      const { data: couriers, error } = await supabase
        .from('couriers')
        .select('*')
        .eq('restaurant_id', req.user.id);
      if (error) throw error;
      res.json(couriers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/restaurant/couriers', authenticate, async (req: any, res) => {
    const { name, phone, rg, address, vehicle_type, vehicle_plate, vehicle_renavam, photo_url } = req.body;
    try {
      const { data, error } = await supabase
        .from('couriers')
        .insert([{
          restaurant_id: req.user.id,
          name, phone, rg, address,
          vehicle_type, vehicle_plate, vehicle_renavam, photo_url
        }])
        .select()
        .single();
      if (error) throw error;
      res.json({ id: data.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/restaurant/couriers/:id', authenticate, async (req: any, res) => {
    try {
      // Supabase handles foreign keys if ref is SET NULL or RESTRICT
      const { error } = await supabase
        .from('couriers')
        .delete()
        .eq('id', req.params.id)
        .eq('restaurant_id', req.user.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting courier:', err);
      res.status(500).json({ error: 'Erro ao excluir entregador: ' + err.message });
    }
  });

  // --- Promotion Routes ---
  app.get('/api/restaurant/promotions', authenticate, async (req: any, res) => {
    try {
      const { data: promotions, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('restaurant_id', req.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json(promotions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/restaurant/promotions', authenticate, async (req: any, res) => {
    const { title, discount_text, image_url, valid_until } = req.body;
    try {
      const { data, error } = await supabase
        .from('promotions')
        .insert([{
          restaurant_id: req.user.id,
          title,
          discount_text,
          image_url,
          valid_until,
          active: true
        }])
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/restaurant/promotions/:id', authenticate, async (req: any, res) => {
    const { title, discount_text, image_url, valid_until, active } = req.body;
    try {
      const { data, error } = await supabase
        .from('promotions')
        .update({
          title,
          discount_text,
          image_url,
          valid_until,
          active
        })
        .eq('id', req.params.id)
        .eq('restaurant_id', req.user.id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/restaurant/promotions/:id', authenticate, async (req: any, res) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', req.params.id)
        .eq('restaurant_id', req.user.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Super Admin Routes ---
  app.get('/api/admin/restaurants', authenticateSuperAdmin, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, slug, email, is_active, role, plan_id, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/restaurants/:id/status', authenticateSuperAdmin, async (req, res) => {
    const { is_active } = req.body;
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active })
        .eq('id', req.params.id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/stats', authenticateSuperAdmin, async (req, res) => {
    try {
      const { count: totalRestaurants } = await supabase.from('restaurants').select('*', { count: 'exact', head: true });
      const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { data: revenueData } = await supabase.from('orders').select('total');
      
      const totalRevenue = revenueData?.reduce((acc, curr) => acc + Number(curr.total), 0) || 0;
      
      res.json({
        totalRestaurants,
        totalOrders,
        totalRevenue
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/plans', authenticateSuperAdmin, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/restaurants/:id/plan', authenticateSuperAdmin, async (req, res) => {
    const { plan_id } = req.body;
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ plan_id })
        .eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/plans/:id', authenticateSuperAdmin, async (req, res) => {
    const { name, price, max_products, features } = req.body;
    try {
      const { error } = await supabase
        .from('plans')
        .update({ name, price, max_products, features })
        .eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/plans', authenticateSuperAdmin, async (req, res) => {
    const { name, price, max_products, features } = req.body;
    try {
      const { data, error } = await supabase
        .from('plans')
        .insert([{ name, price, max_products, features }])
        .select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/restaurant/promotions/:id/toggle', authenticate, async (req: any, res) => {
    const { active } = req.body;
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ active })
        .eq('id', req.params.id)
        .eq('restaurant_id', req.user.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Customer Routes ---
  app.get('/api/restaurant/customers', authenticate, async (req: any, res) => {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', req.user.id)
        .order('name', { ascending: true });
      if (error) throw error;
      res.json(customers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/restaurant/customers', authenticate, async (req: any, res) => {
    const { name, address, phone, whatsapp } = req.body;
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ restaurant_id: req.user.id, name, address, phone, whatsapp }])
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/restaurant/customers/bulk', authenticate, async (req: any, res) => {
    const { customers } = req.body;
    if (!Array.isArray(customers)) return res.status(400).json({ error: 'Formato inválido' });

    try {
      const customersWithId = customers.map(c => ({
        ...c,
        restaurant_id: req.user.id
      }));

      const { data, error } = await supabase
        .from('customers')
        .insert(customersWithId)
        .select();

      if (error) throw error;
      res.json({ success: true, count: data.length });
    } catch (err: any) {
      console.error('Bulk import error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/restaurant/customers/:id', authenticate, async (req: any, res) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', req.params.id)
        .eq('restaurant_id', req.user.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/restaurant/orders/counter', authenticate, async (req: any, res) => {
    const { customer_name, customer_phone, customer_address, items } = req.body;

    try {
      let total = 0;
      for (const item of items) {
        let itemTotal = item.price;
        if (item.selectedOptions) {
          for (const opt of item.selectedOptions) {
            itemTotal += opt.price;
          }
        }
        total += itemTotal * item.quantity;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          restaurant_id: req.user.id,
          customer_name,
          customer_phone,
          customer_address,
          total,
          status: 'preparing'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        options: item.selectedOptions || []
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      res.json({ orderId: order.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Public Tracking ---
  app.get('/api/public/orders/:id', async (req, res) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, status, total, created_at, restaurants(name, phone)')
        .eq('id', req.params.id)
        .single();

      if (error || !order) return res.status(404).json({ error: 'Order not found' });

      const adaptedOrder = {
        ...order,
        restaurant_name: (order as any).restaurants?.name,
        restaurant_phone: (order as any).restaurants?.phone
      };

      res.json(adaptedOrder);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Promotion Routes ---
  app.get('/api/restaurant/promotions', authenticate, async (req: any, res) => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('restaurant_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/restaurant/promotions', authenticate, async (req: any, res) => {
    const { title, discount_text, image_url, valid_until } = req.body;
    const errors = validateFields(req.body, [
      { name: 'title', minLength: 2 },
      { name: 'discount_text', minLength: 1 }
    ]);
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });

    try {
      const { data, error } = await supabase
        .from('promotions')
        .insert([{
          restaurant_id: req.user.id,
          title,
          discount_text,
          image_url: image_url || null,
          valid_until: valid_until || null
        }])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/restaurant/promotions/:id', authenticate, async (req: any, res) => {
    const { title, discount_text, image_url, valid_until, active } = req.body;
    try {
      const { data, error } = await supabase
        .from('promotions')
        .update({ title, discount_text, image_url, valid_until, active })
        .eq('id', req.params.id)
        .eq('restaurant_id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Reports ---
  app.get('/api/restaurant/reports/summary', authenticate, async (req: any, res) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, status')
        .eq('restaurant_id', req.user.id);

      if (error) throw error;

      const total_orders = orders.length;
      const total_revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const completed_orders = orders.filter(o => o.status === 'completed').length;

      res.json({ total_orders, total_revenue, completed_orders });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Global error handler — ANTES do Vite middleware
  app.use((err: any, req: any, res: any, next: any) => {
    const status = err.status || 500;
    // Log detalhado no console do servidor (Vercel Logs)
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
    
    res.status(status).json({
      error: process.env.NODE_ENV === 'production'
        ? (status === 500 ? 'Erro interno no servidor de produção' : err.message)
        : err.message
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  console.log(`Attempting to listen on port ${PORT}...`);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log('Minimalist Delivery SaaS is ready!');
  });
}

startServer();
