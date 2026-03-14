# Knowledge Seed — Base Inicial de Conhecimento

20 erros mais comuns pré-catalogados. Carregue estes registros ao iniciar a base.

---

## KB-001 | JWT_SECRET Ausente ou Hardcoded
```
Categoria:    AUTH
Severidade:   🔴 CRÍTICO
Tags:         jwt, auth, env, secret
Stack:        Node.js/Express

Sintoma:      401 em todas as rotas protegidas / "invalid signature"
Mensagem:     JsonWebTokenError: invalid signature
              OU process.env.JWT_SECRET === undefined
Causa raiz:   JWT_SECRET não definido no .env OU dotenv não carregado antes do uso

Solução:      Adicionar JWT_SECRET no .env e garantir import 'dotenv/config' na 1ª linha
Tempo médio:  5 minutos

Código antes:
  const token = jwt.sign(payload, 'minha-senha-hardcoded');

Código depois:
  // Primeira linha do server.js:
  import 'dotenv/config';
  // .env:
  JWT_SECRET=string_aleatoria_minimo_32_caracteres
  // uso:
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

Prevenção:    Validar variáveis obrigatórias no startup com process.exit(1) se ausentes
```

---

## KB-002 | CORS Bloqueando Frontend
```
Categoria:    CORS
Severidade:   🔴 CRÍTICO
Tags:         cors, headers, origin, browser
Stack:        Node.js/Express + qualquer frontend

Sintoma:      Requisições bloqueadas no browser, API não responde
Mensagem:     Access to XMLHttpRequest blocked by CORS policy: No 'Access-Control-Allow-Origin'
Causa raiz:   cors() não configurado OU origin não inclui o frontend OU cors após rotas

Solução:      Configurar cors() com origin correta ANTES das rotas
Tempo médio:  10 minutos

Código antes:
  app.use('/api', routes); // sem cors
  app.use(cors()); // cors genérico ou depois das rotas

Código depois:
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
  }));
  app.use('/api', routes); // rotas DEPOIS do cors

Prevenção:    Sempre configurar ALLOWED_ORIGINS no .env.example
```

---

## KB-003 | Banco Sobe Depois do Servidor
```
Categoria:    BANCO
Severidade:   🔴 CRÍTICO
Tags:         mongodb, mongoose, startup, conexao, race-condition
Stack:        Node.js + MongoDB

Sintoma:      Servidor sobe mas queries falham nas primeiras requisições
Mensagem:     MongoNotConnectedError: Client must be connected before running operations
Causa raiz:   app.listen() chamado antes de mongoose.connect() resolver

Solução:      Aguardar conexão do banco antes de chamar app.listen()
Tempo médio:  5 minutos

Código antes:
  mongoose.connect(process.env.MONGODB_URI);
  app.listen(3001); // sobe sem esperar o banco

Código depois:
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Banco conectado');
      app.listen(process.env.PORT || 3001);
    })
    .catch(err => { console.error(err); process.exit(1); });

Prevenção:    Sempre usar padrão async/await ou .then encadeado para startup
```

---

## KB-004 | Rota Não Registrada no Router Principal
```
Categoria:    ROTAS
Severidade:   🟠 IMPORTANTE
Tags:         routes, 404, express, router
Stack:        Node.js/Express

Sintoma:      Cannot GET /api/[rota] mesmo com arquivo de rota criado
Mensagem:     Cannot GET /api/products (exemplo)
Causa raiz:   Arquivo de rota criado mas não importado/registrado em routes/index.js

Solução:      Importar e registrar a rota no router principal
Tempo médio:  3 minutos

Código antes:
  // routes/index.js — rota não registrada
  import authRoutes from './auth.routes.js';
  router.use('/auth', authRoutes);
  // productRoutes nunca importado!

Código depois:
  import authRoutes    from './auth.routes.js';
  import productRoutes from './product.routes.js'; // ← adicionar
  router.use('/auth',     authRoutes);
  router.use('/products', productRoutes); // ← registrar

Prevenção:    Sempre registrar nova rota no index.js imediatamente após criar o arquivo
```

---

