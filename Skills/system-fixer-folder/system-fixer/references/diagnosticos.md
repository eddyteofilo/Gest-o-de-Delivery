# Diagnósticos — System Fixer

Mapeamento de sintomas → causa raiz → correção aplicada.
Use para diagnosticar rapidamente antes de corrigir.

---

## 🔴 Servidor Não Sobe

### Sintoma: `Error: Cannot find module '...'`
```
Causa raiz: Import/require de módulo não instalado ou caminho errado
Diagnóstico:
  1. Verificar se módulo está no package.json
  2. Verificar se npm install foi executado
  3. Verificar se o caminho relativo está correto (./arquivo vs ../arquivo)
Correção:
  → npm install [modulo-faltante]
  → Corrigir path do import
```

### Sintoma: `SyntaxError: Cannot use import statement`
```
Causa raiz: Node.js sem suporte a ES Modules
Diagnóstico:
  Verificar package.json — falta "type": "module"
  OU arquivo .js usando import sem estar configurado como ESM
Correção:
  → Adicionar "type": "module" no package.json
  → OU renomear arquivo para .mjs
  → OU usar require() em vez de import
```

### Sintoma: `Error: listen EADDRINUSE :::3001`
```
Causa raiz: Porta já em uso por outro processo
Correção:
  → lsof -ti:3001 | xargs kill (macOS/Linux)
  → netstat -ano | findstr :3001 (Windows, depois taskkill /PID [n])
  → OU mudar PORT no .env
```

### Sintoma: `dotenv não carregou as variáveis`
```
Causa raiz: import 'dotenv/config' não está na PRIMEIRA linha
           OU .env não existe na raiz do projeto
Correção:
  // Primeira linha do server.js:
  import 'dotenv/config'; // ESM
  // OU
  require('dotenv').config(); // CommonJS
```

---

## 🔴 Banco de Dados Não Conecta

### Sintoma: `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`
```
Causa raiz: MongoDB não está rodando localmente
Diagnóstico:
  → mongod --version (verifica instalação)
  → brew services list | grep mongodb (macOS)
Correção:
  → brew services start mongodb-community (macOS)
  → sudo systemctl start mongod (Linux)
  → docker run -d -p 27017:27017 mongo (Docker)
  → OU usar MongoDB Atlas (cloud) e atualizar MONGODB_URI
```

### Sintoma: `MongoParseError: Invalid connection string`
```
Causa raiz: MONGODB_URI mal formatada
Correção:
  // Formato correto:
  MONGODB_URI=mongodb://localhost:27017/nome_do_banco         // local
  MONGODB_URI=mongodb+srv://user:senha@cluster.mongodb.net/db // Atlas
  
  // Atenção: senha com caracteres especiais precisa de URL encode
  // @ → %40, # → %23, : → %3A
```

### Sintoma: `PrismaClientInitializationError`
```
Causa raiz: prisma generate não foi executado OU DATABASE_URL incorreta
Correção:
  → npx prisma generate
  → npx prisma migrate dev
  → Verificar DATABASE_URL no .env:
    postgresql://USER:PASSWORD@HOST:5432/DBNAME
```

### Sintoma: `SequelizeConnectionRefusedError`
```
Causa raiz: PostgreSQL/MySQL não rodando
Correção:
  → brew services start postgresql (macOS)
  → sudo systemctl start postgresql (Linux)
  → docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=senha postgres
```

---

## 🔴 Autenticação Quebrada

### Sintoma: `401 Unauthorized` em todas as rotas protegidas
```
Causa raiz (verificar em ordem):
  1. JWT_SECRET ausente ou diferente entre geração e verificação
  2. Middleware authenticate não aplicado nas rotas
  3. Frontend não enviando token no header Authorization
  4. Token expirado (expiresIn muito curto)

Diagnóstico:
  → console.log(process.env.JWT_SECRET) no servidor (undefined = problema)
  → Inspecionar Network no browser → verificar header Authorization na request
  → jwt.io → decodificar token e verificar exp
```

### Sintoma: `JsonWebTokenError: invalid signature`
```
Causa raiz: JWT_SECRET diferente entre quem assinou e quem verifica
           (comum em restart do servidor sem .env configurado)
Correção:
  → Garantir que JWT_SECRET está no .env
  → Garantir que import 'dotenv/config' é a primeira linha
  → Fazer novo login (token antigo foi assinado com secret diferente)
```

