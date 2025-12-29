# Vexus Apps - Plataforma de Bots Discord

Plataforma **ultra profissional** para venda e ativação de bots Discord com pagamento via PIX integrado à API Bitso.

## ✨ Novo Design Profissional

- 🎨 **Tema preto puro (#000000)** com gradientes neon ciano/roxo/magenta
- ⚡ **Animações avançadas** em todos os botões com efeitos de onda
- 🌟 **Efeitos hover 3D** com transformações e brilho
- 💫 **Gradientes animados** em textos e backgrounds
- 🎭 **Bordas iluminadas** com glow effect nos cards
- 📱 **Scrollbar personalizada** com gradiente
- 🔄 **Transições suaves** em todas as interações
- 📐 **Design responsivo** profissional

## 🚀 Características

- ✅ Interface ultra profissional com tema preto
- ✅ Catálogo de 3 bots (Ticket, Vendas, Manager)
- ✅ Sistema de autenticação com localStorage
- ✅ **Pagamentos PIX reais via API Bitso**
- ✅ **Aprovação automática APENAS após confirmação da Bitso**
- ✅ Checkout com código PIX e QR Code
- ✅ Verificação automática de pagamento (5 em 5 segundos)
- ✅ Página "Meus Comprados"
- ✅ Sistema de ativação de bots
- ✅ Webhook Discord para notificações
- ✅ Backend serverless (Cloudflare Workers)
- ✅ Totalmente responsivo

## 📁 Estrutura

```
vexus-apps/
├── index.html              # Página principal
├── style.css               # Estilos profissionais com animações
├── app.js                  # Lógica frontend
├── data.js                 # Gerenciamento de dados
├── data.json               # Dados dos produtos
├── worker.js               # Backend Cloudflare Workers (Bitso API)
├── wrangler.toml           # Configuração Cloudflare
├── CLOUDFLARE_SETUP.md     # Guia de setup
└── README.md               # Este arquivo
```

## 🛠️ Como Usar

### Local (Desenvolvimento)
1. Abra `index.html` no navegador
2. Registre-se ou faça login
3. Navegue pelo catálogo
4. Compre um bot (modo teste com PIX mock)
5. Ative com seu token Discord

### Deploy na Cloudflare Pages

**Guia completo:** Veja `CLOUDFLARE_SETUP.md`

#### Resumo Rápido:

1. **GitHub:**
   ```bash
   git add .
   git commit -m "Update: Design profissional + Bitso API"
   git push origin main
   ```

2. **Cloudflare Pages:**
   - Conecte repositório GitHub
   - Deploy automático

3. **Cloudflare Workers:**
   ```bash
   wrangler deploy
   ```

4. **Configure Secrets:**
   ```bash
   BITSO_API_KEY=sua_chave_api_bitso
   DISCORD_WEBHOOK_URL=sua_url_webhook_discord
   ```

5. **Configure KV Namespace:**
   ```bash
   wrangler kv:namespace create "PURCHASES"
   ```

## 💳 Produtos

| Bot | Preço | Descrição |
|-----|-------|-----------|
| Ticket | R$ 4,00 | Gerenciamento de tickets de suporte |
| Vendas | R$ 5,00 | Automação de vendas e conversão |
| Manager | R$ 8,00 | Gerenciamento completo do servidor |

## 🔐 Integração Bitso API

### Como Obter API Key

1. Acesse [Bitso Business](https://business.bitso.com/)
2. Crie uma conta empresarial
3. Solicite acesso à API de Payouts
4. Gere suas credenciais API
5. Configure `BITSO_API_KEY` no Cloudflare

### Endpoints Utilizados

- `POST /v3/payout_requests/` - Criar pagamento PIX
- `GET /v3/payout_requests/{id}` - Verificar status do pagamento

### Fluxo de Pagamento Seguro

1. ✅ Cliente escolhe produto e clica em "Comprar"
2. ✅ Backend chama **API Bitso** para gerar PIX
3. ✅ Frontend exibe QR Code e código copia-e-cola
4. ✅ Sistema verifica status **automaticamente a cada 5 segundos**
5. ✅ **Aprovação APENAS após confirmação real da Bitso**
6. ✅ Cliente pode ativar o bot após pagamento confirmado
7. ✅ Webhook Discord notifica pagamento e ativação

### Status de Pagamento

- `pending` - Aguardando pagamento
- `processing` - Processando
- `completed` / `paid` - **Pagamento confirmado pela Bitso**
- `failed` - Falhou
- `cancelled` - Cancelado

## 🔔 Webhooks Discord

Configure um webhook Discord para receber notificações:

- 💰 **Pagamento Confirmado** - Quando Bitso confirma o PIX
- 🤖 **Bot Ativado** - Quando cliente ativa com token

## 🛡️ Segurança

- ✅ **Aprovação apenas após confirmação real da API Bitso**
- ✅ Tokens de bot armazenados de forma segura no KV
- ✅ Validação de pagamento antes da ativação
- ✅ CORS configurado corretamente
- ✅ Dados sensíveis em variáveis de ambiente
- ✅ API Keys nunca expostas no GitHub
- ✅ Sem botão manual de confirmação de pagamento
- ✅ Verificação automática via API

## 🎨 Animações e Efeitos

### Botões
- Efeito de onda ao hover
- Transformação 3D com scale
- Gradiente animado
- Box-shadow com glow effect
- Transições suaves

### Cards
- Hover com elevação 3D
- Bordas iluminadas com gradiente
- Ícones flutuantes
- Sombras coloridas

### Backgrounds
- Gradientes radiais animados
- Efeitos de rotação
- Pulso sutil
- Backdrop blur

## 📱 Responsividade

- ✅ Desktop (1920px+)
- ✅ Laptop (1366px)
- ✅ Tablet (768px)
- ✅ Mobile (375px)

## 🔌 Integrações

- **Bitso API** - Pagamentos PIX reais com confirmação automática
- **Discord Webhooks** - Notificações em tempo real
- **Cloudflare Workers** - Backend serverless
- **Cloudflare KV** - Armazenamento de compras
- **Cloudflare Pages** - Hosting frontend

## 📝 Notas Importantes

### Sobre a API Bitso

- A API Bitso é voltada para empresas B2B
- Requer aprovação comercial e contrato
- Ideal para volumes médios a altos
- Suporte a PIX, SPEI, PSE e outros métodos LATAM

### Modo de Teste

O código inclui geração de PIX mock para testes locais. Em produção com API Bitso real:

1. Configure `BITSO_API_KEY` no Cloudflare
2. O sistema usará automaticamente a API real
3. Remova a função `generateMockPixCode()` se desejar

## 🚀 Deploy

```bash
# 1. Fazer push para GitHub
git add .
git commit -m "Deploy Vexus Apps - Design Profissional"
git push origin main

# 2. Deploy Worker
wrangler deploy

# 3. Conectar no Cloudflare Pages
# - Acesse https://pages.cloudflare.com/
# - Conecte seu repositório GitHub
# - Configure secrets no Cloudflare Dashboard
# - Deploy automático
```

## 🎯 Checklist de Deploy

- [ ] Repositório GitHub atualizado
- [ ] `BITSO_API_KEY` configurada no Cloudflare
- [ ] `DISCORD_WEBHOOK_URL` configurada
- [ ] KV Namespace `PURCHASES` criado
- [ ] Worker deployado
- [ ] Pages conectado ao GitHub
- [ ] Domínio `vexusapps.shop` configurado
- [ ] Teste de pagamento realizado

## 📞 Suporte

- **Documentação Bitso:** https://docs.bitso.com/
- **Bitso Business:** https://business.bitso.com/
- **Cloudflare Docs:** https://developers.cloudflare.com/

---

**Vexus Apps** © 2024 - Plataforma Ultra Profissional de Bots Discord
