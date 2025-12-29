# 🔐 Guia Completo: Configuração de Secrets no Cloudflare

Este guia explica como configurar corretamente as variáveis **DISCORD_WEBHOOK_URL** e **BITSO_API_KEY** no Cloudflare Workers para o projeto Vexus Apps.

---

## 📋 O Que São Secrets?

**Secrets** são variáveis de ambiente seguras que armazenam informações sensíveis (como chaves de API e URLs de webhook) de forma criptografada no Cloudflare. Elas **nunca** devem ser commitadas no Git.

---

## 🎯 Variáveis Necessárias

### 1. **BITSO_API_KEY**
- **Descrição:** Chave de API da Bitso para processar pagamentos PIX
- **Onde obter:** https://bitso.com/settings/api
- **Formato:** String alfanumérica
- **Exemplo:** `sua_chave_aqui`

### 2. **DISCORD_WEBHOOK_URL**
- **Descrição:** URL do webhook Discord para receber notificações de pagamentos e ativações
- **Onde obter:** Discord → Configurações do Servidor → Integrações → Webhooks
- **Formato:** URL completa
- **Exemplo:** `https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz123456`

---

## 🚀 Método 1: Configuração via Wrangler CLI (Recomendado)

### Passo 1: Instalar Wrangler

```bash
npm install -g wrangler
```

### Passo 2: Fazer Login no Cloudflare

```bash
wrangler login
```

Isso abrirá uma janela do navegador para você autorizar o acesso.

### Passo 3: Configurar as Secrets

#### Opção A: Manualmente (uma por vez)

```bash
# Configurar BITSO_API_KEY
wrangler secret put BITSO_API_KEY
# Cole sua chave quando solicitado e pressione Enter

# Configurar DISCORD_WEBHOOK_URL
wrangler secret put DISCORD_WEBHOOK_URL
# Cole a URL do webhook quando solicitado e pressione Enter
```

#### Opção B: Usando o Script Automatizado

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e preencha suas credenciais:
   ```bash
   nano .env
   # ou use seu editor preferido
   ```

3. Execute o script de configuração:
   ```bash
   ./setup-secrets.sh
   ```

### Passo 4: Verificar Configuração

```bash
wrangler secret list
```

Você deve ver:
```
✅ BITSO_API_KEY
✅ DISCORD_WEBHOOK_URL
```

---

## 🌐 Método 2: Configuração via Dashboard Cloudflare

### Passo 1: Acessar o Dashboard

1. Acesse: https://dash.cloudflare.com/
2. Faça login na sua conta
3. Clique em **Workers & Pages** no menu lateral

### Passo 2: Selecionar o Worker

1. Encontre e clique no worker **vexus-apps** (ou **vexus-apps-production**)
2. Clique na aba **Settings** (Configurações)
3. Role até a seção **Environment Variables** (Variáveis de Ambiente)

### Passo 3: Adicionar as Secrets

1. Clique em **Add variable** (Adicionar variável)
2. Para cada secret:
   - **Variable name:** `BITSO_API_KEY`
   - **Value:** Cole sua chave de API da Bitso
   - Marque a opção **Encrypt** (Criptografar)
   - Clique em **Save** (Salvar)

3. Repita para `DISCORD_WEBHOOK_URL`:
   - **Variable name:** `DISCORD_WEBHOOK_URL`
   - **Value:** Cole a URL do webhook Discord
   - Marque a opção **Encrypt** (Criptografar)
   - Clique em **Save** (Salvar)

### Passo 4: Deploy

Após adicionar as variáveis, faça o deploy do worker:

```bash
wrangler deploy
```

---

## 🔍 Como Obter as Credenciais

### Obter BITSO_API_KEY

1. Acesse https://bitso.com/
2. Faça login na sua conta Bitso Business
3. Vá em **Settings** → **API**
4. Clique em **Create API Key**
5. Defina as permissões necessárias:
   - ✅ Read account info
   - ✅ Create payouts
   - ✅ Read payout status
6. Copie a chave gerada (ela só será mostrada uma vez!)

**⚠️ Importante:** A API Bitso requer aprovação comercial. Entre em contato com o suporte da Bitso se ainda não tiver acesso.

### Obter DISCORD_WEBHOOK_URL