## KB-005 | Token Não Enviado no Header
```
Categoria:    AUTH
Severidade:   🟠 IMPORTANTE
Tags:         jwt, axios, frontend, authorization, header
Stack:        React + qualquer backend

Sintoma:      401 em rotas que existem e têm middleware correto
Causa raiz:   Frontend não inclui o token no header Authorization das requisições

Solução:      Adicionar interceptor no axios que injeta o token automaticamente
Tempo médio:  10 minutos

Código antes:
  const res = await axios.get('/api/profile'); // sem token!

Código depois:
  // src/services/api.js
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

Prevenção:    Sempre criar instância centralizada do axios com interceptors
```

---

## KB-006 | Rota Protegida Sem Middleware de Auth
```
Categoria:    AUTH
Severidade:   🔴 CRÍTICO
Tags:         auth, middleware, segurança, rota, express
Stack:        Node.js/Express

Sintoma:      Rota acessível sem autenticação quando deveria ser protegida
Causa raiz:   Middleware authenticate não aplicado na definição da rota

Solução:      Adicionar middleware authenticate antes do controller
Tempo médio:  2 minutos

Código antes:
  router.get('/admin/users', AdminController.list); // sem auth!

Código depois:
  router.get('/admin/users', authenticate, authorize('admin'), AdminController.list);

Prevenção:    Revisar todas as rotas criadas e marcar explicitamente as públicas
```

---

## KB-007 | Variáveis de Ambiente Não Validadas
```
Categoria:    CONFIG
Severidade:   🟠 IMPORTANTE
Tags:         env, dotenv, config, startup, undefined
Stack:        Node.js/Express

Sintoma:      Erros silenciosos com undefined em configurações críticas
Causa raiz:   .env não configurado e nenhuma validação no startup

Solução:      Validar todas as variáveis obrigatórias antes do servidor subir
Tempo médio:  10 minutos

Código depois:
  const required = ['MONGODB_URI', 'JWT_SECRET', 'ALLOWED_ORIGINS'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error('❌ Variáveis ausentes:', missing.join(', '));
    process.exit(1);
  }

Prevenção:    Manter .env.example atualizado a cada nova variável adicionada
```

---

## KB-008 | Error Handler Global Ausente ou Fora de Ordem
```
Categoria:    CONFIG
Severidade:   🟠 IMPORTANTE
Tags:         error, middleware, express, 500, stack-trace
Stack:        Node.js/Express

Sintoma:      Erros retornam HTML do Express em vez de JSON / stack trace exposto
Causa raiz:   Error handler não registrado OU registrado antes das rotas

Solução:      Registrar errorHandler como ÚLTIMO middleware
Tempo médio:  5 minutos

Código depois:
  app.use('/api', routes);           // rotas primeiro
  app.use(notFoundHandler);          // 404 depois das rotas
  app.use(errorHandler);             // erro SEMPRE por último

  export const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Erro interno',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  };

Prevenção:    Criar template de server.js com ordem correta dos middlewares
```

---

## KB-009 | URL Base da API Errada no Frontend
```
Categoria:    FRONTEND
Severidade:   🟠 IMPORTANTE
Tags:         axios, api-url, env, frontend, network-error
Stack:        React/Vite + qualquer backend

Sintoma:      Network Error / ERR_CONNECTION_REFUSED em todas as requisições
Causa raiz:   baseURL do axios aponta para porta ou path errado

Solução:      Configurar VITE_API_URL no .env e usar via import.meta.env
Tempo médio:  5 minutos

Código depois:
  // .env (frontend)
  VITE_API_URL=http://localhost:3001/api

  // src/services/api.js
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  });

Prevenção:    Sempre externalizar URL da API — nunca hardcodar no código
```

---

## KB-010 | N+1 Queries
```
Categoria:    PERFORMANCE
Severidade:   🟡 ATENÇÃO
Tags:         mongodb, mongoose, query, populate, performance, n+1
Stack:        Node.js + MongoDB/Mongoose

Sintoma:      API lenta em listagens com muitos itens / muitas queries no log
Causa raiz:   Busca de dados relacionados dentro de loop

Solução:      Usar populate() para eager loading dos relacionamentos
Tempo médio:  15 minutos

Código antes:
  const orders = await Order.find();
  for (const order of orders) {
    order.user = await User.findById(order.userId); // N queries!
  }

Código depois:
  const orders = await Order.find()
    .populate('userId', 'name email')
    .lean();

Prevenção:    Sempre usar populate para relacionamentos em listagens
```

