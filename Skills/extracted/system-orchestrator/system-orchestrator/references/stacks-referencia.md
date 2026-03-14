# Stacks de Referência — System Orchestrator

Guia de decisão tecnológica para cada tipo de sistema.

---

## Stack Padrão (90% dos casos)

```
Frontend:  React 18 + Vite + TailwindCSS
Backend:   Node.js + Express + TypeScript
Banco:     PostgreSQL (relacional) ou MongoDB (documentos)
Auth:      JWT + bcrypt
ORM:       Prisma (PostgreSQL) ou Mongoose (MongoDB)
Deploy:    Docker + docker-compose
```

---

## Por Tipo de Sistema

### 🛒 E-commerce
```
Frontend:  Next.js 14 (SSR para SEO)
Backend:   Node.js + Express
Banco:     PostgreSQL + Redis (carrinho/cache)
Pagamento: Stripe ou Mercado Pago
Search:    Elasticsearch (catálogo grande)
CDN:       Cloudflare (imagens de produtos)
```

### 🍕 Delivery / Pedidos
```
Frontend:  React + Socket.io-client
Backend:   Node.js + Express + Socket.io
Banco:     MongoDB + Redis
Maps:      Google Maps API ou Mapbox
Push:      Firebase Cloud Messaging
```

### 📊 Dashboard / Admin
```
Frontend:  React + shadcn/ui + Recharts
Backend:   Node.js + Express
Banco:     PostgreSQL
Export:    ExcelJS / PDFKit
```

### 🏢 ERP / Multi-tenant
```
Frontend:  React + React Query
Backend:   NestJS (TypeScript, estrutura robusta)
Banco:     PostgreSQL (multi-schema por tenant)
Queue:     Bull + Redis
Auth:      OAuth 2.0 + RBAC
```

### 💬 Chat / Real-time
```
Frontend:  React + Socket.io-client
Backend:   Node.js + Socket.io
Banco:     MongoDB + Redis (pub/sub)
Media:     AWS S3 ou Cloudinary
```

### 📅 Agendamento / Reservas
```
Frontend:  React + FullCalendar
Backend:   Node.js + Express
Banco:     PostgreSQL
Email:     Nodemailer + templates
SMS:       Twilio ou Zenvia
```

---

## Critérios de Decisão

### SQL vs NoSQL
| Use PostgreSQL quando | Use MongoDB quando |
|----------------------|-------------------|
| Dados relacionais complexos | Documentos flexíveis |
| Transações ACID necessárias | Escala horizontal |
| Relatórios e analytics | Dados aninhados frequentes |
| Dados financeiros | Protótipos rápidos |

### REST vs GraphQL
| Use REST quando | Use GraphQL quando |
|----------------|-------------------|
| API simples e previsível | Múltiplos clientes (mobile/web) |
| Equipe menor | Dados complexos e relacionados |
| Cache simples com HTTP | Subscriptions real-time |
| CRUD padrão | Frontend controla os dados |
