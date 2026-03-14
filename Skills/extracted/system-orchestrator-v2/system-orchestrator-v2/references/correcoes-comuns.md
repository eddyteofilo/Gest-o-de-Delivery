# Correções Comuns de Integração

Referência rápida para os problemas de integração mais frequentes.

---

## 🔴 CORS — Cross-Origin Resource Sharing

### Sintoma
```
Access to XMLHttpRequest at 'http://localhost:3001/api/...' from origin
'http://localhost:5173' has been blocked by CORS policy
```

### Causa e Correção

```javascript
// ❌ Sem CORS
app.get('/api/users', handler);

// ❌ CORS genérico (perigoso em produção)
app.use(cors());

// ✅ CORS configurado corretamente
import cors from 'cors';

app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error('Não permitido pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// IMPORTANTE: cors deve vir ANTES das rotas
app.use(cors(...));
app.use('/api', routes); // ← depois do cors
```

---

## 🔴 JWT — Token Inválido / 401 Unauthorized

### Sintomas
- `JsonWebTokenError: invalid signature`
- `TokenExpiredError: jwt expired`
- `401 Unauthorized` em rotas protegidas

### Causa e Correção

```javascript
// ❌ JWT_SECRET diferente entre ambientes
jwt.sign(payload, 'minha-senha'); // hardcoded

// ✅ JWT_SECRET via variável de ambiente
jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

// ✅ Middleware de autenticação robusto
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) return res.status(401).json({ message: 'Usuário não encontrado' });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado, faça login novamente' });
    }
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// ✅ Frontend — enviar token corretamente
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Frontend — tratar 401 globalmente
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
```

---

## 🔴 Banco de Dados — Conexão Recusada

### Sintomas
- `MongoNetworkError: connect ECONNREFUSED`
- `Error: connect ECONNREFUSED 127.0.0.1:5432`
- `PrismaClientInitializationError`

### Causa e Correção

```javascript
// ❌ Conexão sem tratamento de erro
mongoose.connect(process.env.MONGODB_URI);
app.listen(3001);

// ✅ Banco conecta PRIMEIRO, servidor sobe depois
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB conectado');

    app.listen(process.env.PORT || 3001, () => {
      console.log(`🚀 Servidor rodando na porta ${process.env.PORT || 3001}`);
    });
  } catch (err) {
    console.error('❌ Falha ao conectar no banco:', err.message);
    process.exit(1);
  }
};

startServer();

// ✅ Para Prisma (PostgreSQL)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const startServer = async () => {
  await prisma.$connect();
  console.log('✅ PostgreSQL conectado via Prisma');
  app.listen(PORT);
};
```

---

## 🟠 Variáveis de Ambiente Ausentes

### Sintoma
- `undefined` em variáveis de configuração
- Erros silenciosos por valores padrão incorretos

### Correção

```javascript
// ✅ Validar todas as variáveis obrigatórias no startup
const validateEnv = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'ALLOWED_ORIGINS'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias ausentes:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }

  console.log('✅ Variáveis de ambiente validadas');
};

// Chamar antes de qualquer coisa
validateEnv();
```

```bash
# ✅ .env.example completo (nunca comitar .env real)
PORT=3001
NODE_ENV=development

# Banco
MONGODB_URI=mongodb://localhost:27017/nome_do_app
# ou PostgreSQL:
# DATABASE_URL=postgresql://user:senha@localhost:5432/nome_do_app

# Auth
JWT_SECRET=chave_secreta_com_minimo_32_caracteres_aqui_!!!
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend (Vite)
VITE_API_URL=http://localhost:3001/api
```

---

## 🟠 Rotas Não Encontradas (404)

### Sintomas
- `Cannot GET /api/users`
- `404 Not Found` para rotas que deveriam existir

### Causa e Correção

```javascript
// ❌ Rota não registrada no router principal
// routes/index.js
import authRoutes from './auth.routes.js';
// Faltou importar userRoutes!

// ✅ Registrar TODAS as rotas
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';

router.use('/auth', authRoutes);
router.use('/users', userRoutes);       // ← estava faltando
router.use('/products', productRoutes); // ← estava faltando

// ❌ Prefixo inconsistente
// Backend: app.use('/api', routes)    → rota completa: /api/users
// Frontend: axios.get('/users')       → sem o prefixo /api = 404

// ✅ Prefixo consistente
// Backend:  app.use('/api', routes)
// Frontend: baseURL = 'http://localhost:3001/api'
//           axios.get('/users') → http://localhost:3001/api/users ✅

// ✅ Rota de fallback para 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`
  });
});
```

---

## 🟠 Middleware na Ordem Errada

### Sintoma
- CORS não funciona mesmo configurado
- Body `undefined` no controller
- Autenticação ignorada

### Correção

```javascript
// ✅ Ordem correta OBRIGATÓRIA dos middlewares
app.use(helmet());                    // 1. Segurança
app.use(cors(corsOptions));           // 2. CORS (antes de tudo)
app.use(express.json());              // 3. Parse do body
app.use(express.urlencoded(...));     // 4. Parse de forms

app.use('/api', routes);             // 5. Rotas (depois dos middlewares)

app.use(notFoundHandler);            // 6. 404 (depois das rotas)
app.use(errorHandler);               // 7. Erro global (sempre por último)
```

---

## 🟡 Frontend — URL da API Errada

### Sintoma
- `Network Error` ou `ERR_CONNECTION_REFUSED`
- Requests indo para a porta ou path errado

### Correção

```javascript
// ✅ Configuração centralizada no frontend
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

export default api;

// ✅ .env do frontend (Vite)
// VITE_API_URL=http://localhost:3001/api

// ✅ .env do frontend (Create React App)
// REACT_APP_API_URL=http://localhost:3001/api
// Usar: process.env.REACT_APP_API_URL
```

---

## 🟡 Erros Silenciosos no Frontend

### Sintoma
- Nenhuma resposta visível para o usuário em caso de erro
- Console mostrando erros que o usuário não vê

### Correção

```jsx
// ✅ Tratar estados de loading e erro em todo componente que faz fetch
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  api.get('/endpoint')
    .then(res => setData(res.data.data))
    .catch(err => setError(err.response?.data?.message || 'Erro ao carregar'))
    .finally(() => setLoading(false));
}, []);

if (loading) return <div>Carregando...</div>;
if (error)   return <div className="text-red-500">Erro: {error}</div>;
if (!data)   return <div>Nenhum dado encontrado</div>;
```
