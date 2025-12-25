# Setup Cloudflare - Vexus Apps

Guia completo para configurar Vexus Apps na Cloudflare com pagamentos reais e webhooks.

## 📋 Pré-requisitos

- Conta Cloudflare (https://dash.cloudflare.com/)
- Conta Bitso (https://bitso.com/) - para pagamentos Pix
- Servidor Discord com webhook configurado
- Domínio vexusapps.shop apontando para Cloudflare

## 🚀 Passo 1: Deploy na Cloudflare Pages

### 1.1 Conectar Repositório GitHub
1. Acesse https://pages.cloudflare.com/
2. Clique em "Criar um projeto"
3. Selecione "Conectar a Git"
4. Autorize Cloudflare a acessar seu GitHub
5. Selecione repositório `Z3ROREIGN/Vexus-apps`
6. Clique em "Começar a compilação"

### 1.2 Configurar Build
- **Comando de compilação:** (deixe em branco - é site estático)
- **Diretório de saída:** (deixe em branco)
- **Variáveis de ambiente:** (configure no próximo passo)

### 1.3 Configurar Domínio
1. Após o deploy, clique em "Adicionar domínio personalizado"
2. Digite `vexusapps.shop`
3. Siga as instruções para configurar DNS

## 🔑 Passo 2: Configurar Secrets (Variáveis Sensíveis)

### 2.1 Acessar Secrets
1. Vá para Workers & Pages → Vexus Apps
2. Clique em "Settings"
3. Vá para "Secrets"

### 2.2 Adicionar Secrets
Clique em "Add Secret" para cada uma:

**BITSO_API_KEY**
- Valor: Sua chave de API da Bitso
- Obtém em: https://bitso.com/settings/api

**BITSO_API_SECRET**
- Valor: Seu secret da Bitso
- Obtém em: https://bitso.com/settings/api

**DISCORD_WEBHOOK_URL**
- Valor: URL completa do webhook Discord
- Exemplo: `https://discordapp.com/api/webhooks/123456789/abcdefg`

## 🔗 Passo 3: Configurar Webhook Discord

### 3.1 Criar Webhook
1. Abra seu servidor Discord
2. Vá para Configurações → Integrações → Webhooks
3. Clique em "Novo Webhook"
4. Nomeie como "Vexus Apps"
5. Selecione o canal onde quer receber notificações
6. Clique em "Copiar URL do Webhook"

### 3.2 Adicionar ao Cloudflare
1. Copie a URL do webhook
2. Vá para Cloudflare → Workers → Secrets
3. Adicione como `DISCORD_WEBHOOK_URL`

## 💳 Passo 4: Configurar Bitso

### 4.1 Criar Credenciais API
1. Acesse https://bitso.com/settings/api
2. Clique em "Criar nova chave"
3. Nomeie como "Vexus Apps"
4. Selecione permissões:
   - [ ] Ler saldo
   - [x] Criar transferências Pix
   - [x] Listar transferências

### 4.2 Copiar Credenciais
1. Copie a **API Key**
2. Copie o **API Secret**
3. Adicione ao Cloudflare como secrets

## 🗄️ Passo 5: Configurar KV Namespace

### 5.1 Criar Namespace
1. Vá para Cloudflare → Workers → KV
2. Clique em "Criar namespace"
3. Nomeie como `vexus-purchases`
4. Copie o **ID do namespace**

### 5.2 Adicionar ao wrangler.toml
```toml
[[kv_namespaces]]
binding = "PURCHASES"
id = "seu-id-aqui"
```

### 5.3 Deploy do Worker
```bash
# Instalar Wrangler
npm install -g wrangler

# Autenticar
wrangler login

# Deploy
wrangler deploy
```

## ✅ Passo 6: Testar Tudo

### 6.1 Testar Frontend
1. Acesse https://vexusapps.shop
2. Registre-se com um email
3. Clique em um bot para comprar
4. Verifique se o código Pix é gerado

### 6.2 Testar Pagamento
1. Copie o código Pix
2. Faça um Pix de teste (se Bitso estiver em modo sandbox)
3. Verifique se o status muda para "Pago"

### 6.3 Testar Webhook Discord
1. Ative um bot após pagamento
2. Verifique se mensagem aparece no Discord

## 🔧 Troubleshooting

### "API Key inválida"
- Verifique se a chave está correta no Cloudflare
- Certifique-se de que a chave não expirou
- Regenere a chave se necessário

### "Webhook falhou"
- Verifique se a URL do webhook está correta
- Certifique-se de que o webhook não foi deletado
- Teste manualmente em https://discord.com/api/webhooks/test

### "KV Namespace não encontrado"
- Verifique o ID do namespace em Cloudflare
- Atualize o wrangler.toml com o ID correto
- Faça deploy novamente

### "CORS bloqueado"
- Verifique se o worker está retornando headers CORS corretos
- Teste com `curl -H "Origin: https://vexusapps.shop" ...`

## 📚 Referências

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare KV: https://developers.cloudflare.com/workers/runtime-apis/kv/
- Bitso API: https://bitso.com/api/
- Discord Webhooks: https://discord.com/developers/docs/resources/webhook

## 🚀 Próximos Passos

1. **Implementar Banco de Dados** - Use Cloudflare D1 para armazenar dados persistentes
2. **Adicionar Analytics** - Use Cloudflare Analytics Engine
3. **Implementar Cache** - Use Cloudflare Cache API para melhor performance
4. **Adicionar Rate Limiting** - Proteja contra abuso

---

**Dúvidas?** Consulte a documentação oficial do Cloudflare ou abra uma issue no GitHub.
