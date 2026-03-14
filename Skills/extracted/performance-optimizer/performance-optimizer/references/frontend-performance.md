# Frontend Performance — Performance Optimizer

Guia completo de otimizações de frontend, bundle e Core Web Vitals.

---

## Core Web Vitals — Diagnóstico e Correção

### LCP — Largest Contentful Paint (> 2.5s = problema)

Causas comuns e correções:

```
CAUSA 1: Imagem hero/banner sem preload
Correção:
  <link rel="preload" as="image" href="/hero.webp" />
  <!-- No head ANTES do bundle JS -->

CAUSA 2: Fonte bloqueando renderização
Correção:
  <link rel="preload" as="font" href="/fonts/inter.woff2" type="font/woff2" crossorigin />
  @font-face {
    font-family: 'Inter';
    font-display: swap; /* ← mostra fallback enquanto fonte carrega */
  }

CAUSA 3: JavaScript bloqueando renderização
Correção:
  <!-- ❌ Bloqueia parsing do HTML -->
  <script src="bundle.js"></script>

  <!-- ✅ Não bloqueia -->
  <script src="bundle.js" defer></script>   <!-- executa após parsing -->
  <script src="analytics.js" async></script> <!-- executa assim que baixar -->

CAUSA 4: Servidor sem compressão
Correção (nginx):
  gzip on;
  gzip_types text/html text/css application/javascript application/json;
  gzip_comp_level 6;
  brotli on; /* melhor que gzip, suportado em navegadores modernos */
```

### CLS — Cumulative Layout Shift (> 0.1 = problema)

```
CAUSA 1: Imagens sem dimensões definidas
Correção:
  /* ❌ Causa layout shift quando imagem carrega */
  <img src="product.jpg" />

  /* ✅ Reserva espaço antes de carregar */
  <img src="product.jpg" width="400" height="300" />

  /* ✅ Via CSS — aspect ratio */
  img { aspect-ratio: 4 / 3; width: 100%; }

CAUSA 2: Ads ou embeds injetados dinamicamente
Correção:
  /* Reservar espaço para o ad */
  .ad-container { min-height: 250px; }

CAUSA 3: Fonte customizada causando reflow (FOUT)
Correção:
  font-display: optional; /* não usa fonte se demorar — evita shift */
  /* OU */
  font-display: swap; /* usa fallback e troca — causa pequeno shift mas melhor UX */
```

### FID/INP — First Input Delay / Interaction to Next Paint

```
CAUSA: JavaScript longo bloqueando main thread
Diagnóstico: Task > 50ms = "Long Task" no Chrome DevTools > Performance

Correção 1: Quebrar tasks longas
  /* ❌ Task única de 500ms */
  function processAll(items) {
    items.forEach(item => heavyProcess(item)); // 500ms bloqueado
  }

  /* ✅ Yield para o browser entre chunks */
  async function processAll(items) {
    for (let i = 0; i < items.length; i++) {
      heavyProcess(items[i]);
      if (i % 100 === 0) {
        await new Promise(r => setTimeout(r, 0)); // yield
      }
    }
  }

Correção 2: Web Workers para processamento pesado
  /* Worker (worker.js) */
  self.onmessage = ({ data }) => {
    const result = heavyComputation(data);
    self.postMessage(result);
  };

  /* Main thread */
  const worker = new Worker('./worker.js');
  worker.postMessage(largeDataset);
  worker.onmessage = ({ data }) => setResult(data);
  /* Main thread nunca trava — UI continua responsiva */
```

---

## Otimização de Bundle

### Análise de Dependências Pesadas

```
Dependências que custam mais de 50kb (minificado+gzip):
  moment.js:     ~72kb → substituir por date-fns (~10kb) ou dayjs (~3kb)
  lodash:        ~72kb → usar imports específicos ou ES nativo
  axios:         ~15kb → ok, mas fetch nativo é zero custo
  react-icons:   ~500kb → importar apenas ícones usados
  chart.js:      ~60kb → considerar recharts (mais tree-shakeable)
  antd:          ~500kb → importar componentes individualmente

VERIFICAR NO package.json:
  npx bundlephobia [pacote]  → ver tamanho de qualquer dependência
  npx depcheck               → dependências não usadas
```

### Tree Shaking Correto

```javascript
// ❌ Importa TODA a biblioteca (não tree-shakeable)
import _ from 'lodash';
const result = _.chunk(array, 3);

// ✅ Importa apenas o necessário
import chunk from 'lodash/chunk';
const result = chunk(array, 3);

// ❌ Importa todos os ícones
import { FaUser, FaHome, FaCog } from 'react-icons/fa';

// ✅ Já é tree-shakeable com react-icons, mas certificar:
// vite.config.js:
export default {
  build: {
    rollupOptions: {
      treeshake: true,
    }
  }
}
```

### Vite — Configuração de Build Otimizada

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Dividir bundle em chunks menores
    rollupOptions: {
      output: {
        manualChunks: {
          // Dependências que não mudam frequentemente → cache longo no browser
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    // Comprimir chunks
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,    // remover console.log em prod
        drop_debugger: true,
      },
    },
    // Alertar se chunk > 500kb
    chunkSizeWarningLimit: 500,
  },
  // Servir assets com hash para cache busting
  // output: nome-do-arquivo.abc123.js → browser cacheia para sempre
});
```

---

## React — Otimizações Avançadas

### useDeferredValue — Priorizar interações sobre atualizações pesadas

```javascript
import { useDeferredValue, useMemo } from 'react';

function SearchResults({ query }) {
  // deferredQuery atualiza com menos prioridade que query
  // Usuário vê UI responsiva enquanto lista filtra em background
  const deferredQuery = useDeferredValue(query);

  const filteredItems = useMemo(() =>
    items.filter(item => item.name.includes(deferredQuery)),
    [deferredQuery]
  );

  return (
    <ul style={{ opacity: deferredQuery !== query ? 0.5 : 1 }}>
      {filteredItems.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}
```

### useTransition — Marcar updates lentos como não urgentes

```javascript
import { useTransition } from 'react';

function FilterableList() {
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (e) => {
    // Input atualiza imediatamente (urgente)
    const value = e.target.value;

    // Filtrar lista é marcado como não urgente
    startTransition(() => {
      setFilter(value);
    });
  };

  return (
    <>
      <input onChange={handleFilterChange} />
      {isPending && <span>Filtrando...</span>}
      <HeavyFilteredList filter={filter} />
    </>
  );
}
```

### React Query — Cache de dados servidor-side

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Hook com cache automático, retry e stale-while-revalidate
function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],  // cache por key
    queryFn: () => productService.getAll(params),
    staleTime: 5 * 60 * 1000,    // 5 min antes de revalidar
    cacheTime: 30 * 60 * 1000,   // 30 min em cache antes de limpar
    refetchOnWindowFocus: false,  // não revalidar ao focar a janela
  });
}

// Mutation com invalidação de cache
function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] }); // refetch lista
    },
  });
}
// Ganho: elimina requisições duplicadas, loading instantâneo em navegação
```

---

## Métricas para Monitorar em Produção

```javascript
// Web Vitals em produção
import { onCLS, onFID, onLCP, onTTFB, onINP } from 'web-vitals';

const sendToAnalytics = (metric) => {
  fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
      url: window.location.href,
      timestamp: Date.now(),
    }),
  });
};

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);
onINP(sendToAnalytics);
```
