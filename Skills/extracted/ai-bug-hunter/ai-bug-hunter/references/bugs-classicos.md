# Bugs Clássicos por Tipo de Sistema — AI Bug Hunter

Bugs históricos e recorrentes. Verificar estes primeiro — são os mais prováveis.

---

## 🔐 Bugs de Autenticação (os mais críticos)

### BUG-AUTH-001: Algoritmo JWT "none" Aceito
```
Classificação: 🔴 CRÍTICO
Teste:
  Header JWT: { "alg": "none", "typ": "JWT" }
  Token: eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6IjEyMyIsInJvbGUiOiJhZG1pbiJ9.
  (sem assinatura)
Impacto: Qualquer pessoa pode criar token de admin sem chave
Correção:
  jwt.verify(token, secret, { algorithms: ['HS256'] }); // forçar algoritmo
```

### BUG-AUTH-002: Token Não Invalidado no Logout
```
Classificação: 🟠 MÉDIO
Teste:
  1. Login → obter token
  2. POST /auth/logout
  3. GET /api/profile com o token antigo → deve retornar 401
Impacto: Token roubado continua válido após logout
Correção:
  Implementar blacklist de tokens no Redis com TTL = expiresIn do JWT
```

### BUG-AUTH-003: Escalada de Privilégio via Campo role no Body
```
Classificação: 🔴 CRÍTICO
Teste:
  POST /auth/register { "name": "hacker", "email": "h@h.com",
                        "password": "123", "role": "admin" }
  → Verificar se usuário foi criado com role: admin
Impacto: Qualquer usuário pode se auto-promover para admin
Correção:
  Ignorar campo role no registro — sempre definir como 'user'
  const user = await User.create({ name, email, password, role: 'user' });
```

### BUG-AUTH-004: Exposição de Senha no Log ou Resposta
```
Classificação: 🔴 CRÍTICO
Teste:
  POST /auth/register → verificar resposta
  GET /api/users → verificar se campo password aparece
  Verificar logs do servidor após login
Impacto: Senha (mesmo hasheada) não deve ser retornada
Correção:
  Schema: password: { type: String, select: false }
  Query: User.findById(id).select('-password')
```

### BUG-AUTH-005: Mensagem de Erro Revelando se Email Existe
```
Classificação: 🟠 MÉDIO
Teste:
  POST /auth/login { email: "email_existente@test.com", password: "errada" }
  POST /auth/login { email: "nao_existe@test.com", password: "errada" }
  → Comparar as mensagens de erro
Impacto: Permite enumerar usuários cadastrados
Correção:
  Sempre retornar a mesma mensagem: "Credenciais inválidas"
  Nunca: "Email não encontrado" ou "Senha incorreta"
```

---

## 🌐 Bugs de CORS e Rede

### BUG-CORS-001: CORS Aberto em Produção
```
Classificação: 🔴 CRÍTICO
Teste:
  Verificar se origin: '*' está configurado
  Ou se qualquer origin é aceita
Impacto: Qualquer site pode fazer requisições à API com credenciais do usuário
Correção:
  origin: process.env.ALLOWED_ORIGINS?.split(',')
```

### BUG-CORS-002: CORS Permite Origin Maliciosa via Wildcard de Subdomínio
```
Classificação: 🟠 MÉDIO
Teste:
  Configuração: /meusistema\.com$/ (regex)
  Testar com: evil-meusistema.com
Impacto: Domínio malicioso pode contornar CORS
Correção:
  Whitelist explícita, nunca regex permissiva
```

---

## 📡 Bugs de API e Rotas

### BUG-API-001: IDOR — Acesso a Recurso de Outro Usuário
```
Classificação: 🔴 CRÍTICO
Teste:
  Login como user A → obter ID de um pedido de A
  Login como user B → GET /api/orders/[ID-DO-PEDIDO-DE-A]
  → Deve retornar 403
Impacto: Usuário pode ver dados de qualquer outro usuário
Correção:
  const order = await Order.findOne({ _id: id, userId: req.user._id });
  if (!order) return res.status(403).json({ message: 'Acesso negado' });
```

### BUG-API-002: Mass Assignment — Campos Não Permitidos Aceitos
```
Classificação: 🟠 MÉDIO
Teste:
  PUT /api/users/profile {
    "name": "João",
    "role": "admin",          // não deveria ser editável
    "_id": "outro-id",        // não deveria ser editável
    "createdAt": "2020-01-01" // não deveria ser editável
  }
Impacto: Usuário pode alterar campos internos do sistema
Correção:
  const { name, email, phone } = req.body; // extrair apenas o permitido
  await User.findByIdAndUpdate(id, { name, email, phone });
```

### BUG-API-003: Endpoint de Listagem Sem Filtro do Usuário
```
Classificação: 🔴 CRÍTICO
Teste:
  GET /api/orders → retorna pedidos de TODOS os usuários?
  → Deve retornar apenas os do usuário autenticado
Impacto: Vazamento de dados de todos os usuários
Correção:
  const orders = await Order.find({ userId: req.user._id });
```

### BUG-API-004: Falta de Rate Limiting em Endpoints Sensíveis
```
Classificação: 🟠 MÉDIO
Teste:
  Enviar 100 requisições em 1 segundo para POST /auth/login
  → Deve ser bloqueado após N tentativas
Impacto: Brute force de senhas possível
Correção:
  const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 10 });
  app.use('/api/auth/login', loginLimiter);
```