---

## KB-011 | Senha Retornada na Resposta
```
Categoria:    AUTH
Severidade:   🔴 CRÍTICO
Tags:         senha, segurança, hash, select, mongoose, resposta
Stack:        Node.js + MongoDB/Mongoose

Sintoma:      Resposta da API inclui campo password (mesmo que hasheado)
Causa raiz:   Campo password sem select: false no schema OU projeção não aplicada

Solução:      Adicionar select: false no schema e excluir explicitamente nas queries
Tempo médio:  5 minutos

Código depois:
  // No schema:
  password: { type: String, required: true, select: false }

  // Nas queries de leitura:
  const user = await User.findById(id).select('-password');

Prevenção:    Sempre testar resposta da API em /auth/me e listagens de usuários
```

---

## KB-012 | Erro Silencioso no Frontend (Catch Vazio)
```
Categoria:    FRONTEND
Severidade:   🟠 IMPORTANTE
Tags:         react, error, catch, ux, feedback, usuario
Stack:        React

Sintoma:      Ação no frontend não funciona e usuário não vê nenhuma mensagem de erro
Causa raiz:   try/catch captura o erro mas não exibe para o usuário

Solução:      Sempre exibir estado de erro via setState no catch
Tempo médio:  10 minutos

Código antes:
  try {
    await api.post('/items', data);
  } catch (err) {} // engolindo o erro!

Código depois:
  const [error, setError] = useState(null);
  try {
    await api.post('/items', data);
    setSuccess('Salvo com sucesso!');
  } catch (err) {
    setError(err.response?.data?.message || 'Erro ao salvar');
  }
  // Na UI:
  {error && <p className="text-red-500">{error}</p>}

Prevenção:    Code review — nunca aceitar catch com corpo vazio
```

---

## KB-013 | Duplo Envio de Formulário
```
Categoria:    FRONTEND
Severidade:   🟡 ATENÇÃO
Tags:         react, form, loading, button, submit, duplicate
Stack:        React

Sintoma:      Clique rápido ou duplo clique cria registros duplicados
Causa raiz:   Botão de submit não desabilitado durante a requisição

Solução:      Usar estado loading para desabilitar o botão durante o envio
Tempo médio:  5 minutos

Código depois:
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try { await api.post('/items', data); }
    finally { setLoading(false); }
  };
  <button onClick={handleSubmit} disabled={loading}>
    {loading ? 'Salvando...' : 'Salvar'}
  </button>

Prevenção:    Template padrão de formulário já deve incluir loading state
```

---

## KB-014 | Prefixo /api Inconsistente
```
Categoria:    ROTAS
Severidade:   🟠 IMPORTANTE
Tags:         api, prefix, routes, frontend, backend, 404
Stack:        Node.js/Express + qualquer frontend

Sintoma:      404 no frontend mas rota existe no backend
Causa raiz:   Backend usa /api/rota mas frontend chama /rota (ou vice-versa)

Solução:      Padronizar prefixo e centralizar em variável de ambiente
Tempo médio:  10 minutos

Código depois:
  // Backend: app.use('/api', routes)
  // Frontend baseURL: http://localhost:3001/api
  // Chamada: api.get('/users') → http://localhost:3001/api/users ✅

Prevenção:    Definir VITE_API_URL com o prefixo incluído — nunca concatenar em cada chamada
```

---

## KB-015 | Middleware na Ordem Errada
```
Categoria:    CONFIG
Severidade:   🟠 IMPORTANTE
Tags:         middleware, express, cors, helmet, ordem, body-parser
Stack:        Node.js/Express

Sintoma:      CORS falha mesmo configurado / Body undefined nos controllers
Causa raiz:   Middlewares registrados em ordem incorreta

Solução:      Seguir ordem obrigatória: segurança → cors → body → rotas → erros
Tempo médio:  5 minutos

Código depois:
  app.use(helmet());           // 1. Segurança
  app.use(cors(options));      // 2. CORS (antes de tudo)
  app.use(express.json());     // 3. Parse body
  app.use('/api', routes);     // 4. Rotas
  app.use(errorHandler);       // 5. Erros (sempre por último)

Prevenção:    Usar template de server.js padronizado em todos os projetos
```