1. Abra o Discord e vá para o servidor onde deseja receber notificações
2. Clique na engrenagem do canal (⚙️) → **Integrações**
3. Clique em **Webhooks** → **Novo Webhook**
4. Dê um nome ao webhook (ex: "Vexus Apps Notificações")
5. Escolha o canal onde as mensagens serão enviadas
6. Clique em **Copiar URL do Webhook**
7. Salve essa URL (ela será usada como `DISCORD_WEBHOOK_URL`)

---

## ✅ Verificação e Testes

### Verificar se as Secrets Estão Configuradas

Execute o script de verificação:

```bash
./verify-config.sh
```

Ou manualmente:

```bash
wrangler secret list
```

### Testar o Worker Localmente

```bash
wrangler dev
```

Isso iniciará um servidor local em `http://localhost:8787` para testes.

### Testar em Produção

Após o deploy, teste fazendo uma compra de teste no site:

1. Acesse seu site Vexus Apps
2. Faça login
3. Tente comprar um bot
4. Verifique se o código PIX é gerado
5. Verifique se as notificações chegam no Discord

---

## 🐛 Solução de Problemas

### Erro: "BITSO_API_KEY não configurada"

**Causa:** A variável não foi definida ou não está acessível ao worker.

**Solução:**
1. Verifique se a secret foi criada: `wrangler secret list`
2. Se não existir, crie: `wrangler secret put BITSO_API_KEY`
3. Faça deploy novamente: `wrangler deploy`

### Erro: "DISCORD_WEBHOOK_URL não configurado"

**Causa:** A URL do webhook não foi definida.

**Solução:**
1. Verifique se a secret foi criada: `wrangler secret list`
2. Se não existir, crie: `wrangler secret put DISCORD_WEBHOOK_URL`
3. Faça deploy novamente: `wrangler deploy`

### Webhook Discord não está recebendo mensagens

**Possíveis causas:**
1. URL do webhook incorreta
2. Webhook foi deletado no Discord
3. Permissões insuficientes no canal

**Solução:**
1. Teste a URL do webhook manualmente:
   ```bash
   curl -X POST "SUA_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"content": "Teste de webhook!"}'
   ```
2. Se não funcionar, crie um novo webhook no Discord
3. Atualize a secret: `wrangler secret put DISCORD_WEBHOOK_URL`

### Pagamentos PIX não estão sendo gerados

**Possíveis causas:**
1. API Key da Bitso inválida ou expirada
2. Conta Bitso não tem permissões de Payouts
3. API Bitso está fora do ar

**Solução:**
1. Verifique se sua conta Bitso tem acesso à API de Payouts
2. Teste a API Key manualmente:
   ```bash
   curl -H "Authorization: Bearer SUA_BITSO_API_KEY" \
     https://api.bitso.com/v3/account_status
   ```
3. Se retornar erro 401, a chave está inválida
4. Gere uma nova chave e atualize: `wrangler secret put BITSO_API_KEY`

---

## 🔒 Boas Práticas de Segurança

### ✅ O Que Fazer

- ✅ Sempre use secrets para informações sensíveis
- ✅ Adicione `.env` ao `.gitignore`
- ✅ Rotacione suas chaves periodicamente
- ✅ Use diferentes chaves para desenvolvimento e produção
- ✅ Limite as permissões das API keys ao mínimo necessário

### ❌ O Que NÃO Fazer

- ❌ **NUNCA** commite secrets no Git
- ❌ **NUNCA** compartilhe suas chaves publicamente
- ❌ **NUNCA** coloque secrets diretamente no código
- ❌ **NUNCA** use a mesma chave em múltiplos projetos
- ❌ **NUNCA** envie secrets por email ou chat não criptografado

---

## 📚 Referências

- **Cloudflare Workers Secrets:** https://developers.cloudflare.com/workers/configuration/secrets/
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler/
- **Bitso API Docs:** https://docs.bitso.com/
- **Discord Webhooks:** https://discord.com/developers/docs/resources/webhook

---

## 🆘 Suporte

Se você encontrar problemas:

1. Verifique os logs do worker: `wrangler tail`
2. Consulte a documentação oficial do Cloudflare
3. Revise o arquivo `CLOUDFLARE_SETUP.md` para instruções detalhadas
4. Entre em contato com o suporte da Bitso para questões relacionadas à API

---

**Vexus Apps** © 2024 - Configuração Segura de Secrets
