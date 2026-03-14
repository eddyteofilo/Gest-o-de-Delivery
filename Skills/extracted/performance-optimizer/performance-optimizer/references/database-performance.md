# Database Performance — Performance Optimizer

Guia completo de otimização de banco de dados: índices, queries e tuning.

---

## MongoDB — Índices em Profundidade

### Tipos de Índice e Quando Usar

```javascript
// 1. ÍNDICE SIMPLES — para filtros em um campo
UserSchema.index({ email: 1 });      // 1 = ascendente
UserSchema.index({ createdAt: -1 }); // -1 = descendente

// 2. ÍNDICE COMPOSTO — múltiplos campos na mesma query
// REGRA ESR: Equality → Sort → Range (nessa ordem)
OrderSchema.index({ userId: 1, status: 1, createdAt: -1 });
// Cobre: find({ userId, status }).sort({ createdAt: -1 })
// Também cobre: find({ userId }) e find({ userId, status })
// NÃO cobre: find({ status }) — precisa começar pelo primeiro campo

// 3. ÍNDICE ÚNICO
UserSchema.index({ email: 1 }, { unique: true });
ProductSchema.index({ slug: 1 }, { unique: true });

// 4. ÍNDICE ESPARSO — apenas documentos com o campo
UserSchema.index({ googleId: 1 }, { sparse: true }); // para logins sociais opcionais

// 5. ÍNDICE TTL — deletar documentos automaticamente
SessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24h

// 6. ÍNDICE TEXTUAL — busca full-text
ProductSchema.index(
  { name: 'text', description: 'text' },
  { weights: { name: 10, description: 1 } } // nome tem mais relevância
);
// Uso: Product.find({ $text: { $search: 'notebook slim' } })
//             .sort({ score: { $meta: 'textScore' } }) // ordenar por relevância

// 7. ÍNDICE PARCIAL — indexar apenas subset dos documentos
OrderSchema.index(
  { createdAt: -1 },
  { partialFilterExpression: { status: 'active' } } // só pedidos ativos
); // menor tamanho, mais rápido

// 8. ÍNDICE GEOESPACIAL
StoreSchema.index({ location: '2dsphere' });
// Uso: Store.find({ location: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: 5000 } } })
```

### Verificar Uso de Índices

```javascript
// Verificar quais índices existem
await Model.collection.getIndexes();

// Analisar uma query — ver se usa índice
const explain = await Order.find({ userId: id, status: 'pending' })
  .sort({ createdAt: -1 })
  .explain('executionStats');

console.log({
  indexUsed:            explain.queryPlanner.winningPlan.inputStage?.indexName,
  docsExamined:         explain.executionStats.totalDocsExamined,
  docsReturned:         explain.executionStats.nReturned,
  executionTimeMs:      explain.executionStats.executionTimeMillis,
  // PROBLEMA se: docsExamined >> nReturned (muitos docs lidos para poucos retornados)
  // ÓTIMO se: docsExamined === nReturned (índice perfeito)
  indexEfficiency:      `${explain.executionStats.nReturned}/${explain.executionStats.totalDocsExamined}`,
});

// Identificar queries sem índice (collscans)
// Habilitar profiler:
db.setProfilingLevel(1, { slowms: 50 }); // logar queries > 50ms
db.system.profile.find({ planSummary: /COLLSCAN/ }).sort({ ts: -1 });
// COLLSCAN = Collection Scan = sem índice = lento com volume
```

---

## MongoDB — Patterns de Query Eficiente

### Projeção — Retornar Apenas o Necessário

```javascript
// ❌ Retorna documento completo (pode ter campos pesados como arrays grandes)
const user = await User.findById(id);

// ✅ Retornar apenas o necessário
const user = await User.findById(id)
  .select('name email role avatar createdAt')
  .lean(); // .lean() = objeto JS puro, sem métodos Mongoose (30% mais rápido)

// Benchmark típico:
// .findById() sem lean: ~5ms + overhead Mongoose
// .findById().lean(): ~3ms
// .findById().select('name email').lean(): ~1ms (menos dados da rede)
```

