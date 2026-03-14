# Decisões Arquiteturais — Master AI System Architect

Guia de decisão para escolha de stack, padrões e arquitetura por tipo de sistema.

---

## Árvore de Decisão — Stack

```
O sistema precisa de SEO ou SSR?
├── SIM → Next.js (frontend)
└── NÃO → React + Vite (frontend)
         │
         O sistema tem alta complexidade de domínio?
         ├── SIM → NestJS (backend estruturado)
         └── NÃO → Node.js + Express (backend ágil)
                  │
                  Os dados são relacionais e estruturados?
                  ├── SIM → PostgreSQL + Prisma
                  └── NÃO → MongoDB + Mongoose
```

---

## Stacks por Tipo de Sistema

### 🍕 Delivery / Pedidos em Tempo Real
```yaml
frontend:  React + Vite + Socket.io-client
backend:   Node.js + Express + Socket.io
banco:     MongoDB (flexibilidade de schema) + Redis (pub/sub)
auth:      JWT
extras:    Google Maps API (rastreamento), FCM (push notifications)
portas:    Frontend: 5173 | Backend: 3001 | MongoDB: 27017 | Redis: 6379
```

### 🛒 E-commerce / Loja Virtual
```yaml
frontend:  Next.js 14 (SEO é crítico para loja)
backend:   Node.js + Express
banco:     PostgreSQL + Prisma (transações financeiras exigem ACID) + Redis (carrinho)
auth:      JWT + refresh token
extras:    Stripe ou Mercado Pago, Cloudinary (imagens)
portas:    Frontend: 3000 | Backend: 3001 | PostgreSQL: 5432
```

### 📊 Dashboard / Painel Administrativo
```yaml
frontend:  React + Vite + shadcn/ui + Recharts
backend:   Node.js + Express
banco:     PostgreSQL + Prisma
auth:      JWT com RBAC (múltiplos roles)
extras:    ExcelJS (export), jsPDF (relatórios)
portas:    Frontend: 5173 | Backend: 3001
```

### 🏢 ERP / Sistema de Gestão Multi-módulo
```yaml
frontend:  React + Vite + React Query
backend:   NestJS (TypeScript, decorators, módulos isolados)
banco:     PostgreSQL + TypeORM + Redis (cache e filas)
auth:      OAuth 2.0 + JWT + RBAC granular
extras:    Bull (filas), Nodemailer (e-mail), Winston (logs)
portas:    Frontend: 5173 | Backend: 3000 | PostgreSQL: 5432 | Redis: 6379
```

### 💬 Plataforma com Chat / Tempo Real
```yaml
frontend:  React + Vite + Socket.io-client
backend:   Node.js + Express + Socket.io
banco:     MongoDB + Redis
auth:      JWT
extras:    Cloudinary (mídia), AWS S3 (arquivos grandes)
```

### 📅 Sistema de Agendamento / Reservas
```yaml
frontend:  React + Vite + FullCalendar
backend:   Node.js + Express
banco:     PostgreSQL + Prisma (conflito de horários requer transações)
auth:      JWT
extras:    Nodemailer (confirmações), Twilio (SMS), node-cron (lembretes)
```

### 🔗 API Pública / Backend Headless
```yaml
frontend:  N/A (apenas backend)
backend:   Node.js + Express + OpenAPI/Swagger
banco:     PostgreSQL + Prisma
auth:      API Keys + JWT
extras:    express-rate-limit (throttling), helmet, compression
```

### 📱 MVP / Protótipo Rápido
```yaml
frontend:  React + Vite
backend:   Node.js + Express
banco:     MongoDB + Mongoose (schema flexível para iterar rápido)
auth:      JWT
extras:    Mínimo — foco na funcionalidade core
```

---

## Padrões Arquiteturais por Complexidade

### Monolito MVC (até 10 endpoints, equipe ≤ 3)
```
src/
├── controllers/   ← recebe request, chama service
├── services/      ← lógica de negócio
├── models/        ← schema/entidade
├── routes/        ← mapeamento de endpoints
├── middlewares/   ← auth, validação, erro
└── utils/         ← helpers reutilizáveis
```

### Clean Architecture (10–50 endpoints, equipe 3–8)
```
src/
├── domain/        ← entidades e regras de negócio puras
├── usecases/      ← casos de uso da aplicação
├── infra/         ← implementações (banco, APIs externas)
│   ├── repositories/
│   └── adapters/
├── presentation/  ← controllers e rotas
└── shared/        ← utilitários compartilhados
```

### Microserviços (50+ endpoints, equipe > 8, alta escala)
```
services/
├── auth-service/
├── user-service/
├── product-service/
├── order-service/
└── notification-service/
+ API Gateway + Message Broker (RabbitMQ/Kafka)
```

---

## Critérios de Decisão Rápida

| Cenário | Decisão |
|---------|---------|
| Prazo curto, MVP | MongoDB + Express (sem ORM pesado) |
| Dados financeiros | PostgreSQL (ACID obrigatório) |
| Muitos usuários simultâneos | Redis + WebSocket |
| SEO importante | Next.js (SSR) |
| API pública | REST + OpenAPI Spec + Rate Limiting |
| Multi-tenant | PostgreSQL com schema por tenant |
| Alta disponibilidade | Docker + PM2 + Nginx |
| Muitos uploads de arquivo | Cloudinary ou AWS S3 |
| E-mail transacional | Nodemailer + template (MJML) |
| Pagamentos | Stripe (global) ou Mercado Pago (BR) |

---

## Configurações de Porta Padrão

| Serviço | Porta | Variável |
|---------|-------|----------|
| React/Vite (dev) | 5173 | — |
| Next.js | 3000 | PORT |
| Express/Node | 3001 | PORT |
| NestJS | 3000 | PORT |
| PostgreSQL | 5432 | — |
| MongoDB | 27017 | — |
| Redis | 6379 | — |
| MySQL | 3306 | — |

---

## Template de Decisão Arquitetural

Ao decidir arquitetura, documentar:

```
DECISÃO ARQUITETURAL — [SISTEMA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stack escolhida:
  Frontend:  [tecnologia] — Motivo: [por quê]
  Backend:   [tecnologia] — Motivo: [por quê]
  Banco:     [tecnologia] — Motivo: [por quê]
  Auth:      [estratégia] — Motivo: [por quê]

Padrão arquitetural: [MVC | Clean | Microserviços]
  Motivo: [justificativa baseada no contexto]

Extras necessários:
  [integração] — [por quê é necessária]

Riscos identificados:
  [risco] — [mitigação planejada]

Alternativas descartadas:
  [alternativa] — [por quê foi descartada]
```