### BUG-API-005: Stack Trace Exposto em Erro 500
```
Classificação: 🟠 MÉDIO
Teste:
  Provocar um erro 500 (enviar dado inválido sem try/catch)
  → Verificar se a resposta contém stack trace ou path do servidor
Impacto: Exposição de estrutura interna do sistema
Correção:
  errorHandler: nunca retornar err.stack em produção
  NODE_ENV=production → apenas message genérica
```

---

## 🗄️ Bugs de Banco de Dados

### BUG-DB-001: Unique Constraint Não Tratada (retorna 500)
```
Classificação: 🟠 MÉDIO
Teste:
  Criar dois usuários com o mesmo email
  → Deve retornar 409 na segunda tentativa
  → Bug se retornar 500 (MongoServerError não capturado)
Impacto: Mensagem de erro interna exposta ao usuário
Correção:
  catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email já cadastrado' });
    }
    next(err);
  }
```

### BUG-DB-002: Injeção NoSQL via Objeto no Body
```
Classificação: 🔴 CRÍTICO
Teste:
  POST /auth/login { "email": { "$gt": "" }, "password": "qualquer" }
  → Deve retornar 400 (email deve ser string)
  → Bug CRÍTICO se retornar 200 (login sem credencial)
Impacto: Login sem senha válida
Correção:
  Validar que email é string antes de usar:
  if (typeof email !== 'string') return res.status(400)...
  Ou usar library de validação (Joi, Zod, express-validator)
```

### BUG-DB-003: Dados Órfãos Após Delete
```
Classificação: 🟡 BAIXO
Teste:
  Deletar usuário que possui pedidos
  → Verificar se os pedidos ficam com userId apontando para nada
Impacto: Inconsistência referencial no banco
Correção:
  Cascade delete: ao deletar usuário, deletar seus registros relacionados
  OU soft delete: marcar como deletado sem remover
```

### BUG-DB-004: N+1 Queries em Endpoint de Listagem
```
Classificação: 🟡 BAIXO
Teste:
  Monitorar queries no banco durante GET /api/orders
  → Deve executar 1 ou 2 queries no máximo
  → Bug se executar 1 query por ordem (N+1)
Impacto: Performance degrada com volume, pode derrubar em produção
Correção:
  Order.find().populate('userId', 'name email').lean()
```

---

## 🖥️ Bugs de Frontend

### BUG-FE-001: Duplo Envio de Formulário
```
Classificação: 🟠 MÉDIO
Teste:
  Clicar rapidamente no botão de submit 5 vezes
  → Verificar quantos registros foram criados no banco
Impacto: Registros duplicados, cobranças duplicadas
Correção:
  const [loading, setLoading] = useState(false);
  if (loading) return; // guard
  setLoading(true);
  try { await submit(); } finally { setLoading(false); }
  <button disabled={loading}>
```

### BUG-FE-002: Token Armazenado em localStorage sem Proteção contra XSS
```
Classificação: 🟠 MÉDIO
Observação: Não é bug do código, é trade-off arquitetural
Teste:
  Verificar onde o token está armazenado (localStorage vs httpOnly cookie)
Impacto: Se XSS existir, token é roubado via localStorage
Correção avançada:
  Usar httpOnly cookies para armazenar o token
  (requires backend mudança: Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict)
```

### BUG-FE-003: Dados Sensíveis em URL (Query Params)
```
Classificação: 🟠 MÉDIO
Teste:
  Verificar se senhas, tokens ou IDs sensíveis aparecem na URL
  Ex: /reset-password?token=abc123 (aceitável)
  Ex: /login?email=user&password=123 (CRÍTICO)
Impacto: Dados em logs do servidor, histórico do browser, referrer header
Correção:
  Dados sensíveis sempre em POST body, nunca em URL
```

### BUG-FE-004: Rota Protegida Acessível pelo URL sem Login
```
Classificação: 🔴 CRÍTICO
Teste:
  Sem estar logado, acessar diretamente: /dashboard, /admin, /profile
  → Deve redirecionar para /login
  → Bug se: página carrega (mesmo sem dados = vaza estrutura)
Correção:
  PrivateRoute verificando token antes de renderizar
```

---

## ⚡ Bugs de Performance e Estabilidade

### BUG-PERF-001: Endpoint Retorna Array Não Paginado
```
Classificação: 🟡 BAIXO (hoje) / 🟠 MÉDIO (em produção com volume)
Teste:
  GET /api/products → quantos registros retorna?
  Inserir 10.000 produtos → timeout?
Impacto: Sistema cai em produção com volume de dados real
Correção:
  Sempre usar .limit() e paginação
```

### BUG-PERF-002: Memory Leak em WebSocket / Socket.io
```
Classificação: 🟠 MÉDIO (se o sistema usa WebSocket)
Teste:
  Conectar 100 clientes → desconectar → verificar se listeners foram removidos
Impacto: Memória cresce indefinidamente, servidor cai após horas
Correção:
  socket.on('disconnect', () => { socket.removeAllListeners(); });
```

### BUG-PERF-003: Timeout Não Configurado em Chamadas Externas
```
Classificação: 🟡 BAIXO
Teste:
  Simular API externa demorando 60 segundos
  → O servidor fica travado esperando?
Impacto: Uma API externa lenta pode travar todas as requisições
Correção:
  axios.get(url, { timeout: 10000 }); // 10 segundos máximo
```
