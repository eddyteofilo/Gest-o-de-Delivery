# Biblioteca de Payloads — AI Bug Hunter

Payloads prontos para injetar em cada tipo de campo durante os testes.

---

## 📦 Payloads Gerais (testar em qualquer campo de texto)

```javascript
const PAYLOADS_GERAIS = [
  // Vazios e nulos
  "",
  " ",
  "   ",
  null,
  undefined,

  // Gigantes
  "A".repeat(1000),
  "A".repeat(10000),
  "A".repeat(100000),

  // Caracteres especiais
  "!@#$%^&*()_+-=[]{}|;':\",./<>?",
  "`~\\",
  "\t\n\r",            // tabs e quebras de linha
  "\x00",              // null byte
  "\xFF\xFE",          // BOM UTF-16

  // Unicode
  "😀💀🔥👾🎭",
  "مرحبا بالعالم",       // árabe (RTL)
  "こんにちは世界",         // japonês
  "Ñoño ü ö ä",        // latin extended
  "\u200B\u200C\u200D", // zero-width characters

  // Injeção HTML/XSS
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<svg onload=alert(1)>",
  "javascript:alert(1)",
  "'-alert(1)-'",
  "\"><script>alert(1)</script>",

  // Injeção SQL
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1; SELECT * FROM users",
  "\" OR \"\"=\"",
  "UNION SELECT * FROM users--",

  // Path traversal
  "../../../etc/passwd",
  "..\\..\\..\\windows\\system32",
  "%2e%2e%2f%2e%2e%2f",   // URL encoded
  "....//....//etc/passwd",

  // Números disfarçados
  "0",
  "-1",
  "999999999999999",
  "1.7976931348623157e+308",  // MAX_VALUE
  "Infinity",
  "-Infinity",
  "NaN",
];
```

---

## 📧 Payloads para Campo de Email

```javascript
const PAYLOADS_EMAIL = [
  // Inválidos óbvios
  "nao-e-email",
  "@semdominio.com",
  "sem-arroba.com",
  "duplo@@arroba.com",
  "espaco no meio@email.com",
  ".comeca-com-ponto@email.com",
  "termina-com-ponto.@email.com",

  // Injeção
  "test+<script>alert(1)</script>@email.com",
  "test@email.com\r\nBcc: victim@email.com",  // email header injection

  // Muito longos
  "a".repeat(300) + "@email.com",
  "test@" + "a".repeat(300) + ".com",

  // Edge cases válidos (devem ser aceitos)
  "test+tag@email.com",           // + é válido
  "user.name@subdomain.email.com", // múltiplos pontos
];
```

---

## 🔢 Payloads para Campos Numéricos

```javascript
const PAYLOADS_NUMERICOS = [
  // Inválidos
  "abc",
  "1.2.3",
  "1,000",       // vírgula como separador
  "1 000",       // espaço como separador
  "--1",
  "++1",
  "1e999",       // overflow

  // Limites
  0,
  -1,
  -999999999,
  Number.MAX_SAFE_INTEGER,     // 9007199254740991
  Number.MAX_SAFE_INTEGER + 1, // perde precisão
  Number.MAX_VALUE,
  Infinity,
  -Infinity,
  NaN,

  // Strings numéricas ambíguas
  "01",          // octal em alguns parsers
  "0x10",        // hexadecimal
  "0b1010",      // binário
  " 1",          // espaço antes
  "1 ",          // espaço depois
];
```

---

## 🗓️ Payloads para Campos de Data

```javascript
const PAYLOADS_DATA = [
  // Inválidos
  "32/01/2024",          // dia inválido
  "01/13/2024",          // mês inválido
  "29/02/2023",          // não bissexto
  "00/00/0000",
  "ontem",
  "amanhã",
  "hoje",

  // Limites temporais
  "1899-12-31",          // antes da era digital
  "9999-12-31",          // futuro distante
  "0000-01-01",
  "2024-01-01T25:00:00", // hora inválida

  // Fusos horários problemáticos
  "2024-01-01T00:00:00Z",         // UTC explícito
  "2024-01-01T00:00:00-03:00",    // UTC-3
  "2024-01-01T00:00:00+14:00",    // fuso máximo

  // Formatos errados para o sistema
  "01-01-2024",          // DD-MM-YYYY
  "2024/01/01",          // barras em vez de hífens
  "Jan 1, 2024",
  "1704067200",          // timestamp Unix
];
```

---

## 🔑 Payloads para IDs (MongoDB ObjectId / UUID)

```javascript
const PAYLOADS_ID = [
  // Inválidos
  "0",
  "-1",
  "abc",
  "null",
  "undefined",
  "",
  " ",

  // ObjectId inválidos
  "000000000000000000000000",  // todos zeros
  "zzzzzzzzzzzzzzzzzzzzzzzz",  // caracteres inválidos
  "1".repeat(24),              // tamanho correto, mas inválido

  // UUID inválidos
  "00000000-0000-0000-0000-000000000000",  // todos zeros (válido formato, mas suspeito)
  "not-a-uuid-at-all",

  // Injeção
  "507f1f77bcf86cd799439011; DROP TABLE users",
  "<script>alert(1)</script>",
  "../../admin",
  "%00",                       // null byte URL encoded

  // IDs de outros recursos (IDOR test)
  // Usar ID real de outro usuário para testar autorização
];
```

---

## 🔐 Payloads para Autenticação

```javascript
// Tokens JWT malformados
const PAYLOADS_JWT = [
  "",                                          // vazio
  "notajwt",                                   // sem pontos
  "a.b",                                       // apenas 2 partes
  "a.b.c.d",                                   // 4 partes
  "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.",  // alg: none
  "Bearer",                                    // sem token
  "Bearer ",                                   // espaço após Bearer
  "bearer token123",                           // lowercase bearer
  "Token token123",                            // formato errado
  "Basic dXNlcjpwYXNz",                        // Basic auth no campo Bearer
];

