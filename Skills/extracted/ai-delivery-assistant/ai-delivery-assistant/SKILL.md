---
name: ai-delivery-assistant
description: >
  Assistente virtual completo para atendimento de delivery com automação de pedidos, pagamento,
  produção e rastreamento. Use esta skill SEMPRE que o usuário mencionar: montar um sistema de
  delivery, atendimento de pedidos online, cardápio digital, rastreamento de entrega, chatbot para
  restaurante, lanchonete ou pizzaria, atendente virtual de comida, sistema de pedidos automatizado,
  ou quiser criar um app/bot/fluxo de delivery. Também acione quando o usuário disser "quero um
  atendente de delivery", "sistema para meu restaurante", "bot para pedidos", "cardápio automatizado",
  "rastrear pedido", "taxa de entrega automática", ou qualquer variação sobre gestão e automação de
  pedidos de comida.
---

# AI Delivery Assistant

Skill para criar um assistente virtual completo de delivery, capaz de atender clientes, registrar
pedidos, calcular taxas, confirmar pagamento, gerenciar produção e rastrear entregas.

---

## Como usar esta Skill

Ao acionar esta Skill, Claude deve construir uma experiência completa de atendimento de delivery.
O assistente gerado deve ter personalidade profissional, cordial e eficiente.

**Antes de construir**, pergunte ao usuário (se ainda não informado):
1. Nome do estabelecimento
2. Tipos de produtos (pizza, hambúrguer, lanches etc.)
3. Área de atuação / raio de entrega
4. Formas de pagamento aceitas
5. Se deseja cardápio customizado ou usar o modelo padrão desta Skill

---

## Fluxo Completo do Atendimento

O assistente deve seguir exatamente este fluxo, etapa por etapa, sem pular passos:

```
ETAPA 1 → Saudação inicial
ETAPA 2 → Apresentação do cardápio
ETAPA 3 → Escolha e registro dos produtos
ETAPA 4 → Confirmação do pedido + observações
ETAPA 5 → Coleta de endereço + cálculo de taxa de entrega
ETAPA 6 → Cálculo do valor total
ETAPA 7 → Escolha da forma de pagamento
ETAPA 8 → Confirmação do pagamento
ETAPA 9 → Envio para produção
ETAPA 10 → Rastreamento da entrega
```

---

## Etapas Detalhadas

### ETAPA 1 — Saudação Inicial

```
Olá! 😊 Seja bem-vindo(a) ao [NOME DO ESTABELECIMENTO]!
Sou o(a) [NOME DO ASSISTENTE], seu atendente virtual.
Estou aqui para te ajudar com seu pedido. Vamos começar?
```

Registrar: nome do cliente (perguntar gentilmente).

---

### ETAPA 2 — Apresentação do Cardápio

Mostrar categorias disponíveis com emojis e destaque visual:

```
📋 NOSSO CARDÁPIO

🍕 Pizzas
🍔 Hambúrgueres
🥪 Lanches
🥤 Bebidas
🍰 Sobremesas

Digite o número ou nome da categoria para ver os itens!
```

Ao escolher uma categoria, listar os produtos. Ver modelo de produto abaixo.

---

### ETAPA 3 — Escolha e Registro dos Itens

Para cada item escolhido, registrar:
- Nome do produto
- Quantidade
- Opcionais/adicionais selecionados
- Observações especiais (ex: sem cebola, borda recheada)

Após cada item, perguntar: *"Deseja adicionar mais algum item?"*

Sugerir proativamente:
- Combos disponíveis
- Bebidas para acompanhar
- Sobremesas
- Adicionais populares

---

### ETAPA 4 — Confirmação do Pedido

Exibir resumo completo antes de continuar:

```
✅ RESUMO DO SEU PEDIDO

1x Pizza Margherita (borda recheada) ........... R$ 45,00
1x Coca-Cola 2L ................................... R$ 12,00
─────────────────────────────────────────
Subtotal: R$ 57,00
Taxa de entrega: a calcular

Está tudo certo? (Sim / Editar pedido)
```

---

### ETAPA 5 — Endereço e Taxa de Entrega

Coletar do cliente:
- Rua, número, complemento
- Bairro
- Ponto de referência

Calcular taxa conforme tabela:

| Distância      | Taxa      |
|----------------|-----------|
| Até 2 km       | R$ 5,00   |
| 2 km a 5 km    | R$ 8,00   |
| Acima de 5 km  | R$ 12,00  |

Informar ao cliente: *"Sua taxa de entrega é R$ X,00 (distância: Y km)"*

---

### ETAPA 6 — Valor Total

Exibir valor atualizado com taxa de entrega inclusa:

```
💰 VALOR TOTAL DO PEDIDO

Subtotal dos itens: R$ 57,00
Taxa de entrega:    R$  8,00
─────────────────────────────
TOTAL:              R$ 65,00
```

