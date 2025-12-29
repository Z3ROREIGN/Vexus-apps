#!/bin/bash
# Script de Configuração de Secrets - Vexus Apps
# Este script ajuda a configurar as variáveis de ambiente no Cloudflare Workers

echo "🚀 Vexus Apps - Configuração de Secrets"
echo "========================================"
echo ""

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler não está instalado!"
    echo "📦 Instalando wrangler..."
    npm install -g wrangler
fi

echo "📝 Este script irá configurar as seguintes secrets:"
echo "   1. BITSO_API_KEY"
echo "   2. BITSO_API_SECRET"
echo "   3. DISCORD_WEBHOOK_URL"
echo ""

# Verificar se arquivo .env existe
if [ -f ".env" ]; then
    echo "✅ Arquivo .env encontrado!"
    echo "📖 Carregando variáveis do .env..."
    source .env
    
    # Configurar BITSO_API_KEY
    if [ ! -z "$BITSO_API_KEY" ]; then
        echo "🔑 Configurando BITSO_API_KEY..."
        echo "$BITSO_API_KEY" | wrangler secret put BITSO_API_KEY
    else
        echo "⚠️  BITSO_API_KEY não encontrada no .env"
    fi
    
    # Configurar BITSO_API_SECRET
    if [ ! -z "$BITSO_API_SECRET" ]; then
        echo "🔑 Configurando BITSO_API_SECRET..."
        echo "$BITSO_API_SECRET" | wrangler secret put BITSO_API_SECRET
    else
        echo "⚠️  BITSO_API_SECRET não encontrada no .env"
    fi
    
    # Configurar DISCORD_WEBHOOK_URL
    if [ ! -z "$DISCORD_WEBHOOK_URL" ]; then
        echo "🔑 Configurando DISCORD_WEBHOOK_URL..."
        echo "$DISCORD_WEBHOOK_URL" | wrangler secret put DISCORD_WEBHOOK_URL
    else
        echo "⚠️  DISCORD_WEBHOOK_URL não encontrada no .env"
    fi
    
    echo ""
    echo "✅ Configuração concluída!"
    echo "🚀 Execute 'wrangler deploy' para fazer o deploy"
else
    echo "❌ Arquivo .env não encontrado!"
    echo "📝 Por favor:"
    echo "   1. Copie .env.example para .env"
    echo "   2. Preencha as variáveis no arquivo .env"
    echo "   3. Execute este script novamente"
    echo ""
    echo "Comando: cp .env.example .env && nano .env"
fi

echo ""
echo "📚 Documentação:"
echo "   - Bitso API: https://docs.bitso.com/"
echo "   - Discord Webhooks: https://discord.com/developers/docs/resources/webhook"
echo "   - Cloudflare Workers: https://developers.cloudflare.com/workers/"