// Senhas
const PAYLOADS_SENHA = [
  "",                     // vazia
  " ",                    // apenas espaço
  "a",                    // muito curta
  "a".repeat(1000),       // muito longa
  "12345678",             // muito comum
  "password",             // muito comum
  "' OR '1'='1",          // SQL injection
  "<script>",             // XSS
  null,
  undefined,
];

// NoSQL Injection no login
const PAYLOADS_NOSQL_LOGIN = [
  { "$gt": "" },                    // maior que vazio = tudo
  { "$ne": null },                  // diferente de null = tudo
  { "$regex": ".*" },               // match tudo
  { "$where": "return true" },      // sempre verdadeiro
  { "$exists": true },              // campo existe = qualquer valor
];
```

---

## 💉 Payloads de Injeção NoSQL

```javascript
// Para campos de busca e filtros
const PAYLOADS_NOSQL = [
  // Operator injection
  { "$gt": "" },
  { "$ne": "x" },
  { "$regex": ".*", "$options": "i" },
  { "$where": "sleep(5000)" },       // DoS via sleep
  { "$where": "return true" },
  { "$exists": true },
  { "$in": ["admin", "user", ""] },

  // Array injection
  ["admin", "user"],                 // quando espera string
  [null, undefined, ""],

  // Deep nesting (DoS)
  JSON.parse('{"a":{"b":{"c":{"d":{"e":{"f":{}}}}}}}'),
];
```

---

## 🌐 Payloads para URLs e Redirecionamentos

```javascript
const PAYLOADS_URL = [
  // Open redirect
  "https://evil.com",
  "//evil.com",
  "///evil.com",
  "http:evil.com",
  "\r\nevil.com",
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",

  // SSRF (Server-Side Request Forgery)
  "http://localhost:3001/api/admin",
  "http://127.0.0.1/api/admin",
  "http://0.0.0.0/api/admin",
  "http://169.254.169.254/latest/meta-data/",  // AWS metadata
  "file:///etc/passwd",
  "gopher://localhost:6379/_PING",             // Redis via SSRF

  // Path traversal em parâmetro de arquivo
  "../../../etc/passwd",
  "....//....//etc/passwd",
  "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
];
```

---

## 📤 Payloads para Upload de Arquivo

```javascript
const PAYLOADS_UPLOAD = {
  // Tipos perigosos mascarados
  arquivos: [
    "malware.exe",           // executável
    "shell.php",             // PHP shell
    "script.js",             // JavaScript
    "hack.html",             // HTML com XSS
    "payload.svg",           // SVG com JS embutido: <svg><script>alert(1)</script></svg>
    "image.jpg.php",         // double extension
    "image.php%00.jpg",      // null byte bypass
  ],

  // Tamanhos extremos
  tamanhos: [
    0,                       // arquivo vazio
    1,                       // 1 byte
    5 * 1024 * 1024,         // 5MB (limite comum)
    5 * 1024 * 1024 + 1,     // 1 byte além do limite
    100 * 1024 * 1024,       // 100MB
  ],

  // Content-Type falso
  contentTypes: [
    "image/jpeg",            // declarar JPEG mas enviar PHP
    "image/png",             // declarar PNG mas enviar SVG malicioso
    "application/octet-stream",
  ],
};
```

---

## 🧪 Cenários de Race Condition

```javascript
// Simular com Promise.all (múltiplas requisições simultâneas)
const raceConditionTests = [
  {
    nome: "Duplo clique em submit",
    simular: async (api, data) => {
      const [r1, r2] = await Promise.all([
        api.post('/items', data),
        api.post('/items', data),
      ]);
      return { r1, r2 };
    },
    esperado: "Apenas 1 criado (409 ou idempotência)",
    bugSe: "2 registros idênticos criados",
  },
  {
    nome: "Compra simultânea do último item",
    simular: async (api, productId) => {
      const [r1, r2] = await Promise.all([
        api.post('/orders', { productId, quantity: 1 }),
        api.post('/orders', { productId, quantity: 1 }),
      ]);
      return { r1, r2 };
    },
    esperado: "1 sucesso + 1 erro de estoque insuficiente",
    bugSe: "Ambas retornam sucesso (overselling)",
  },
];
```
