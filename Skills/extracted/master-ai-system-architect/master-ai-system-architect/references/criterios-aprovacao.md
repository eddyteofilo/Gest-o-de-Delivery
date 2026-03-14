# Critérios de Aprovação e Protocolo de Escalação

---

## Critérios Exatos de Score por Nível

### 🟢 APROVADO — Score ≥ 80 + Zero Críticos
```
O sistema pode ser entregue ao usuário.

Condições obrigatórias (ambas devem ser verdadeiras):
  ✓ Score numérico ≥ 80/100
  ✓ Nenhum problema 🔴 CRÍTICO pendente

O que pode estar pendente sem bloquear entrega:
  → Problemas 🟡 ATENÇÃO não resolvidos (viram sugestões)
  → Melhorias 🔵 MELHORIA (viram próximos passos)
  → Testes automatizados ausentes (sugerir mas não bloquear)
```

### 🟡 APROVADO COM RESSALVAS — Score 65–79 + Zero Críticos
```
Sistema funcional mas com qualidade abaixo do ideal.

Ação do Architect:
  → Entregar com lista clara de melhorias pendentes
  → Informar ao usuário o que está faltando
  → Recomendar nova rodada de melhorias em breve

Quando aceitar este nível:
  → Após 3 ciclos sem conseguir atingir 80
  → Quando os problemas restantes são 🟡 ou 🔵
  → Quando o usuário explicitamente aceitar este nível
```

### 🔴 REPROVADO — Score < 65 OU há Críticos
```
Sistema NÃO pode ser entregue.

Ação do Architect:
  → Acionar System Fixer imediatamente
  → Não comunicar ao usuário como "pronto"
  → Reportar progresso mas não o resultado final ainda

Exceção (escalar ao usuário):
  → Após 3 ciclos e ainda reprovado
  → Quando o problema requer decisão humana
```

---

## Cálculo de Score pelo Auditor

```
Score = (Segurança × 0.30) + (Arquitetura × 0.25) +
        (Qualidade × 0.20) + (Performance × 0.15) +
        (Manutenibilidade × 0.10)

Penalizações automáticas:
  Cada problema 🔴 CRÍTICO  → -15 pontos no score final
  Cada problema 🟠 IMPORTANTE → -5 pontos no score final
  Senha exposta na resposta  → score máximo = 40 (teto)
  Sem tratamento de erro     → score máximo = 60 (teto)
```

---

## Regras de Ciclo

### Máximo de 3 Ciclos Fixer → Auditor
```
Ciclo 1: Foco em 🔴 CRÍTICOS
  Meta: eliminar todos os críticos
  Score esperado: +15 a +25 pontos

Ciclo 2: Foco em 🟠 IMPORTANTES
  Meta: resolver os mais impactantes
  Score esperado: +10 a +15 pontos

Ciclo 3: Foco em restantes + qualidade
  Meta: atingir 80+
  Score esperado: +5 a +10 pontos

Após ciclo 3 sem aprovação → ESCALAR
```

### Quando Considerar Rebuild Parcial
```
Acionar System Builder para reconstruir módulo específico quando:
  → Módulo inteiro ❌ ausente no relatório do Auditor
  → Arquitetura do módulo incorreta (não apenas bugs)
  → Score do módulo específico < 30/100
  → Fixer reporta que correção requer reescrever do zero
```

---

## Protocolo de Escalação ao Usuário

### Quando Escalar (obrigatório consultar usuário)

**Caso 1 — Timeout de ciclos:**
```
Mensagem ao usuário:
"Após 3 ciclos de auditoria e correção, o sistema atingiu score [XX]/100.
Problemas restantes: [lista].

Opções:
  A) Aceitar o sistema no estado atual (score [XX])
  B) Indicar qual funcionalidade priorizar para nova rodada
  C) Revisar manualmente os problemas listados

O que prefere?"
```

**Caso 2 — Dependência de dado externo:**
```
Mensagem ao usuário:
"Para prosseguir, preciso de informação que só você pode fornecer:
  □ [ITEM 1]: [descrição — ex: chave de API do Stripe]
  □ [ITEM 2]: [descrição — ex: credenciais do banco de produção]

Por enquanto, configurei com placeholders no .env.example.
Forneça os dados reais para eu completar a integração."
```

**Caso 3 — Decisão arquitetural ambígua:**
```
Mensagem ao usuário:
"Identifiquei duas abordagens possíveis para [funcionalidade]:

  Opção A — [nome]: [descrição]
    Vantagens: [lista] | Desvantagens: [lista]

  Opção B — [nome]: [descrição]
    Vantagens: [lista] | Desvantagens: [lista]

Minha recomendação: Opção [X] porque [motivo].
Você concorda ou prefere a outra abordagem?"
```

**Caso 4 — Funcionalidade inviável:**
```
Mensagem ao usuário:
"A funcionalidade '[X]' não pode ser implementada porque [motivo técnico].

Alternativas que posso implementar:
  A) [alternativa 1] — oferece [benefício similar]
  B) [alternativa 2] — mais simples mas funcional

Qual prefere?"
```

---

## Métricas de Sucesso do Pipeline

O Architect monitora e reporta estas métricas ao final:

```
Eficiência do pipeline:
  Ciclos necessários:        [N] (ideal: 1–2)
  Tempo de convergência:     [rápido | médio | lento]
  Score inicial vs final:    [XX] → [XX] (+[XX] pontos)

Qualidade do output:
  Arquivos gerados:          [N]
  Endpoints funcionais:      [N]
  Componentes criados:       [N]
  Críticos resolvidos:       [N/N] (ideal: 100%)

Aprendizado gerado:
  Registros no Knowledge:    [N]
  Erros novos catalogados:   [N]
  Erros recorrentes:         [N] (sinal de padrão sistêmico)

Saúde do ecossistema:
  Skills utilizadas:         [lista]
  Skills que não foram necessárias: [lista]
  Gargalo identificado:      [qual fase levou mais ciclos]
```