### Sintoma: `TokenExpiredError: jwt expired`
```
Causa raiz: Token expirou — normal, mas precisa ser tratado
Correção no frontend:
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

### Sintoma: `403 Forbidden` onde deveria ser `401`
```
Causa raiz: Confusão entre autenticação (401) e autorização (403)
  401 = não está logado (sem token ou token inválido)
  403 = está logado mas não tem permissão (role insuficiente)
Correção:
  → authenticate retorna 401
  → authorize('admin') retorna 403
```

---

## 🟠 CORS Bloqueando Requisições

### Sintoma: `Access to XMLHttpRequest blocked by CORS policy`
```
Causa raiz (verificar em ordem):
  1. cors() não configurado no backend
  2. Origin do frontend não está na whitelist
  3. credentials: true ausente quando usando cookies/auth
  4. cors() configurado DEPOIS das rotas (ordem errada)
  5. Preflight OPTIONS não está sendo tratado

Diagnóstico:
  → Verificar console do browser — qual origin está sendo bloqueada?
  → Verificar se cors() está ANTES das rotas no server.js

Correção:
  // Verificar a origin exata (incluindo porta!)
  // http://localhost:5173 ≠ http://localhost:3000
  ALLOWED_ORIGINS=http://localhost:5173
  
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true
  }));
  // DEVE vir antes de: app.use('/api', routes)
```

---

## 🟠 API Retornando 404

### Sintoma: `Cannot GET /api/[rota]`
```
Causa raiz (verificar em ordem):
  1. Rota não registrada no router principal (routes/index.js)
  2. Prefixo /api ausente na URL do frontend
  3. Servidor está na porta errada
  4. Typo no nome da rota

Diagnóstico:
  → Checar routes/index.js — a rota está importada e registrada?
  → Checar URL no frontend — está usando /api/rota ou só /rota?
  → Checar porta — frontend aponta para porta certa?
```

### Sintoma: `404 Not Found` para resource específico (ex: `/api/users/123`)
```
Causa raiz: ID não existe no banco ou parâmetro não está sendo lido
Diagnóstico:
  → req.params.id está sendo passado corretamente?
  → O registro com esse ID existe no banco?
Correção:
  const item = await Model.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Não encontrado' });
```

---

## 🟠 Frontend Não Comunica com Backend

### Sintoma: `Network Error` ou `ERR_CONNECTION_REFUSED`
```
Causa raiz:
  1. Backend não está rodando
  2. Frontend aponta para porta errada
  3. VITE_API_URL não definido ou incorreto

Diagnóstico:
  → Backend rodando? → curl http://localhost:3001/api/health
  → VITE_API_URL definido no .env do frontend?
  → A porta no .env bate com a porta do backend?

Correção no .env do frontend (Vite):
  VITE_API_URL=http://localhost:3001/api

Correção no service:
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  });
```

### Sintoma: Formulário envia mas nada acontece (sem erro visível)
```
Causa raiz: Erro sendo engolido silenciosamente no frontend
Diagnóstico:
  → Inspecionar Network tab no browser
  → Procurar console.error() sendo suprimido por catch vazio

Correção:
  // ❌ Erro silencioso
  try {
    await api.post('/items', data);
  } catch (err) {} // ← engolindo o erro!

  // ✅ Erro tratado e exibido
  try {
    const res = await api.post('/items', data);
    setSuccess('Item criado com sucesso!');
  } catch (err) {
    setError(err.response?.data?.message || 'Erro ao criar item');
  }
```

---

## 🟡 Problemas de Performance

### Sintoma: Listagem demora muito / trava com muitos dados
```
Causa raiz: Falta de paginação, índices ou N+1 queries
Correção:
  → Implementar paginação (limit + skip)
  → Adicionar índice nos campos de busca
  → Usar populate em vez de buscar em loop
```

### Sintoma: Mesmo dado aparece duplicado após ação
```
Causa raiz: Duplo envio de formulário (botão sem loading state)
Correção:
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (loading) return; // previne duplo clique
    setLoading(true);
    try {
      await api.post('/items', data);
    } finally {
      setLoading(false);
    }
  };
  
  <button onClick={handleSubmit} disabled={loading}>
    {loading ? 'Salvando...' : 'Salvar'}
  </button>
```
