# Padrões de Implementação Segura — Security AI Auditor

Implementações seguras prontas para copiar e aplicar.

---

## 🔐 Autenticação Completa e Segura

### User Model Seguro (Mongoose)
```javascript
import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import crypto   from 'crypto';

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true, maxlength: 100 },
  email:     { type: String, required: true, unique: true, lowercase: true, index: true },
  password:  { type: String, required: true, select: false, minlength: 8 },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  active:    { type: Boolean, default: true },

  // Reset de senha seguro
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },

  // Proteção contra brute force
  loginAttempts: { type: Number, default: 0, select: false },
  lockUntil:     { type: Date, select: false },

  // Audit
  lastLoginAt: { type: Date },
  lastLoginIP: { type: String },
}, { timestamps: true });

// Hash da senha ANTES de salvar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12); // 12 rounds
  next();
});

// Comparação segura (timing-safe)
UserSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Gerar token de reset seguro
UserSchema.methods.generateResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken   = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hora
  return token; // retornar o token limpo para enviar por e-mail
};
```

---

## 🛡️ Middlewares de Segurança Completos

### Auth Middleware (JWT + proteção extra)
```javascript
import jwt    from 'jsonwebtoken';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    const token = authHeader.split(' ')[1];

    // Forçar algoritmo — previne alg:none attack
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    const user = await User.findById(decoded.id).select('+active');
    if (!user || !user.active) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado ou inativo' });
    }

    req.user = user;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Sessão expirada, faça login novamente'
      : 'Token inválido';
    return res.status(401).json({ success: false, message });
  }
};

// RBAC — Role-based access control
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Acesso negado' });
  }
  next();
};

// Verificar propriedade do recurso (anti-IDOR)
export const ownsResource = (model, idParam = 'id') => async (req, res, next) => {
  const resource = await model.findById(req.params[idParam]);
  if (!resource) {
    return res.status(404).json({ success: false, message: 'Recurso não encontrado' });
  }
  if (resource.userId?.toString() !== req.user._id.toString()
      && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso negado' });
  }
  req.resource = resource;
  next();
};
```

---

## ⚙️ Server.js com Segurança Completa

```javascript
import 'dotenv/config';
import express    from 'express';
import helmet     from 'helmet';
import cors       from 'cors';
import rateLimit  from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose   from 'mongoose';
import routes     from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

// 1. Validar variáveis críticas no startup
const required = ['MONGODB_URI', 'JWT_SECRET', 'ALLOWED_ORIGINS'];
const missing  = required.filter(k => !process.env[k]);
if (missing.length) { console.error('❌ Ausentes:', missing); process.exit(1); }

// JWT_SECRET fraco? Avisar
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET muito curto (mínimo 32 caracteres)');
  process.exit(1);
}

const app = express();

// 2. Headers de segurança (helmet faz tudo)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// 3. CORS restritivo
app.use(cors({
  origin: (origin, cb) => {
    const allowed = process.env.ALLOWED_ORIGINS.split(',');
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} não permitida`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 4. Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

// 5. Parse de body com limite de tamanho
app.use(express.json({ limit: '10kb' }));  // 10kb máximo — protege contra body bomb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 6. Sanitizar inputs NoSQL (remove $operators de inputs)
app.use(mongoSanitize());

// 7. Rate limiting específico em auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Muitas tentativas. Tente em 15 minutos.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', rateLimit({ windowMs: 3600000, max: 3 }));

// 8. Rotas
app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

// 9. Error handler (sem stack trace em produção)
app.use(errorHandler);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(process.env.PORT || 3001,
    () => console.log('🚀 Servidor seguro iniciado')))
  .catch(err => { console.error(err); process.exit(1); });
```

---

## 🔑 Validação de Input com Zod

```javascript
import { z } from 'zod';

