# OWASP Top 10 Checklist — Security AI Auditor

Checklist completo baseado no OWASP Top 10 (2021) com verificações práticas.

---

## A01 — Broken Access Control (Controle de Acesso Quebrado)
*#1 mais prevalente — presente em 94% dos sistemas testados*

```
VERIFICAÇÕES OBRIGATÓRIAS:
  □ Usuário A não acessa recursos do usuário B (IDOR)
  □ Usuário comum não acessa rotas de admin
  □ Método HTTP incorreto não bypassa autorização
     (GET /api/admin funciona mas DELETE /api/admin é bloqueado?)
  □ Não é possível elevar role via body do request
  □ JWT não pode ser adulterado para elevar privilégio
  □ Acesso à página de admin via URL direta está bloqueado no frontend
  □ Paginação não vaza registros de outros usuários
  □ Busca/filtro não retorna dados de outros usuários

EXEMPLOS DE TESTE:
  Login como user A → obter ID de recurso → logout
  Login como user B → GET /api/resources/[ID-DE-A] → deve ser 403

  POST /auth/register { "role": "admin" } → deve ser ignorado
  PUT /api/profile { "_id": "outro-id" } → deve ser rejeitado
```

---

## A02 — Cryptographic Failures (Falhas Criptográficas)

```
VERIFICAÇÕES OBRIGATÓRIAS:
  □ Senhas com bcrypt/argon2 (mínimo rounds 12)
  □ HTTPS em produção (sem HTTP em produção)
  □ Dados sensíveis criptografados no banco (CPF, cartão)
  □ JWT com algoritmo seguro (HS256 mínimo, RS256 ideal)
  □ Secrets gerados com crypto.randomBytes() (não Math.random())
  □ Tokens de reset/verificação são únicos e aleatórios
  □ Certificados SSL válidos e não expirados

BUSCAR NO CÓDIGO:
  MD5, SHA1 → algoritmos fracos para senha
  Math.random() → não criptograficamente seguro
  http:// em URLs de produção
  "algorithm: none" em verify JWT
```

---

## A03 — Injection (Injeção)

```
VERIFICAÇÕES OBRIGATÓRIAS:
  □ Sem concatenação de string em queries SQL/NoSQL
  □ Inputs validados antes de qualquer query
  □ Operadores MongoDB não aceitos em inputs ($gt, $where, $regex)
  □ ORM/ODM usado corretamente (Prisma, Mongoose, Sequelize)
  □ Sem eval() com conteúdo de input de usuário
  □ Comandos de SO não executados com input de usuário
  □ Templates engine configurados com auto-escape

PAYLOADS DE TESTE MÍNIMOS:
  ' OR '1'='1            (SQL)
  { "$gt": "" }          (NoSQL)
  <script>alert(1)</script>  (XSS/Template Injection)
  ../../../etc/passwd    (Path Traversal)
```

---

## A04 — Insecure Design (Design Inseguro)

```
VERIFICAÇÕES:
  □ Fluxos de negócio seguros (não é possível pular etapas)
  □ Limite de tentativas em operações críticas
  □ Confirmação dupla para ações destrutivas (delete, cancelamento)
  □ Tokens de reset de senha são de uso único
  □ Links de confirmação expiram
  □ Não é possível adivinhar IDs de recursos (UUIDs vs sequenciais)
```

---

## A05 — Security Misconfiguration (Configuração Insegura)

```
VERIFICAÇÕES OBRIGATÓRIAS:
  □ NODE_ENV=production em produção
  □ Sem stack trace em respostas de erro
  □ Headers de segurança presentes (helmet())
  □ CORS restritivo (não origin: '*' em produção)
  □ Credenciais padrão alteradas
  □ Endpoints de debug/test removidos em produção
  □ Versões de servidor não expostas (X-Powered-By removido)
  □ npm audit sem critical/high

HEADERS QUE DEVEM EXISTIR:
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=31536000
  Content-Security-Policy: [política restritiva]
  Referrer-Policy: strict-origin-when-cross-origin
```

---

## A06 — Vulnerable Components (Componentes Vulneráveis)

