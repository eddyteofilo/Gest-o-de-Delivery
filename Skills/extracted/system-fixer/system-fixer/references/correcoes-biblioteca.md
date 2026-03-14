# Biblioteca de Correções — System Fixer

Correções prontas para aplicar, organizadas por categoria.

---

## 🔧 Autenticação Completa (criar do zero)

### Backend — Auth Routes + Controller
**Arquivo:** `src/routes/auth.routes.js`
```javascript
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as AuthController from '../controllers/AuthController.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login',    AuthController.login);
router.get('/me',        authenticate, AuthController.getMe);
router.post('/logout',   authenticate, AuthController.logout);

export default router;
```

**Arquivo:** `src/controllers/AuthController.js`
```javascript
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Campos obrigatórios: name, email, password' });
  }
  if (await User.findOne({ email })) {
    return res.status(409).json({ success: false, message: 'Email já cadastrado' });
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
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
  }
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

export const logout = asyncHandler(async (req, res) => {
  // Para JWT stateless, logout é responsabilidade do frontend (remover o token)
  // Para implementar blacklist, adicionar token a uma coleção de tokens inválidos
  res.json({ success: true, message: 'Logout realizado com sucesso' });
});
```

---

## 🔧 Error Handler Global (criar ou substituir)

**Arquivo:** `src/middlewares/errorHandler.js`
```javascript
export const errorHandler = (err, req, res, next) => {
  const status  = err.status || err.statusCode || 500;
  const isProd  = process.env.NODE_ENV === 'production';
  const message = err.message || 'Erro interno do servidor';

  // Log estruturado no servidor
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    status,
    message,
    ...(isProd ? {} : { stack: err.stack }),
  }));

  res.status(status).json({
    success: false,
    message,
    ...(isProd ? {} : { stack: err.stack }),
  });
};

// Wrapper para não precisar de try/catch em todo controller
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

---

## 🔧 Server.js Completo (corrigir ou criar)

**Arquivo:** `src/server.js`
```javascript
import 'dotenv/config';
import express    from 'express';
import cors       from 'cors';
import helmet     from 'helmet';
import rateLimit  from 'express-rate-limit';
import mongoose   from 'mongoose';
import routes     from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

// 1. Validar variáveis de ambiente
const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing  = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Variáveis ausentes:', missing.join(', '));
  process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || 3001;

// 2. Middlewares de segurança (ANTES das rotas)
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Rota de health check
app.get('/health', (_, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// 4. Rotas da aplicação
app.use('/api', routes);

// 5. Error handler GLOBAL (sempre por último)
app.use(errorHandler);

// 6. Conectar banco ANTES de subir servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Falha no banco:', err.message);
    process.exit(1);
  });

export default app;
```

---

## 🔧 Router Principal (criar ou completar)

**Arquivo:** `src/routes/index.js`
```javascript
import { Router } from 'express';
// Importar todas as rotas do sistema
import authRoutes from './auth.routes.js';
// Adicionar outras rotas conforme o sistema:
// import userRoutes    from './user.routes.js';
// import productRoutes from './product.routes.js';

const router = Router();

router.use('/auth', authRoutes);
// router.use('/users',    userRoutes);
// router.use('/products', productRoutes);

// 404 para rotas não encontradas
router.use('*', (req, res) =>
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  })
);

export default router;
```

---

## 🔧 Axios Instance com Interceptors (Frontend)

**Arquivo:** `src/services/api.js`
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request: adicionar token automaticamente
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  err => Promise.reject(err)
);

// Response: tratar 401 globalmente
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

## 🔧 PrivateRoute (Frontend)

**Arquivo:** `src/components/PrivateRoute.jsx`
```jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
```

---

## 🔧 .env.example Completo

```env
# ═══════════════════════════════════
# SERVIDOR
# ═══════════════════════════════════
PORT=3001
NODE_ENV=development

# ═══════════════════════════════════
# BANCO DE DADOS
# ═══════════════════════════════════
# MongoDB:
MONGODB_URI=mongodb://localhost:27017/nome_do_sistema
# PostgreSQL (Prisma):
# DATABASE_URL=postgresql://user:senha@localhost:5432/nome_do_sistema

# ═══════════════════════════════════
# AUTENTICAÇÃO
# ═══════════════════════════════════
JWT_SECRET=substitua_por_string_aleatoria_de_minimo_32_caracteres
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# ═══════════════════════════════════
# CORS
# ═══════════════════════════════════
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# ═══════════════════════════════════
# FRONTEND (Vite)
# ═══════════════════════════════════
VITE_API_URL=http://localhost:3001/api

# ═══════════════════════════════════
# INTEGRAÇÕES EXTERNAS (descomentar conforme necessário)
# ═══════════════════════════════════
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=seu@email.com
# SMTP_PASS=senha_de_app_do_gmail
# REDIS_URL=redis://localhost:6379
```