---

## KB-016 | dotenv Não Carregado na Primeira Linha
```
Categoria:    CONFIG
Severidade:   🔴 CRÍTICO
Tags:         dotenv, env, import, configuracao, undefined
Stack:        Node.js

Sintoma:      Variáveis de ambiente undefined mesmo com .env configurado
Causa raiz:   import 'dotenv/config' não é a primeira instrução do arquivo

Solução:      Mover import 'dotenv/config' para a PRIMEIRA linha absoluta
Tempo médio:  2 minutos

Código antes:
  import express from 'express';
  import 'dotenv/config'; // tarde demais!
  import { connectDB } from './config/database.js'; // já tentou usar env

Código depois:
  import 'dotenv/config'; // SEMPRE primeira linha
  import express from 'express';
  import { connectDB } from './config/database.js';

Prevenção:    Lint rule ou template que garanta dotenv na linha 1
```

---

## KB-017 | Listagem Sem Paginação
```
Categoria:    PERFORMANCE
Severidade:   🟡 ATENÇÃO
Tags:         paginacao, query, performance, mongodb, postgresql, limit
Stack:        Qualquer backend

Sintoma:      API lenta / timeout em produção com volume de dados
Causa raiz:   Endpoint retorna TODOS os registros sem limit

Solução:      Implementar paginação com page, limit e totalPages
Tempo médio:  20 minutos

Código depois:
  const page  = parseInt(req.query.page)  || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip  = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Model.find().skip(skip).limit(limit).lean(),
    Model.countDocuments()
  ]);
  res.json({ success: true, data,
    pagination: { total, page, limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1 }});

Prevenção:    Nenhum endpoint de listagem deve retornar sem limit
```

---

## KB-018 | Token Expirado Não Tratado no Frontend
```
Categoria:    AUTH
Severidade:   🟠 IMPORTANTE
Tags:         jwt, token, expirado, 401, interceptor, frontend
Stack:        React + qualquer backend

Sintoma:      Usuário vê erro 401 genérico ou tela quebrada após token expirar
Causa raiz:   Frontend não trata 401 globalmente — cada chamada falha individualmente

Solução:      Interceptor global no axios que limpa token e redireciona para login
Tempo médio:  10 minutos

Código depois:
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

Prevenção:    Sempre configurar interceptor de response no setup inicial do axios
```

---

## KB-019 | Dados Sensíveis em Variáveis Hardcoded
```
Categoria:    CONFIG
Severidade:   🔴 CRÍTICO
Tags:         segurança, hardcode, secrets, senha, api-key
Stack:        Qualquer

Sintoma:      Credenciais ou chaves de API diretamente no código fonte
Causa raiz:   Desenvolvedor adicionou credenciais diretamente para "testar rapidinho"

Solução:      Mover TODA credencial para variável de ambiente
Tempo médio:  15 minutos

Código antes:
  const stripe = new Stripe('sk_live_abc123REAL_KEY');
  mongoose.connect('mongodb+srv://user:SenhaReal@cluster.mongodb.net');

Código depois:
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  mongoose.connect(process.env.MONGODB_URI);
  // .env.example: STRIPE_SECRET_KEY=sk_live_...

Prevenção:    .gitignore com .env / git-secrets hook / code review obrigatório
```

---

## KB-020 | Rotas de Admin Sem Verificação de Role
```
Categoria:    AUTH
Severidade:   🔴 CRÍTICO
Tags:         admin, role, autorização, segurança, authorize
Stack:        Node.js/Express

Sintoma:      Usuário comum consegue acessar funcionalidades de admin
Causa raiz:   authenticate verifica apenas login, mas authorize('admin') não foi aplicado

Solução:      Adicionar middleware authorize após authenticate em rotas administrativas
Tempo médio:  5 minutos

Código antes:
  router.delete('/users/:id', authenticate, UserController.delete); // qualquer user pode!

Código depois:
  router.delete('/users/:id', authenticate, authorize('admin'), UserController.delete);

  export const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    next();
  };

Prevenção:    Auditar todas as rotas DELETE e de gestão — sempre precisam de authorize
```
