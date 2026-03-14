# Checklist de Entrega — System Orchestrator

Use este checklist antes de entregar qualquer sistema ao usuário.

---

## ✅ Checklist de Código

### Backend
- [ ] Servidor inicia sem erros (`npm run dev`)
- [ ] Todas as rotas respondem corretamente
- [ ] CRUD completo para cada entidade
- [ ] Autenticação funcional (login/logout/refresh)
- [ ] Middlewares de validação ativos
- [ ] Tratamento de erros em todos os endpoints
- [ ] Variáveis de ambiente em `.env.example`

### Frontend
- [ ] Aplicação renderiza sem erros
- [ ] Todas as páginas acessíveis pelas rotas
- [ ] Formulários validados antes do envio
- [ ] Integração com API funcionando
- [ ] Estados de loading e erro tratados
- [ ] Responsivo (mobile/desktop)

### Banco de Dados
- [ ] Schema/migrations definidos
- [ ] Seeds para dados iniciais
- [ ] Índices nas colunas de busca frequente
- [ ] Relacionamentos corretos

---

## ✅ Checklist de Documentação

- [ ] README com pré-requisitos
- [ ] README com instalação passo a passo
- [ ] README com variáveis de ambiente
- [ ] README com como rodar em desenvolvimento
- [ ] README com como rodar em produção
- [ ] Endpoints de API documentados
- [ ] Diagrama de entidades ou arquitetura

---

## ✅ Checklist de Segurança (básico)

- [ ] Nenhuma senha ou token hardcoded
- [ ] JWT ou sessão implementados
- [ ] Rotas protegidas por autenticação
- [ ] Inputs sanitizados
- [ ] CORS configurado corretamente

---

## 📦 Formato de Entrega Final

```
Sistema: [NOME]
Versão: 1.0.0
Score de Auditoria: XX/100
Status: APROVADO

📁 Estrutura:
[ÁRVORE DE PASTAS]

🚀 Como rodar:
1. cd [nome-do-sistema]
2. cp .env.example .env
3. npm install
4. npm run dev

📡 Endpoints principais:
[LISTA]

📋 Próximos passos sugeridos:
- [ ] Configurar CI/CD
- [ ] Adicionar testes automatizados
- [ ] Deploy em produção
- [ ] Monitoramento e logs
```