```
VERIFICAÇÕES:
  □ npm audit → zero critical/high
  □ package-lock.json commitado
  □ Dependências atualizadas (verificar últimas 6 versões)
  □ Sem dependências abandonadas (último commit > 2 anos)
  □ Frontend e backend auditados separadamente

COMANDOS:
  npm audit --audit-level=critical
  npx snyk test
  npx npm-check-updates  (ver atualizações disponíveis)
```

---

## A07 — Authentication Failures (Falhas de Autenticação)

```
VERIFICAÇÕES OBRIGATÓRIAS:
  □ Sem credenciais padrão (admin/admin, test/test)
  □ Rate limiting em login (≤ 10 tentativas / 15 min)
  □ Mensagens de erro genéricas (não revelar se usuário existe)
  □ Sessão invalidada no logout
  □ JWT com expiração configurada
  □ Senha mínima: 8 chars (melhor: 12 + complexidade)
  □ Recuperação de senha via token temporário e único
  □ Multi-factor authentication disponível (para sistemas críticos)

TESTES:
  POST /auth/login 20x com senha errada → rate limiting?
  Usar token após logout → 401?
  POST /auth/login { email inexistente } vs { senha errada } → mesma mensagem?
```

---

## A08 — Software and Data Integrity Failures

```
VERIFICAÇÕES:
  □ Webhooks validam assinatura (HMAC secret)
  □ Arquivos baixados verificam integridade (checksum)
  □ Atualizações automáticas de dependências com verificação
  □ Serialização/desserialização de dados tem validação de schema
  □ Pipelines de CI/CD protegidos contra inserção de código malicioso
```

---

## A09 — Security Logging Failures (Falhas de Log)

```
VERIFICAÇÕES OBRIGATÓRIAS:
  □ Tentativas de login falhadas são logadas
  □ Alterações de senha/email são logadas
  □ Acessos a dados sensíveis são logados
  □ Erros 4xx e 5xx são logados com contexto
  □ Logs NÃO contêm senhas ou tokens
  □ Logs são armazenados por tempo suficiente (90+ dias)
  □ Alertas para padrões suspeitos (muitos 401, etc.)

O QUE LOGAR:
  - Timestamp + IP + User-Agent
  - userID do usuário autenticado
  - Ação realizada
  - Resultado (sucesso/falha)
  - NÃO: senha, token, dados de cartão
```

---

## A10 — Server-Side Request Forgery (SSRF)

```
VERIFICAÇÕES (se o sistema faz requisições baseadas em input do usuário):
  □ URLs de webhooks validadas contra whitelist de domínios
  □ URLs de import/fetch validadas (sem localhost, IPs internos)
  □ Metadados de cloud não acessíveis via SSRF
     (169.254.169.254 — AWS metadata)
  □ Redirecionamentos não seguidos automaticamente para domínios externos

TESTE:
  Se houver campo de URL (webhook, avatar, import):
  Testar: http://localhost:3001/api/admin
  Testar: http://169.254.169.254/latest/meta-data/
  Testar: file:///etc/passwd
```

---

## Checklist Rápido — Pré-Produção

Use este checklist antes de qualquer deploy em produção:

```
AUTENTICAÇÃO:
  [ ] bcrypt rounds ≥ 12
  [ ] JWT_SECRET aleatório ≥ 32 chars
  [ ] JWT com expiresIn configurado
  [ ] Rate limiting em /auth/login
  [ ] Mensagens de erro genéricas

AUTORIZAÇÃO:
  [ ] Todas as rotas verificadas para auth/authorize
  [ ] IDOR testado: user A não acessa recurso de user B
  [ ] Role não aceita via request body

DADOS:
  [ ] .env no .gitignore
  [ ] Nenhuma credencial no código fonte
  [ ] Senha com select: false no schema
  [ ] HTTPS configurado e forçado

HEADERS:
  [ ] helmet() ativo
  [ ] CORS com whitelist explícita
  [ ] X-Powered-By desabilitado

CÓDIGO:
  [ ] npm audit limpo
  [ ] NODE_ENV=production
  [ ] Stack trace não retornado em produção
  [ ] Todos os inputs validados

INFRAESTRUTURA:
  [ ] Certificado SSL válido
  [ ] HSTS configurado
  [ ] Firewall do banco configurado
  [ ] Logs de segurança ativos
```