// Schema de registro — valida e sanitiza
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo')
    .regex(/^[\w\s\u00C0-\u017F'-]+$/, 'Nome com caracteres inválidos'),
  email: z
    .string()
    .email('E-mail inválido')
    .toLowerCase()
    .max(200),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(128)
    .regex(/[A-Z]/, 'Precisa de letra maiúscula')
    .regex(/[0-9]/, 'Precisa de número'),
  // NUNCA aceitar role do input — sempre 'user' por padrão
});

// Middleware de validação genérico
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }
  req.body = result.data; // usar dados validados e sanitizados
  next();
};

// Uso na rota:
router.post('/register', validate(registerSchema), AuthController.register);
```

---

## 🍪 Cookies HttpOnly (alternativa mais segura ao localStorage)

```javascript
// Backend — enviar token via cookie httpOnly
const cookieOptions = {
  httpOnly: true,       // inacessível via JavaScript (imune a XSS)
  secure: process.env.NODE_ENV === 'production',  // HTTPS apenas
  sameSite: 'strict',   // protege contra CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  path: '/',
};

res.cookie('token', token, cookieOptions);
res.json({ success: true, data: { user } }); // não enviar token no body

// Middleware lendo cookie em vez de header
export const authenticate = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  // ... resto do middleware
};

// Logout via cookie
res.clearCookie('token', cookieOptions);
res.json({ success: true, message: 'Logout realizado' });
```

---

## 🔍 Segurança em Uploads de Arquivo

```javascript
import multer   from 'multer';
import path     from 'path';
import crypto   from 'crypto';

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: '/tmp/uploads/', // nunca na pasta pública diretamente
  filename: (req, file, cb) => {
    // Nome aleatório — previne path traversal e sobrescrita
    const name = crypto.randomBytes(16).toString('hex');
    const ext  = ALLOWED_TYPES[file.mimetype];
    cb(null, `${name}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Verificar MIME type real (não apenas extensão)
  if (!ALLOWED_TYPES[file.mimetype]) {
    return cb(new Error('Tipo de arquivo não permitido'), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 1 },
});
```

---

## 📋 .env.example Seguro

```env
# ═══════════════════════════════════
# SEGURANÇA — valores obrigatórios
# ═══════════════════════════════════

# Gerar com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=SUBSTITUIR_POR_64_CHARS_ALEATORIOS_NUNCA_COMMITAR_VALOR_REAL

JWT_EXPIRES_IN=7d

# Rounds do bcrypt (12 = seguro, 14 = mais seguro mas mais lento)
BCRYPT_ROUNDS=12

# Origins permitidas (NUNCA usar * em produção)
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

NODE_ENV=production

# ═══════════════════════════════════
# BANCO DE DADOS
# ═══════════════════════════════════
# NUNCA commitar connection string com senha real
MONGODB_URI=mongodb+srv://USUARIO:SENHA@cluster.mongodb.net/BANCO

# ═══════════════════════════════════
# CHAVES EXTERNAS (revogar se expostas)
# ═══════════════════════════════════
STRIPE_SECRET_KEY=sk_live_SUBSTITUIR
STRIPE_WEBHOOK_SECRET=whsec_SUBSTITUIR
SENDGRID_API_KEY=SG.SUBSTITUIR
```

---

## 🚨 Resposta a Incidente de Segurança

Se uma credencial for exposta (no Git, em log, etc.):

```bash
# PASSO 1: REVOGAR IMEDIATAMENTE (antes de qualquer outra coisa)
# Stripe: dashboard.stripe.com → Developers → API keys → Roll key
# MongoDB: Atlas → Database Access → Editar usuário → Reset password
# GitHub token: github.com → Settings → Developer settings → Tokens → Delete

# PASSO 2: Remover do arquivo atual
# Mover para .env

# PASSO 3: Verificar se .env está no .gitignore
echo ".env" >> .gitignore

# PASSO 4: Remover do histórico do Git
# Instalar BFG Repo Cleaner (mais simples que git filter-branch)
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force

# PASSO 5: Alertar a equipe — todos devem fazer git pull com histórico reescrito
```
