# Templates de Backend — System Builder

Estruturas prontas para copiar e adaptar em qualquer sistema.

---

## 📁 server.js (Entry Point)

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(','), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Error handling (sempre por último)
app.use(errorHandler);

// Start
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});

export default app;
```

---

## 📁 config/database.js

```javascript
// MongoDB
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// PostgreSQL (Prisma)
// import { PrismaClient } from '@prisma/client';
// export const prisma = new PrismaClient();
// export const connectDB = async () => { await prisma.$connect(); console.log('✅ PostgreSQL connected'); };
```

---

## 📁 middlewares/auth.js

```javascript
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token requerido' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'Usuário não encontrado' });

    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Acesso negado' });
  }
  next();
};
```

---

## 📁 middlewares/errorHandler.js

```javascript
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  // Log em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

---

## 📁 models/User.js (MongoDB)

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true, maxlength: 100 },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 8, select: false },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  active:    { type: Boolean, default: true },
}, { timestamps: true });

// Hash da senha antes de salvar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  next();
});

UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', UserSchema);
```

---

## 📁 controllers/AuthController.js

```javascript
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (await User.findOne({ email })) {
    return res.status(400).json({ success: false, message: 'Email já cadastrado' });
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  }

  const token = generateToken(user._id);
  res.json({
    success: true,
    data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});
```

---

## 📁 routes/index.js

```javascript
import { Router } from 'express';
import authRoutes from './auth.routes.js';
// import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
// router.use('/users', userRoutes);

export default router;
```

---

## 📁 .env.example

```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/nome_do_sistema
# DATABASE_URL=postgresql://user:password@localhost:5432/nome_do_sistema

# Auth
JWT_SECRET=sua_chave_secreta_com_minimo_32_caracteres_aqui
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Extras (descomentar conforme necessário)
# STRIPE_SECRET_KEY=sk_test_...
# CLOUDINARY_URL=cloudinary://...
# REDIS_URL=redis://localhost:6379
# SMTP_HOST=smtp.gmail.com
# SMTP_USER=seu@email.com
# SMTP_PASS=sua_senha_app
```
