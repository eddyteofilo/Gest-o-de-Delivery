# Padrões de API — System Auditor

Referência de respostas esperadas, códigos HTTP e padrões de qualidade para auditoria de APIs.

---

## Padrão de Resposta (Obrigatório)

Toda API auditada deve seguir este padrão consistente:

```json
// ✅ Sucesso — item único
{
  "success": true,
  "data": { "id": "...", "name": "..." }
}

// ✅ Sucesso — lista paginada
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}

// ✅ Erro simples
{
  "success": false,
  "message": "Descrição clara do erro para o usuário"
}

// ✅ Erro de validação com campos
{
  "success": false,
  "message": "Dados inválidos",
  "errors": [
    { "field": "email", "message": "E-mail inválido" },
    { "field": "password", "message": "Mínimo 8 caracteres" }
  ]
}
```

---

## Códigos HTTP por Cenário

### Sucessos (2xx)

| Código | Quando usar | Exemplo |
|--------|-------------|---------|
| 200 OK | Leitura ou atualização bem-sucedida | GET, PUT, PATCH, DELETE |
| 201 Created | Recurso criado com sucesso | POST que cria registro |
| 204 No Content | Sucesso sem corpo de resposta | DELETE (alternativa ao 200) |

### Erros do Cliente (4xx)

| Código | Quando usar | Exemplo |
|--------|-------------|---------|
| 400 Bad Request | Dados inválidos ou malformados | Campos obrigatórios ausentes |
| 401 Unauthorized | Não autenticado | Token ausente ou inválido |
| 403 Forbidden | Autenticado mas sem permissão | User tentando rota de admin |
| 404 Not Found | Recurso não encontrado | GET /users/id-inexistente |
| 409 Conflict | Conflito de dados | Email já cadastrado |
| 422 Unprocessable | Dados válidos mas lógica rejeitou | Saldo insuficiente |
| 429 Too Many Requests | Rate limit excedido | Muitas tentativas de login |

### Erros do Servidor (5xx)

| Código | Quando usar |
|--------|-------------|
| 500 Internal Server Error | Erro inesperado não tratado |
| 502 Bad Gateway | Serviço externo inacessível |
| 503 Service Unavailable | Servidor sobrecarregado ou em manutenção |

---

## Checklist de Qualidade de Endpoint

Para cada endpoint auditado, verificar:

### Segurança
```
□ Requer autenticação (se deve exigir)
□ Verifica autorização por papel
□ Valida e sanitiza todos os inputs
□ Não expõe dados sensíveis na resposta
□ Não vaza informações em mensagens de erro
```

### Consistência
```
□ Segue padrão REST (substantivo plural, sem verbos na URL)
    ✅ GET /api/users
    ❌ GET /api/getUsers
□ Usa os métodos HTTP corretos
    ✅ POST para criar, PUT/PATCH para atualizar, DELETE para remover
    ❌ POST para tudo
□ Retorna código HTTP semanticamente correto
□ Resposta no formato padrão { success, data / message }
```

### Robustez
```
□ Wrapped em try/catch (nunca deixa erro não tratado)
□ Valida existência do recurso antes de operar (404 claro)
□ Trata conflitos explicitamente (409 com mensagem útil)
□ Paginação implementada em listagens (nunca retornar tudo)
□ Timeout configurado para operações longas
```

---

## Auditoria de Endpoints de Auth

### POST /auth/register

```
✅ Deve:
  - Retornar 201 com token e dados do usuário (sem senha)
  - Hash da senha antes de salvar
  - Retornar 409 se email já existir
  - Retornar 400 com erros se campos inválidos

❌ Não deve:
  - Retornar senha em nenhuma circunstância
  - Aceitar role: 'admin' vindo do body
  - Revelar se email já existe via mensagem diferente
```

### POST /auth/login

```
✅ Deve:
  - Retornar 200 com token JWT e dados do usuário
  - Token com expiresIn definido (máx 30 dias)
  - Retornar 401 GENÉRICO para email errado E senha errada
  - Aceitar rate limiting (máx 10 tentativas / 15 min)

❌ Não deve:
  - Diferenciar "email não encontrado" de "senha errada"
  - Retornar senha ou hash da senha
  - Retornar 500 para credenciais inválidas
```

### GET /auth/me

```
✅ Deve:
  - Retornar 200 com dados do usuário autenticado
  - Retornar 401 sem token
  - Retornar 401 com token expirado (mensagem: "Token expirado")
  - Retornar 401 com token inválido

❌ Não deve:
  - Retornar senha ou dados sensíveis
  - Aceitar token sem verificação de assinatura
```

---

## Padrão de Paginação

```javascript
// ✅ Query params esperados
GET /api/users?page=1&limit=20&sort=createdAt&order=desc&search=joao

// ✅ Resposta esperada
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}

// ✅ Implementação (Mongoose)
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 20, 100); // máx 100
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  Model.find(filter).sort(sort).skip(skip).limit(limit).select('-password'),
  Model.countDocuments(filter)
]);

res.json({
  success: true,
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  }
});
```

---

## Red Flags na Auditoria de API

Marcar como 🔴 CRÍTICO se encontrar:
- Credenciais hardcoded em qualquer lugar do código
- Senha retornada em qualquer resposta
- Rota que deveria ser protegida sem middleware de auth
- SQL/NoSQL injection possível (inputs não sanitizados)
- CORS aberto (`origin: '*'`) em produção

Marcar como 🟠 IMPORTANTE se encontrar:
- Sem paginação em listagens
- Sem validação de input (aceita qualquer body)
- Sem rate limiting no login
- Códigos HTTP incorretos (200 para erro, etc.)
- Stack trace exposto no erro 500

Marcar como 🟡 ATENÇÃO se encontrar:
- Sem endpoint /health
- Logs com `console.log` em vez de logger estruturado
- Sem documentação dos endpoints
- Respostas inconsistentes (às vezes com `data`, às vezes sem)
