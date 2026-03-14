# Fluxo de Pagamento — AI Delivery Assistant

Guia detalhado para cada método de pagamento aceito pelo sistema.

---

## 💠 PIX

**Quando usar:** Pagamento imediato antes da produção.

**Fluxo:**
1. Exibir chave PIX do estabelecimento
2. Exibir QR Code (se disponível via integração)
3. Informar valor exato a pagar
4. Aguardar confirmação (manual ou via webhook)
5. Confirmar recebimento e iniciar produção

**Mensagem padrão:**
```
💠 PAGAMENTO VIA PIX

Chave PIX: [chave do estabelecimento]
Valor: R$ [TOTAL]

Após o pagamento, envie o comprovante aqui
ou aguarde a confirmação automática.
⏱ Confirmação em até 2 minutos.
```

**Observações:**
- Ideal para pagamento rápido
- Confirmação automática se integrado com API do banco
- Não iniciar produção sem confirmação do PIX

---

## 💵 DINHEIRO

**Quando usar:** Pagamento no ato da entrega.

**Fluxo:**
1. Perguntar se precisa de troco
2. Se sim, perguntar valor da nota
3. Calcular troco e informar ao cliente
4. Registrar no pedido
5. Iniciar produção imediatamente

**Mensagem padrão:**
```
💵 PAGAMENTO EM DINHEIRO

Valor do pedido: R$ [TOTAL]
Precisa de troco? (Sim/Não)

[Se sim:]
Para qual valor? R$ ___
Troco: R$ [VALOR DO TROCO]
```

**Observações:**
- Produção inicia imediatamente
- Entregador deve levar o troco correto
- Máximo de troco recomendado: R$50

---

## 💳 CARTÃO NA ENTREGA

**Quando usar:** Débito ou crédito na chegada.

**Fluxo:**
1. Confirmar se é débito ou crédito
2. Registrar no pedido
3. Informar que a maquininha será levada pelo entregador
4. Iniciar produção

**Mensagem padrão:**
```
💳 PAGAMENTO COM CARTÃO NA ENTREGA

Débito ou Crédito?

✅ Nossa maquininha aceita todas as bandeiras:
Visa, Mastercard, Elo, Hipercard, American Express.

O entregador levará a maquininha. 
Valor a pagar: R$ [TOTAL]
```

**Observações:**
- Verificar se o estabelecimento possui maquininha portátil
- Não aceitar cheque
- Parcelamento apenas no crédito (a definir pelo estabelecimento)

---

## 🌐 PAGAMENTO ONLINE

**Quando usar:** Link de pagamento enviado por WhatsApp/chat.

**Fluxo:**
1. Gerar link de pagamento via gateway integrado
2. Enviar link ao cliente
3. Aguardar confirmação de pagamento
4. Confirmar e iniciar produção

**Mensagem padrão:**
```
🌐 PAGAMENTO ONLINE

Clique no link abaixo para pagar com segurança:
🔗 [LINK DE PAGAMENTO]

Valor: R$ [TOTAL]
Aceitamos: Cartão, PIX, boleto

⏱ Link válido por 30 minutos.
Após o pagamento, seu pedido vai direto para produção!
```

**Gateways compatíveis:**
- Mercado Pago
- PagSeguro
- Stripe
- PayPal
- Gerencianet/EFÍ

---

## ✅ Confirmação Universal de Pagamento

Independentemente do método, após confirmação:

```
✅ PAGAMENTO CONFIRMADO!

Obrigado(a), [NOME]! 🎉
Pedido #[ID] confirmado e indo para a cozinha agora!

📦 Resumo:
[ITENS DO PEDIDO]

⏱ Previsão de entrega: ~[X] minutos
📍 Entrega em: [ENDEREÇO]

Te avisamos quando sair para entrega! 🛵
```

---

## ❌ Pagamento Não Confirmado

Se o pagamento não for confirmado em tempo hábil:

```
⚠️ Ainda não identificamos seu pagamento.

Precisa de ajuda? Aqui estão suas opções:
1. Tentar novamente o PIX/link
2. Trocar para outro método de pagamento
3. Falar com um atendente humano

Seu pedido está reservado por mais 10 minutos. ⏱
```
