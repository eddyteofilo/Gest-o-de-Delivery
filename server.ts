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

import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client initialized.');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-minimalist-key';

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

  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.get('/ping', (req, res) => {
    res.send('pong');
  });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    console.log('Register request:', req.body);
    const { name, email, password, slug } = req.body;
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
    console.log('Login request:', req.body.email);
    const { email, password } = req.body;

    try {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !restaurant || !(await bcrypt.compare(password, restaurant.password))) {
        console.log('Login failed: Invalid credentials');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: restaurant.id, slug: restaurant.slug }, JWT_SECRET);
      console.log('Login success:', restaurant.id);
      res.json({ token, restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug } });
    } catch (err: any) {
      console.error('Login error:', err.message);
      res.status(500).json({ error: 'Erro interno no login' });
    }
  });

  // --- Restaurant Routes ---
  app.get('/api/restaurant/me', authenticate, async (req: any, res) => {
    try {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('id, name, slug, email, address, phone, slogan, logo_url, mercadopago_token, pagseguro_token')
        .eq('id', req.user.id)
        .single();

      if (error) throw error;
      res.json(restaurant);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/restaurant/settings', authenticate, async (req: any, res) => {
    const { name, slogan, logo_url, mercadopago_token, pagseguro_token, phone, address } = req.body;
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ name, slogan, logo_url, mercadopago_token, pagseguro_token, phone, address })
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
        .select('id, name, slug, address, phone, slogan, logo_url')
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

      // Fetch options for each product
      if (products) {
        for (const p of products) {
          const { data: options } = await supabase
            .from('product_options')
            .select('*')
            .eq('product_id', p.id);
          p.options = options;
          p.category_name = (p as any).categories?.name;
        }
      }

      res.json({ restaurant, categories, products });
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

      if (products) {
        for (const p of products) {
          const { data: options } = await supabase
            .from('product_options')
            .select('*')
            .eq('product_id', p.id);
          p.options = options;
          p.category_name = (p as any).categories?.name;
        }
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
