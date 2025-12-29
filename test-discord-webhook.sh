#!/bin/bash
# Script de Teste de Webhook Discord - Vexus Apps
# Testa se o webhook Discord está funcionando corretamente

echo "🔔 Teste de Webhook Discord"
echo "==========================="
echo ""

# Verificar se a URL foi fornecida
if [ -z "$1" ]; then
    echo "❌ Erro: URL do webhook não fornecida"
    echo ""
    echo "Uso: ./test-discord-webhook.sh <WEBHOOK_URL>"
    echo ""
    echo "Exemplo:"
    echo "./test-discord-webhook.sh https://discord.com/api/webhooks/123456/abcdef"
    echo ""
    echo "Ou defina a variável de ambiente:"
    echo "export DISCORD_WEBHOOK_URL='sua_url_aqui'"
    echo "./test-discord-webhook.sh"
    exit 1
fi

WEBHOOK_URL="$1"

# Se não foi passado argumento, tenta usar variável de ambiente
if [ -z "$WEBHOOK_URL" ] && [ ! -z "$DISCORD_WEBHOOK_URL" ]; then
    WEBHOOK_URL="$DISCORD_WEBHOOK_URL"
fi

echo "📤 Enviando mensagem de teste..."
echo "URL: ${WEBHOOK_URL:0:50}..."
echo ""

# Criar payload JSON
PAYLOAD=$(cat <<EOF
{
  "embeds": [{
    "title": "✅ Teste de Webhook - Vexus Apps",
    "description": "Se você está vendo esta mensagem, o webhook está funcionando corretamente!",
    "color": 65280,
    "fields": [
      {
        "name": "🧪 Status",
        "value": "Teste bem-sucedido",
        "inline": true
      },
      {
        "name": "⏰ Data/Hora",
        "value": "$(date '+%Y-%m-%d %H:%M:%S')",
        "inline": true
      }
    ],
    "footer": {
      "text": "Vexus Apps - Sistema de Notificações"
    },
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
  }]
}
EOF
)

# Enviar requisição
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Extrair código de status HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Resultado:"
echo "   Status HTTP: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 204 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo "   ✅ Webhook funcionando corretamente!"
    echo ""
    echo "🎉 Sucesso! Verifique o canal do Discord para ver a mensagem."
    exit 0
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo "   ❌ Webhook não encontrado (404)"
    echo ""
    echo "Possíveis causas:"
    echo "- URL do webhook está incorreta"
    echo "- Webhook foi deletado no Discord"
    echo ""
    echo "Solução:"
    echo "1. Crie um novo webhook no Discord"
    echo "2. Atualize a URL no Cloudflare"
    exit 1
elif [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    echo "   ❌ Acesso negado ($HTTP_CODE)"
    echo ""
    echo "Possíveis causas:"
    echo "- Token do webhook está incorreto"
    echo "- Webhook não tem permissões no canal"
    exit 1
else
    echo "   ❌ Erro desconhecido"
    echo "   Resposta: $RESPONSE_BODY"
    exit 1
fi
