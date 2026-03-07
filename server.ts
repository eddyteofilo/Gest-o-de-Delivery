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

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;
try {
  db = new Database('delivery.db');
  db.pragma('foreign_keys = ON');
  console.log('Database connected successfully.');
} catch (e) {
  console.error('Error initializing database:', e);
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-minimalist-key';

// Initialize Database
console.log('Initializing database...');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    available INTEGER DEFAULT 1,
    is_daily_offer INTEGER DEFAULT 0,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  CREATE TABLE IF NOT EXISTS product_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS couriers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    rg TEXT,
    address TEXT,
    vehicle_type TEXT,
    vehicle_plate TEXT,
    vehicle_renavam TEXT,
    photo_url TEXT,
    active INTEGER DEFAULT 1,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  );
`);

  // Migration for existing tables
  console.log('Running migrations...');
  try {
    db.prepare('ALTER TABLE products ADD COLUMN is_daily_offer INTEGER DEFAULT 0').run();
    console.log('Migration: added is_daily_offer to products');
  } catch (e: any) {
    if (!e.message.includes('duplicate column name')) {
      console.log('Migration info (products):', e.message);
    }
  }
  try {
    db.prepare('ALTER TABLE couriers ADD COLUMN rg TEXT').run();
    console.log('Migration: added rg to couriers');
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE couriers ADD COLUMN address TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE couriers ADD COLUMN vehicle_type TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE couriers ADD COLUMN vehicle_plate TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE couriers ADD COLUMN vehicle_renavam TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE couriers ADD COLUMN photo_url TEXT').run();
  } catch (e) {}

  db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, preparing, ready, delivering, completed, cancelled
    courier_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
    FOREIGN KEY (courier_id) REFERENCES couriers (id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    options TEXT, -- JSON string of selected options
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  );
`);
} catch (e) {
  console.error('Error executing database migration:', e);
  process.exit(1);
}

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
      const stmt = db.prepare('INSERT INTO restaurants (name, email, password, slug) VALUES (?, ?, ?, ?)');
      const result = stmt.run(name, email, hashedPassword, slug);
      console.log('Register success:', result.lastInsertRowid);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      console.error('Register error:', err.message);
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    console.log('Login request:', req.body.email);
    const { email, password } = req.body;
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE email = ?').get(email) as any;
    if (!restaurant || !(await bcrypt.compare(password, restaurant.password))) {
      console.log('Login failed: Invalid credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: restaurant.id, slug: restaurant.slug }, JWT_SECRET);
    console.log('Login success:', restaurant.id);
    res.json({ token, restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug } });
  });

  // --- Restaurant Routes ---
  app.get('/api/restaurant/me', authenticate, (req: any, res) => {
    const restaurant = db.prepare('SELECT id, name, slug, email, address, phone FROM restaurants WHERE id = ?').get(req.user.id);
    res.json(restaurant);
  });

  app.get('/api/public/restaurant/:slug', (req, res) => {
    const restaurant = db.prepare('SELECT id, name, slug, address, phone FROM restaurants WHERE slug = ?').get(req.params.slug) as any;
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    
    const categories = db.prepare('SELECT * FROM categories WHERE restaurant_id = ?').all(restaurant.id);
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.restaurant_id = ? AND p.available = 1
    `).all(restaurant.id) as any[];

    // Fetch options for each product
    for (const p of products) {
      p.options = db.prepare('SELECT * FROM product_options WHERE product_id = ?').all(p.id);
    }
    
    res.json({ restaurant, categories, products });
  });

  // --- Category Routes ---
  app.get('/api/restaurant/categories', authenticate, (req: any, res) => {
    const categories = db.prepare('SELECT * FROM categories WHERE restaurant_id = ?').all(req.user.id);
    res.json(categories);
  });

  app.post('/api/restaurant/categories', authenticate, (req: any, res) => {
    const { name } = req.body;
    const stmt = db.prepare('INSERT INTO categories (restaurant_id, name) VALUES (?, ?)');
    const result = stmt.run(req.user.id, name);
    res.json({ id: result.lastInsertRowid, name });
  });

  // --- Product Routes ---
  app.get('/api/restaurant/products', authenticate, (req: any, res) => {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.restaurant_id = ?
    `).all(req.user.id) as any[];
    
    for (const p of products) {
      p.options = db.prepare('SELECT * FROM product_options WHERE product_id = ?').all(p.id);
    }
    res.json(products);
  });

  app.post('/api/restaurant/products', authenticate, (req: any, res) => {
    const { name, description, price, category_id, image_url, is_daily_offer, options } = req.body;
    
    try {
      const transaction = db.transaction(() => {
        const stmt = db.prepare('INSERT INTO products (restaurant_id, name, description, price, category_id, image_url, is_daily_offer) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const result = stmt.run(req.user.id, name, description, price, category_id, image_url, is_daily_offer ? 1 : 0);
        const productId = result.lastInsertRowid;

        if (options && Array.isArray(options)) {
          const optStmt = db.prepare('INSERT INTO product_options (product_id, name, price) VALUES (?, ?, ?)');
          for (const opt of options) {
            optStmt.run(productId, opt.name, opt.price);
          }
        }
        return productId;
      });

      const id = transaction();
      res.json({ id });
    } catch (err: any) {
      console.error('Error creating product:', err);
      res.status(500).json({ error: 'Erro interno ao criar produto: ' + err.message });
    }
  });

  app.put('/api/restaurant/products/:id', authenticate, (req: any, res) => {
    const { name, description, price, category_id, image_url, available, is_daily_offer, options } = req.body;
    
    const transaction = db.transaction(() => {
      const stmt = db.prepare('UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, image_url = ?, available = ?, is_daily_offer = ? WHERE id = ? AND restaurant_id = ?');
      stmt.run(name, description, price, category_id, image_url, available ? 1 : 0, is_daily_offer ? 1 : 0, req.params.id, req.user.id);

      // Replace options
      db.prepare('DELETE FROM product_options WHERE product_id = ?').run(req.params.id);
      if (options && Array.isArray(options)) {
        const optStmt = db.prepare('INSERT INTO product_options (product_id, name, price) VALUES (?, ?, ?)');
        for (const opt of options) {
          optStmt.run(req.params.id, opt.name, opt.price);
        }
      }
    });

    transaction();
    res.json({ success: true });
  });

  app.delete('/api/restaurant/products/:id', authenticate, (req: any, res) => {
    const stmt = db.prepare('DELETE FROM products WHERE id = ? AND restaurant_id = ?');
    const result = stmt.run(req.params.id, req.user.id);
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });

  // --- Order Routes ---
  app.post('/api/public/orders', (req, res) => {
    const { restaurant_id, customer_name, customer_phone, customer_address, items } = req.body;
    
    const transaction = db.transaction(() => {
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

      const stmt = db.prepare('INSERT INTO orders (restaurant_id, customer_name, customer_phone, customer_address, total) VALUES (?, ?, ?, ?, ?)');
      const result = stmt.run(restaurant_id, customer_name, customer_phone, customer_address, total);
      const orderId = result.lastInsertRowid;

      const itemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price, options) VALUES (?, ?, ?, ?, ?)');
      for (const item of items) {
        const optionsStr = item.selectedOptions ? JSON.stringify(item.selectedOptions) : null;
        itemStmt.run(orderId, item.product_id, item.quantity, item.price, optionsStr);
      }
      return orderId;
    });

    const orderId = transaction();
    res.json({ orderId });
  });

  app.get('/api/restaurant/orders', authenticate, (req: any, res) => {
    const orders = db.prepare(`
      SELECT o.*, c.name as courier_name 
      FROM orders o 
      LEFT JOIN couriers c ON o.courier_id = c.id 
      WHERE o.restaurant_id = ? 
      ORDER BY o.created_at DESC
    `).all(req.user.id);
    res.json(orders);
  });

  app.get('/api/restaurant/orders/:id', authenticate, (req: any, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND restaurant_id = ?').get(req.params.id, req.user.id) as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const items = db.prepare(`
      SELECT oi.*, p.name as product_name 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `).all(order.id);
    res.json({ ...order, items });
  });

  app.patch('/api/restaurant/orders/:id/status', authenticate, (req: any, res) => {
    const { status, courier_id } = req.body;
    const stmt = db.prepare('UPDATE orders SET status = ?, courier_id = COALESCE(?, courier_id) WHERE id = ? AND restaurant_id = ?');
    stmt.run(status, courier_id, req.params.id, req.user.id);
    res.json({ success: true });
  });

  // --- Courier Routes ---
  app.get('/api/restaurant/couriers', authenticate, (req: any, res) => {
    const couriers = db.prepare('SELECT * FROM couriers WHERE restaurant_id = ?').all(req.user.id);
    res.json(couriers);
  });

  app.post('/api/restaurant/couriers', authenticate, (req: any, res) => {
    const { name, phone, rg, address, vehicle_type, vehicle_plate, vehicle_renavam, photo_url } = req.body;
    const stmt = db.prepare('INSERT INTO couriers (restaurant_id, name, phone, rg, address, vehicle_type, vehicle_plate, vehicle_renavam, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(req.user.id, name, phone, rg, address, vehicle_type, vehicle_plate, vehicle_renavam, photo_url);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete('/api/restaurant/couriers/:id', authenticate, (req: any, res) => {
    try {
      // First, set courier_id to NULL in orders to avoid foreign key constraint issues
      db.prepare('UPDATE orders SET courier_id = NULL WHERE courier_id = ? AND restaurant_id = ?').run(req.params.id, req.user.id);
      
      const stmt = db.prepare('DELETE FROM couriers WHERE id = ? AND restaurant_id = ?');
      const result = stmt.run(req.params.id, req.user.id);
      if (result.changes > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Courier not found' });
      }
    } catch (err: any) {
      console.error('Error deleting courier:', err);
      res.status(500).json({ error: 'Erro ao excluir entregador: ' + err.message });
    }
  });

  // --- Customer Routes ---
  app.get('/api/restaurant/customers', authenticate, (req: any, res) => {
    const customers = db.prepare('SELECT * FROM customers WHERE restaurant_id = ? ORDER BY name ASC').all(req.user.id);
    res.json(customers);
  });

  app.post('/api/restaurant/customers', authenticate, (req: any, res) => {
    const { name, address, phone, whatsapp } = req.body;
    const stmt = db.prepare('INSERT INTO customers (restaurant_id, name, address, phone, whatsapp) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(req.user.id, name, address, phone, whatsapp);
    res.json({ id: result.lastInsertRowid, name, address, phone, whatsapp });
  });

  app.post('/api/restaurant/orders/counter', authenticate, (req: any, res) => {
    const { customer_id, customer_name, customer_phone, customer_address, items } = req.body;
    
    const transaction = db.transaction(() => {
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

      const stmt = db.prepare('INSERT INTO orders (restaurant_id, customer_name, customer_phone, customer_address, total, status) VALUES (?, ?, ?, ?, ?, ?)');
      const result = stmt.run(req.user.id, customer_name, customer_phone, customer_address, total, 'preparing'); // Default to preparing for counter orders
      const orderId = result.lastInsertRowid;

      const itemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price, options) VALUES (?, ?, ?, ?, ?)');
      for (const item of items) {
        const optionsStr = item.selectedOptions ? JSON.stringify(item.selectedOptions) : null;
        itemStmt.run(orderId, item.product_id, item.quantity, item.price, optionsStr);
      }
      return orderId;
    });

    const orderId = transaction();
    res.json({ orderId });
  });

  // --- Public Tracking ---
  app.get('/api/public/orders/:id', (req, res) => {
    const order = db.prepare(`
      SELECT o.id, o.status, o.total, o.created_at, r.name as restaurant_name, r.phone as restaurant_phone
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ?
    `).get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  });

  // --- Reports ---
  app.get('/api/restaurant/reports/summary', authenticate, (req: any, res) => {
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders
      FROM orders 
      WHERE restaurant_id = ?
    `).get(req.user.id);
    res.json(summary);
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