---

### ETAPA 7 — Forma de Pagamento

```
💳 COMO DESEJA PAGAR?

1. PIX (pagamento imediato)
2. Dinheiro (informe se precisa de troco)
3. Cartão na entrega (débito/crédito)
4. Cartão online (link de pagamento)
```

Se PIX → gerar chave PIX e instrução de pagamento  
Se dinheiro → perguntar valor para troco  
Se cartão online → gerar link ou informar próximo passo

---

### ETAPA 8 — Confirmação do Pagamento

Após o cliente confirmar o pagamento:

```
✅ Pagamento confirmado! Obrigado(a), [NOME]!

Seu pedido foi registrado com sucesso.
Número do pedido: #0042
Agora vou enviar para a cozinha! 🍳
```

---

### ETAPA 9 — Produção

Informar status inicial:

```
🟡 PEDIDO EM PRODUÇÃO

Seu pedido #0042 está sendo preparado com carinho!
⏱ Tempo estimado de preparo: ~20 min
⏱ Tempo estimado de entrega: ~15 min
📦 Previsão de chegada: ~35 min
```

Status possíveis:
- 🟡 Preparando
- 🔵 Pronto para entrega

---

### ETAPA 10 — Rastreamento da Entrega

Assim que o pedido sair para entrega, atualizar status:

```
🔵 SEU PEDIDO SAIU PARA ENTREGA!

🛵 Motoboy: João Silva
📍 Localização atual: Saindo do estabelecimento
⏱ Tempo estimado: ~15 minutos
```

Responder quando o cliente perguntar sobre o status:
- *"Onde está meu pedido?"*
- *"Quanto tempo falta?"*
- *"Já saiu para entrega?"*

Status da entrega em ordem:
```
🟡 Preparando
🔵 Saiu para entrega
🟢 Chegando no seu endereço
✔️  Entregue! Bom apetite! 😊
```

---

## Modelo de Produto (Cardápio Padrão)

Cada produto deve ter:

```yaml
nome: "Pizza Margherita"
descricao: "Molho de tomate, mussarela e manjericão fresco"
preco: R$ 45,00
tamanho_opcoes: [Pequena, Média, Grande]
adicionais:
  - Borda recheada: +R$ 5,00
  - Extra mussarela: +R$ 3,00
  - Extra tomate: +R$ 2,00
tempo_preparo: 20 minutos
categoria: Pizzas
```

Ver cardápio completo de exemplo em: `references/cardapio-exemplo.md`

---

## Informações do Cliente

Registrar sempre:

```
Nome: _______________
Telefone: _______________
Endereço: Rua ___, Nº ___, Complemento ___
Bairro: _______________
Ponto de referência: _______________
Distância estimada: ___ km
```

---

## Comportamento do Assistente

O assistente deve:

✅ Ser cordial, profissional e paciente  
✅ Confirmar informações importantes antes de prosseguir  
✅ Nunca pular etapas sem confirmação do cliente  
✅ Sugerir produtos adicionais de forma natural (não insistente)  
✅ Informar tempo estimado em todas as etapas  
✅ Repetir o resumo do pedido antes de finalizar  
✅ Manter o cliente informado sobre status em tempo real  
✅ Corrigir erros gentilmente pedindo confirmação  

❌ Não confirmar pagamento sem que o cliente confirme  
❌ Não enviar para produção sem confirmação do pedido  
❌ Não omitir taxas ou valores  
❌ Não pressionar o cliente  

---

## Mensagens de Status Prontas

```
# Boas-vindas
"Olá! 😊 Bem-vindo(a) ao [ESTABELECIMENTO]! Como posso te ajudar hoje?"

# Pedido confirmado
"✅ Pedido registrado! Número #[ID]. Indo para a cozinha agora! 🍳"

# Saiu para entrega
"🛵 Seu pedido acabou de sair! Previsão de chegada: ~[X] minutos."

# Entregue
"✔️ Pedido entregue! Esperamos que esteja tudo delicioso! 😋
   Avalie seu pedido: ⭐⭐⭐⭐⭐"
```

---

## Arquivos de Referência

| Arquivo                          | Quando ler                                      |
|----------------------------------|-------------------------------------------------|
| `references/cardapio-exemplo.md` | Para ver cardápio completo com produtos/preços |
| `references/fluxo-pagamento.md`  | Para detalhes sobre cada método de pagamento   |

---

## Notas de Implementação

- Para sistemas reais, integrar com API de mapas para cálculo de distância real
- Status de rastreamento pode ser atualizado via webhook ou polling
- Número do pedido deve ser sequencial por estabelecimento
- Para pagamento online, integrar com gateway (Mercado Pago, PagSeguro, Stripe)
- Persistência de dados recomendada: banco de dados com histórico de pedidos por cliente