### Aggregation Otimizada

```javascript
// Regras de otimização da pipeline:
// 1. $match e $limit O MAIS CEDO POSSÍVEL — reduz documentos processados
// 2. $project para excluir campos desnecessários — reduz memória
// 3. $lookup com pipeline — mais eficiente que múltiplos populates

// ❌ Pipeline ineficiente
db.orders.aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
  { $match: { status: 'completed' } }, // match DEPOIS dos lookups — processa tudo antes de filtrar!
  { $group: { _id: '$user._id', total: { $sum: '$amount' } } },
  { $sort: { total: -1 } },
]);

// ✅ Pipeline otimizada
db.orders.aggregate([
  // 1. Filtrar primeiro — reduz de 100k para 10k documentos antes de qualquer join
  { $match: {
    status: 'completed',
    createdAt: { $gte: new Date('2024-01-01') }
  }},

  // 2. Projetar apenas campos necessários — reduz memória nos estágios seguintes
  { $project: { userId: 1, amount: 1, productId: 1 } },

  // 3. $lookup com pipeline (inclui projeção para buscar apenas o necessário)
  { $lookup: {
    from: 'users',
    let: { userId: '$userId' },
    pipeline: [
      { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
      { $project: { name: 1, email: 1 } }  // apenas name e email
    ],
    as: 'user'
  }},
  { $unwind: '$user' },

  // 4. Agrupar
  { $group: { _id: '$user._id', userName: { $first: '$user.name' }, total: { $sum: '$amount' } } },

  // 5. Sort e limit SEMPRE ao final
  { $sort: { total: -1 } },
  { $limit: 20 },
]);
```

### Bulk Operations — Múltiplas Escritas Eficientes

```javascript
// ❌ 1000 updates individuais = 1000 round-trips ao banco
for (const item of items) {
  await Product.updateOne({ _id: item.id }, { price: item.newPrice });
}
// Tempo: ~2000ms para 1000 items

// ✅ bulkWrite — 1 round-trip para todas as operações
const bulkOps = items.map(item => ({
  updateOne: {
    filter: { _id: item.id },
    update: { $set: { price: item.newPrice, updatedAt: new Date() } },
  }
}));
await Product.bulkWrite(bulkOps, { ordered: false }); // ordered:false = paralelo
// Tempo: ~50ms para 1000 items (40x mais rápido)

// Para inserções em massa:
await Product.insertMany(newProducts, { ordered: false });
```

---

## PostgreSQL — Otimizações com Prisma

### Índices no Prisma

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique          // índice único automático
  role      String   @default("user")
  active    Boolean  @default(true)
  createdAt DateTime @default(now())

  // Índice composto
  @@index([role, active, createdAt(sort: Desc)])
  @@index([email, active])
}

model Order {
  id        String   @id
  userId    String
  status    String
  createdAt DateTime @default(now())

  // Índice parcial (somente orders ativas — menor tamanho)
  @@index([userId, status, createdAt(sort: Desc)])
}
```

### Queries Prisma Eficientes

```javascript
// ❌ N+1 — busca orders depois busca user de cada
const orders = await prisma.order.findMany();
for (const order of orders) {
  const user = await prisma.user.findUnique({ where: { id: order.userId } }); // N queries!
}

// ✅ Include — 2 queries total (JOIN otimizado pelo Prisma)
const orders = await prisma.order.findMany({
  include: {
    user: { select: { name: true, email: true } }  // projeção dentro do include
  },
  where: { status: 'pending' },
  orderBy: { createdAt: 'desc' },
  take: 20,  // limit
  skip: (page - 1) * 20, // offset
});

// ✅ Select para projeção
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true, role: true }, // sem password, tokens, etc.
  where: { active: true },
  orderBy: { name: 'asc' },
});

