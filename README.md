# Vexus Apps

Plataforma elegante para venda e ativação de bots Discord com apenas HTML, CSS e JavaScript.

## 🚀 Características

- ✅ Interface elegante com tema escuro
- ✅ Catálogo de 3 bots (Ticket, Vendas, Manager)
- ✅ Sistema de autenticação com localStorage
- ✅ Checkout com código Pix e QR Code
- ✅ Página "Meus Comprados"
- ✅ Sistema de ativação de bots
- ✅ Sem dependências externas
- ✅ Totalmente responsivo

## 📁 Estrutura

```
vexus-apps/
├── index.html      # Página principal
├── style.css       # Estilos
├── app.js          # Lógica da aplicação
├── data.js         # Dados e localStorage
└── data.json       # Dados dos produtos
```

## 🛠️ Como Usar

### Local
1. Abra `index.html` no navegador
2. Registre-se ou faça login
3. Navegue pelo catálogo
4. Compre um bot
5. Ative com seu token Discord

### Deploy na Cloudflare Pages
1. Faça push dos arquivos para GitHub
2. Conecte o repositório no Cloudflare Pages
3. Pronto! Seu site estará online

## 💳 Produtos

| Bot | Preço | Descrição |
|-----|-------|-----------|
| Ticket | R$ 4,00 | Gerenciamento de tickets |
| Vendas | R$ 5,00 | Automação de vendas |
| Manager | R$ 8,00 | Gerenciamento do servidor |

## 🔐 Segurança

- Dados armazenados em localStorage (cliente)
- Nenhuma informação sensível no código
- Tokens não são salvos no servidor

## 📝 Notas

- Em produção, integre com API real de pagamentos
- Implemente backend para armazenar dados
- Configure webhook Discord para notificações
- Use HTTPS em produção

## 🚀 Deploy

```bash
# Fazer push para GitHub
git add .
git commit -m "Deploy Vexus Apps"
git push origin main

# Conectar no Cloudflare Pages
# 1. Acesse https://pages.cloudflare.com/
# 2. Conecte seu repositório GitHub
# 3. Configure o build (deixe em branco para site estático)
# 4. Deploy automático
```

## 📞 Suporte

Para problemas ou sugestões, abra uma issue no GitHub.

---

**Vexus Apps** - Plataforma de Bots Discord
