# Checklist por Stack — System Orchestrator

Listas de verificação específicas para as principais stacks.

---

## Stack: React + Node/Express + MongoDB

```
FRONTEND (React + Vite)
  □ VITE_API_URL definido no .env
  □ axios configurado com baseURL via variável de ambiente
  □ Interceptor de request adicionando token Authorization
  □ Interceptor de response tratando 401 (redirect para login)
  □ React Router configurado (BrowserRouter)
  □ Rotas privadas com componente PrivateRoute
  □ AuthContext ou hook useAuth implementado

BACKEND (Node + Express)
  □ dotenv carregado na primeira linha (import 'dotenv/config')
  □ helmet() ativo
  □ cors() configurado com ALLOWED_ORIGINS
  □ express.json() ativo
  □ Rota /health respondendo 200
  □ Todas as rotas registradas em routes/index.js
  □ errorHandler como último middleware
  □ Variáveis de ambiente validadas no startup

BANCO (MongoDB + Mongoose)
  □ MONGODB_URI no .env
  □ mongoose.connect() com await antes do app.listen()
  □ Todos os Models importados/registrados
  □ Índices definidos nos schemas (email unique, etc.)

AUTH (JWT)
  □ JWT_SECRET no .env (mínimo 32 chars)
  □ JWT_EXPIRES_IN definido
  □ bcrypt com rounds >= 10
  □ Middleware authenticate exportado e aplicado nas rotas
  □ Middleware authorize(role) para rotas de admin
  □ Senha com select: false no schema
```

---

## Stack: Next.js + Node/Express + PostgreSQL (Prisma)

```
FRONTEND (Next.js)
  □ NEXT_PUBLIC_API_URL definido no .env.local
  □ API Routes do Next.js vs Backend externo — definido qual usar
  □ getServerSideProps / getStaticProps vs client-side fetch — definido
  □ next-auth ou JWT custom — definido
  □ Middleware de autenticação nas pages protegidas

BACKEND (Express ou Next API Routes)
  □ DATABASE_URL no .env
  □ prisma generate executado
  □ prisma migrate deploy executado
  □ PrismaClient singleton pattern (evitar múltiplas instâncias)

BANCO (PostgreSQL + Prisma)
  □ schema.prisma com todos os modelos
  □ Migrations geradas (prisma migrate dev)
  □ Relacionamentos corretos (1:N, N:N)
  □ Índices nas colunas de busca
```

---

## Stack: React + FastAPI + PostgreSQL

```
FRONTEND (React)
  □ VITE_API_URL apontando para FastAPI (default: http://localhost:8000)
  □ Token enviado como Bearer no header
  □ CORS aceito pelo FastAPI

BACKEND (FastAPI + Python)
  □ .env com DATABASE_URL e SECRET_KEY
  □ CORSMiddleware configurado
  □ Uvicorn rodando com reload para dev
  □ Alembic para migrations (ou SQLModel)
  □ OAuth2PasswordBearer para autenticação

BANCO (PostgreSQL + SQLAlchemy)
  □ DATABASE_URL no formato postgresql://
  □ engine e SessionLocal configurados
  □ Base.metadata.create_all(engine) ou Alembic migrations
```

---

## Stack: React + NestJS + PostgreSQL

```
FRONTEND (React)
  □ API URL configurada para porta do NestJS (default: 3000)
  □ JWT token enviado como Bearer

BACKEND (NestJS)
  □ .env com DATABASE_HOST, DATABASE_PORT, DATABASE_USER, etc.
  □ ConfigModule.forRoot({ isGlobal: true }) no AppModule
  □ TypeOrmModule configurado com entidades
  □ JwtModule configurado no AuthModule
  □ Guards aplicados nos controllers (@UseGuards(JwtAuthGuard))
  □ Swagger habilitado (/api/docs)

BANCO (PostgreSQL + TypeORM)
  □ Entidades com @Entity() e @Column()
  □ synchronize: true apenas em dev (nunca em produção)
  □ migrations para produção
```

---

## Portas Padrão por Framework

| Framework | Porta padrão | Variável |
|-----------|-------------|----------|
| Vite (React) | 5173 | — |
| Create React App | 3000 | PORT |
| Next.js | 3000 | PORT |
| Express / Node | 3001 | PORT |
| NestJS | 3000 | PORT |
| FastAPI / Uvicorn | 8000 | — |
| Django | 8000 | — |
| PostgreSQL | 5432 | — |
| MongoDB | 27017 | — |
| Redis | 6379 | — |
| MySQL | 3306 | — |

---

## Endpoints de Autenticação (Padrão Esperado)

```
POST   /api/auth/register    → Criar conta
POST   /api/auth/login       → Login (retorna token)
GET    /api/auth/me          → Perfil do usuário autenticado
POST   /api/auth/logout      → Logout (invalidar token)
POST   /api/auth/refresh     → Renovar token (se refresh token)
POST   /api/auth/forgot      → Solicitar reset de senha
POST   /api/auth/reset       → Redefinir senha com token
```

## Respostas de API (Padrão)

```json
// ✅ Sucesso
{ "success": true, "data": { ... } }

// ✅ Lista com paginação
{ "success": true, "data": [...], "total": 100, "page": 1, "limit": 20 }

// ✅ Erro
{ "success": false, "message": "Descrição do erro" }

// ✅ Erro de validação
{ "success": false, "message": "Dados inválidos", "errors": [{ "field": "email", "message": "Email inválido" }] }
```