// ✅ Raw query para casos complexos
const result = await prisma.$queryRaw`
  SELECT u.id, u.name, COUNT(o.id) as order_count, SUM(o.amount) as total
  FROM "User" u
  LEFT JOIN "Order" o ON u.id = o."userId" AND o.status = 'completed'
  WHERE u.active = true
  GROUP BY u.id, u.name
  HAVING SUM(o.amount) > 1000
  ORDER BY total DESC
  LIMIT 10
`;
```

---

## Redis — Estratégias de Cache Avançadas

### Patterns de Cache

```javascript
// PATTERN 1: Cache-Aside (mais comum)
const getProduct = async (id) => {
  const key = `product:${id}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const product = await Product.findById(id).lean();
  await redis.setEx(key, 3600, JSON.stringify(product)); // 1h TTL
  return product;
};

// PATTERN 2: Write-Through (escreve no cache junto com o banco)
const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, data, { new: true }).lean();
  await redis.setEx(`product:${id}`, 3600, JSON.stringify(product)); // atualiza cache
  return product;
};

// PATTERN 3: Invalidação em cascata
const invalidateUserCache = async (userId) => {
  const keys = await redis.keys(`user:${userId}:*`); // todas as chaves do usuário
  if (keys.length > 0) await redis.del(keys);
};

// PATTERN 4: Distributed Lock — evitar race condition em cache
const getWithLock = async (key, fetchFn, ttl = 300) => {
  const lockKey = `lock:${key}`;
  const lock = await redis.set(lockKey, '1', { NX: true, EX: 5 }); // lock por 5s
  if (!lock) {
    // outro processo está atualizando — aguardar e tentar o cache
    await new Promise(r => setTimeout(r, 100));
    return redis.get(key).then(v => v ? JSON.parse(v) : getWithLock(key, fetchFn, ttl));
  }

  try {
    const data = await fetchFn();
    await redis.setEx(key, ttl, JSON.stringify(data));
    return data;
  } finally {
    await redis.del(lockKey);
  }
};
```

### Redis para Filas e Rate Limiting

```javascript
// Rate limiting preciso com Redis (sliding window)
const isRateLimited = async (userId, action, limit = 10, window = 60) => {
  const key = `ratelimit:${userId}:${action}`;
  const now = Date.now();
  const windowStart = now - window * 1000;

  const pipeline = redis.multi();
  pipeline.zremrangebyscore(key, '-inf', windowStart); // remover antigas
  pipeline.zadd(key, { score: now, value: `${now}` });  // adicionar atual
  pipeline.zcard(key);                                  // contar no window
  pipeline.expire(key, window);                         // TTL

  const results = await pipeline.exec();
  const count = results[2];
  return count > limit;
};

// Uso:
if (await isRateLimited(req.user.id, 'api-call', 100, 60)) {
  return res.status(429).json({ message: 'Rate limit excedido' });
}
```

---

## Monitoramento de Performance de Queries

```javascript
// Mongoose — logar queries lentas automaticamente
mongoose.set('debug', (collectionName, method, query, doc, options) => {
  const start = Date.now();
  return () => {
    const elapsed = Date.now() - start;
    if (elapsed > 100) { // logar apenas queries > 100ms
      console.warn(`[SLOW QUERY] ${collectionName}.${method} ${elapsed}ms`, {
        query: JSON.stringify(query),
        options,
      });
    }
  };
});

// Plugin global para mongoose — adicionar em todos os schemas
const performancePlugin = (schema) => {
  schema.pre('find', function() { this._start = Date.now(); });
  schema.post('find', function(docs) {
    const elapsed = Date.now() - this._start;
    if (elapsed > 100) {
      console.warn(`[SLOW QUERY] ${this.model.modelName}.find ${elapsed}ms`);
    }
  });
};
mongoose.plugin(performancePlugin);
```
