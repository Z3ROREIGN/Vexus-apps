# Vexus Apps

Plataforma elegante para venda e ativação de bots Discord com pagamentos reais via Bitso.

## 🚀 Características

- ✅ Interface elegante com tema escuro
- ✅ Catálogo de 3 bots (Ticket, Vendas, Manager)
- ✅ Sistema de autenticação com localStorage
- ✅ Pagamentos Pix reais via Bitso API
- ✅ Checkout com código Pix e QR Code
- ✅ Página "Meus Comprados"
- ✅ Sistema de ativação de bots
- ✅ Webhook Discord para notificações
- ✅ Backend serverless (Cloudflare Workers)
- ✅ Totalmente responsivo

## 📁 Estrutura

```
vexus-apps/
├── index.html              # Página principal
├── style.css               # Estilos
├── app.js                  # Lógica frontend
├── data.js                 # Gerenciamento de dados
├── data.json               # Dados dos produtos
├── worker.js               # Backend Cloudflare Workers
├── wrangler.toml           # Configuração Cloudflare
├── CLOUDFLARE_SETUP.md     # Guia de setup
└── README.md               # Este arquivo
```

## 🛠️ Como Usar

### Local
1. Abra `index.html` no navegador
2. Registre-se ou faça login
3. Navegue pelo catálogo
4. Compre um bot
5. Ative com seu token Discord

### Deploy na Cloudflare Pages

**Guia completo:** Veja `CLOUDFLARE_SETUP.md`

Resumo:
1. Conecte repositório GitHub
2. Configure secrets (BITSO_API_KEY, BITSO_API_SECRET, DISCORD_WEBHOOK_URL)
3. Deploy do worker.js
4. Configure KV Namespace
5. Pronto!

## 💳 Produtos

| Bot | Preço | Descrição |
|-----|-------|-----------|
| Ticket | R$ 4,00 | Gerenciamento de tickets |
| Vendas | R$ 5,00 | Automação de vendas |
| Manager | R$ 8,00 | Gerenciamento do servidor |

## 🔐 Segurança

- Dados armazenados em localStorage (cliente)
- Nenhuma informação sensível no código
- Secrets configurados apenas no Cloudflare
- API Keys nunca expostas no GitHub
- Tokens de bot criptografados no KV
- CORS configurado para vexusapps.shop apenas

## 🔌 Integrações

- **Bitso API** - Pagamentos Pix reais
- **Discord Webhooks** - Notificações automáticas
- **Cloudflare Workers** - Backend serverless
- **Cloudflare KV** - Armazenamento de compras
- **Cloudflare Pages** - Hosting frontend

## 🚀 Deploy

```bash
# Fazer push para GitHub
git add .
git commit -m "Deploy Vexus Apps"
git push origin main

# Conectar no Cloudflare Pages
# 1. Acesse https://pages.cloudflare.com/
# 2. Conecte seu repositório GitHub
# 3. Configure secrets no Cloudflare Dashboard
# 4. Deploy automático
```

## 📞 Suporte

Para problemas ou sugestões, abra uma issue no GitHub.

---

**Vexus Apps** - Plataforma de Bots Discord com Pagamentos Reais
