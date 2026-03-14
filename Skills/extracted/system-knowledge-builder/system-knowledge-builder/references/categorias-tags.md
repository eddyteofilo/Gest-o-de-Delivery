# Categorias e Tags — System Knowledge Builder

Taxonomia completa para classificação consistente de registros na base de conhecimento.

---

## Categorias Principais

Use SEMPRE uma das categorias abaixo. Nunca criar categorias novas sem motivo claro.

| Código | Categoria | Descrição | Emoji |
|--------|-----------|-----------|-------|
| AUTH | Autenticação | JWT, sessões, login, logout, OAuth | 🔐 |
| CORS | CORS / Rede | Cross-origin, headers HTTP, preflight | 🌐 |
| BANCO | Banco de Dados | Conexão, schema, queries, migrations | 🗄️ |
| ROTAS | Rotas / API | Express routes, 404, prefixos, REST | 📡 |
| FRONTEND | Frontend | React, Vue, componentes, formulários | 🖥️ |
| CONFIG | Configuração | .env, dotenv, variáveis, setup | ⚙️ |
| INTEGRACAO | Integrações | APIs externas, webhooks, serviços | 🔌 |
| PERFORMANCE | Performance | Queries lentas, paginação, cache | ⚡ |
| SEGURANCA | Segurança | XSS, injection, exposição de dados | 🛡️ |
| ARQUITETURA | Arquitetura | Estrutura, padrões, design | 🏗️ |

---

## Tags por Categoria

### 🔐 AUTH
```
jwt, token, secret, bcrypt, hash, password, login, logout, register,
session, cookie, refresh-token, expire, authorize, authenticate,
role, admin, permissions, oauth, bearer, header, authorization
```

### 🌐 CORS
```
cors, origin, headers, preflight, options, credentials, access-control,
allow-origin, browser, cross-origin, same-origin
```

### 🗄️ BANCO
```
mongodb, mongoose, postgresql, prisma, mysql, sequelize, sqlite,
connection, uri, connect, disconnect, schema, model, migration,
seed, index, query, populate, aggregate, transaction, n+1,
pool, timeout, ssl, atlas, supabase
```

### 📡 ROTAS
```
express, router, route, endpoint, path, prefix, api, rest,
404, 405, get, post, put, patch, delete, params, query,
controller, handler, middleware, nexj
```

### 🖥️ FRONTEND
```
react, vue, nextjs, vite, axios, fetch, hook, component,
state, props, useEffect, useState, form, input, button,
loading, error, success, redirect, navigate, router-dom,
localStorage, context, redux, zustand
```

### ⚙️ CONFIG
```
dotenv, env, environment, variable, config, setup, startup,
package-json, scripts, port, host, node-env, production,
development, process-exit, validation
```

### 🔌 INTEGRACAO
```
webhook, stripe, mercado-pago, twilio, sendgrid, nodemailer,
cloudinary, aws, s3, firebase, google, external-api,
timeout, retry, fallback, idempotent
```

### ⚡ PERFORMANCE
```
pagination, limit, offset, skip, index, cache, redis,
lazy-load, n+1, query-optimization, lean, projection,
select, bulk, batch, async
```

### 🛡️ SEGURANCA
```
xss, csrf, injection, sql-injection, nosql-injection,
sanitize, validate, helmet, rate-limit, hardcoded,
exposed, sensitive, credentials, secret
```

---

## Sistema de IDs

Formato: `KB-[ANO][MÊS][DIA]-[SEQUENCIAL]`

Exemplos:
```
KB-20240115-001  → Primeiro registro em 15/01/2024
KB-20240115-002  → Segundo registro no mesmo dia
KB-20240116-001  → Primeiro registro em 16/01/2024
```

Se não houver data disponível, usar sequencial simples: `KB-001`, `KB-002`, etc.

---

## Critérios de Severidade

### 🔴 CRÍTICO
Aplicar quando o erro:
- Impede o sistema de funcionar completamente
- Representa vulnerabilidade de segurança
- Causa perda de dados
- Impede autenticação ou acesso

Exemplos: JWT_SECRET ausente, senha exposta, banco não conecta, CORS bloqueando tudo

### 🟠 IMPORTANTE
Aplicar quando o erro:
- Compromete funcionalidade core mas sistema ainda funciona parcialmente
- Afeta a experiência do usuário de forma significativa
- Representa má prática com risco real

Exemplos: rota protegida sem middleware, listagem sem paginação, erro silencioso no frontend

### 🟡 ATENÇÃO
Aplicar quando o erro:
- Representa má prática mas sem risco imediato
- Pode causar problemas com crescimento de dados ou usuários
- Dificulta manutenção

Exemplos: N+1 queries, sem loading state, sem índices no banco

### 🔵 MELHORIA
Aplicar quando:
- É uma sugestão de qualidade, não um erro
- Melhora a developer experience
- Segue boas práticas mas não é obrigatório

Exemplos: adicionar tipos TypeScript, melhorar mensagens de log, documentar endpoints

---

## Regras de Deduplicação

Antes de criar um novo registro, verificar:

1. **Mesma mensagem de erro exata** → É o mesmo erro, incrementar recorrência
2. **Mesmo sintoma, causa diferente** → Adicionar como variante do registro existente
3. **Mesmo problema, stack diferente** → Criar novo registro com referência ao original
4. **Problema similar mas contexto diferente** → Novo registro com tag `relacionado-KB-XXX`

### Exemplo de Variante
```
KB-002 (base):    CORS bloqueando — cors() não configurado
KB-002-v2:        CORS bloqueando — cors() depois das rotas (variante)
KB-002-v3:        CORS bloqueando — credentials ausente (variante)
```

---

## Métricas de Saúde da Base

Monitorar periodicamente:

```
Total de registros:        [N]
Registros com solução:     [N] ([X]% — ideal > 95%)
Registros sem causa raiz:  [N] ([X]% — ideal < 5%)
Erros recorrentes (3+x):   [N] (candidatos a checklist preventivo)
Categorias mais populares: [ranking]
Tempo médio de resolução:  [média dos registros]
```

Quando um erro aparecer 3+ vezes, deve virar item obrigatório no checklist preventivo
que o Knowledge Builder gera para o System Orchestrator.
