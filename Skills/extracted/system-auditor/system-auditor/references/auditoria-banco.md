# Auditoria de Banco de Dados — System Auditor

Referência aprofundada para auditoria técnica de bancos de dados.

---

## MongoDB + Mongoose

### Schema — Pontos de Auditoria

```javascript
// ✅ Schema bem construído
const UserSchema = new Schema({
  name:      { type: String, required: true, trim: true, maxlength: 100 },
  email:     { type: String, required: true, unique: true, lowercase: true, index: true },
  password:  { type: String, required: true, select: false },       // select:false = nunca retorna
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  active:    { type: Boolean, default: true, index: true },
  deletedAt: { type: Date, default: null },                          // soft delete
}, {
  timestamps: true,   // createdAt e updatedAt automáticos
  toJSON: { virtuals: true },
});

// Índice composto para buscas frequentes
UserSchema.index({ email: 1, active: 1 });
```

**Verificar:**
```
□ required: true nos campos obrigatórios
□ unique: true + index: true nos campos únicos
□ select: false na senha
□ enum com valores válidos em campos restritos
□ trim: true em campos de texto (evita espaços acidentais)
□ maxlength em campos de texto
□ timestamps: true no schema options
□ Índices nos campos usados em .find(), .findOne()
□ Soft delete implementado (deletedAt) quando necessário
```

### Queries — Problemas Comuns

#### N+1 Query (🔴 CRÍTICO de performance)

```javascript
// ❌ N+1 — 1 query para pedidos + N queries para usuário de cada pedido
const orders = await Order.find({ status: 'pending' });
for (const order of orders) {
  const user = await User.findById(order.userId); // N queries!
  order.userName = user.name;
}

// ✅ Populate — resolve em 2 queries
const orders = await Order.find({ status: 'pending' })
  .populate('userId', 'name email phone') // selecionar só campos necessários
  .lean(); // retorna objeto JS puro (mais rápido)
```

#### Projeção ausente (🟠 IMPORTANTE)

```javascript
// ❌ Retorna TODOS os campos incluindo senha
const users = await User.find({ active: true });

// ✅ Seleciona apenas o necessário
const users = await User.find({ active: true })
  .select('name email role createdAt')
  .lean();
```

#### Sem paginação (🟠 IMPORTANTE)

```javascript
// ❌ Retorna TODOS os documentos — colapsa com volume
const products = await Product.find({});

// ✅ Com paginação
const products = await Product.find({})
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ createdAt: -1 })
  .lean();
```

#### Sem índice em campo de busca (🟡 ATENÇÃO)

```javascript
// ❌ Busca sem índice — full collection scan
await User.find({ email: req.body.email });

// ✅ Adicionar índice no schema
email: { type: String, index: true, unique: true }
```

---

## PostgreSQL + Prisma

### Schema.prisma — Pontos de Auditoria

```prisma
// ✅ Modelo bem construído
model User {
  id        String    @id @default(cuid())
  name      String    @db.VarChar(100)
  email     String    @unique                    // índice único automático
  password  String
  role      Role      @default(USER)
  active    Boolean   @default(true)
  deletedAt DateTime?                            // soft delete
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  orders    Order[]
  @@index([email, active])                       // índice composto
}

enum Role {
  USER
  ADMIN
}
```

**Verificar:**
```
□ @id em todas as tabelas
□ @unique nos campos únicos (email, slug, etc.)
□ @default nos campos com valor padrão
□ @updatedAt no campo updatedAt
□ @@index nos campos de busca frequente
□ Relações definidas nos dois lados (User[], Order)
□ Campos opcionais marcados com ? (nullable)
□ @db.VarChar com limite em campos de texto
```

### Queries Prisma — Problemas Comuns

```javascript
// ❌ Select sem projeção — retorna tudo incluindo senha
const user = await prisma.user.findUnique({ where: { email } });

// ✅ Excluir senha e campos desnecessários
const user = await prisma.user.findUnique({
  where: { email },
  select: { id: true, name: true, email: true, role: true }
});

// ❌ N+1 em loop
const orders = await prisma.order.findMany();
for (const order of orders) {
  const user = await prisma.user.findUnique({ where: { id: order.userId } });
}

// ✅ Include para eager loading
const orders = await prisma.order.findMany({
  include: { user: { select: { name: true, email: true } } }
});

// ✅ Transação para operações interdependentes
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.stock.update({ where: { id: productId }, data: { quantity: { decrement: 1 } } });
  return order;
});
```

---

## Checklist de Segurança do Banco

```
□ Usuário do banco com privilégios MÍNIMOS (não usar root/postgres/admin)
□ Senha do banco via variável de ambiente
□ Conexão SSL ativa em produção
□ Backup automático configurado
□ Dados sensíveis criptografados no banco (CPF, cartão, etc.)
□ Logs de queries suspeitas ativados (slow queries, erros)
□ Firewall: banco só acessível pelo servidor da aplicação
□ Credenciais de banco diferentes por ambiente (dev/staging/prod)
```

---

## Red Flags no Banco — Severidade

🔴 CRÍTICO:
- Connection string hardcoded no código
- Senha em texto puro no banco (sem hash)
- Banco acessível diretamente da internet
- Usuário root sendo usado pela aplicação

🟠 IMPORTANTE:
- Sem índice em campos usados em queries frequentes
- N+1 queries em endpoints de listagem
- Sem paginação — queries retornam todos os registros
- Dados sensíveis retornados em listagens

🟡 ATENÇÃO:
- Sem soft delete onde deveria ter (histórico perdido)
- Timestamps ausentes (sem createdAt/updatedAt)
- Sem validação de tipos no schema
- Campos de texto sem limite de tamanho
