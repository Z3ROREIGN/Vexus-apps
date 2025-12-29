#!/bin/bash
# Script de Verificação de Configuração - Vexus Apps
# Verifica se todas as secrets e configurações necessárias estão corretas

echo "🔍 Vexus Apps - Verificação de Configuração"
echo "============================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de problemas
PROBLEMS=0

# Verificar se wrangler está instalado
echo "📦 Verificando Wrangler..."
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler não está instalado!${NC}"
    echo "   Instale com: npm install -g wrangler"
    PROBLEMS=$((PROBLEMS + 1))
else
    WRANGLER_VERSION=$(wrangler --version 2>&1 | head -1)
    echo -e "${GREEN}✅ Wrangler instalado: $WRANGLER_VERSION${NC}"
fi

echo ""

# Verificar autenticação
echo "🔐 Verificando autenticação..."
if wrangler whoami &> /dev/null; then
    USER_INFO=$(wrangler whoami 2>&1 | grep -A 1 "Account Name")
    echo -e "${GREEN}✅ Autenticado no Cloudflare${NC}"
    echo "$USER_INFO"
else
    echo -e "${RED}❌ Não autenticado no Cloudflare${NC}"
    echo "   Execute: wrangler login"
    PROBLEMS=$((PROBLEMS + 1))
fi

echo ""

# Verificar secrets configuradas
echo "🔑 Verificando secrets..."
if command -v wrangler &> /dev/null && wrangler whoami &> /dev/null; then
    SECRETS=$(wrangler secret list 2>&1)
    
    if echo "$SECRETS" | grep -q "BITSO_API_KEY"; then
        echo -e "${GREEN}✅ BITSO_API_KEY configurada${NC}"
    else
        echo -e "${RED}❌ BITSO_API_KEY não configurada${NC}"
        echo "   Configure com: wrangler secret put BITSO_API_KEY"
        PROBLEMS=$((PROBLEMS + 1))
    fi
    
    if echo "$SECRETS" | grep -q "DISCORD_WEBHOOK_URL"; then
        echo -e "${GREEN}✅ DISCORD_WEBHOOK_URL configurada${NC}"
    else
        echo -e "${RED}❌ DISCORD_WEBHOOK_URL não configurada${NC}"
        echo "   Configure com: wrangler secret put DISCORD_WEBHOOK_URL"
        PROBLEMS=$((PROBLEMS + 1))
    fi
fi

echo ""

# Verificar arquivo wrangler.toml
echo "📄 Verificando wrangler.toml..."
if [ -f "wrangler.toml" ]; then
    echo -e "${GREEN}✅ wrangler.toml encontrado${NC}"
    
    # Verificar nome do worker
    WORKER_NAME=$(grep "^name" wrangler.toml | cut -d'"' -f2)
    echo "   Worker name: $WORKER_NAME"
    
    # Verificar KV namespace
    if grep -q "kv_namespaces" wrangler.toml; then
        KV_ID=$(grep "id =" wrangler.toml | grep -v "^#" | cut -d'"' -f2)
        if [ "$KV_ID" == "seu-kv-namespace-id-aqui" ]; then
            echo -e "${YELLOW}⚠️  KV Namespace ID precisa ser configurado${NC}"
            echo "   Crie com: wrangler kv:namespace create PURCHASES"
            PROBLEMS=$((PROBLEMS + 1))
        else
            echo -e "${GREEN}✅ KV Namespace configurado: $KV_ID${NC}"
        fi
    else
        echo -e "${RED}❌ KV Namespace não configurado${NC}"
        PROBLEMS=$((PROBLEMS + 1))
    fi
else
    echo -e "${RED}❌ wrangler.toml não encontrado${NC}"
    PROBLEMS=$((PROBLEMS + 1))
fi

echo ""

# Verificar arquivos do projeto
echo "📁 Verificando arquivos do projeto..."
FILES=("index.html" "style.css" "app.js" "worker.js" "data.js" "data.json")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file não encontrado${NC}"
        PROBLEMS=$((PROBLEMS + 1))
    fi
done

echo ""

# Verificar .gitignore
echo "🔒 Verificando segurança..."
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        echo -e "${GREEN}✅ .env está no .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠️  .env não está no .gitignore${NC}"
        echo "   Adicione .env ao .gitignore para evitar vazamento de secrets"
        PROBLEMS=$((PROBLEMS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  .gitignore não encontrado${NC}"
    PROBLEMS=$((PROBLEMS + 1))
fi

# Verificar se .env existe (não deveria estar no repo)
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env encontrado${NC}"
    echo "   Certifique-se de que ele está no .gitignore"
fi

echo ""
echo "============================================"

# Resumo final
if [ $PROBLEMS -eq 0 ]; then
    echo -e "${GREEN}✅ Tudo configurado corretamente!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Execute: wrangler deploy"
    echo "2. Teste o site em produção"
    echo "3. Verifique as notificações no Discord"
    exit 0
else
    echo -e "${RED}❌ Encontrados $PROBLEMS problema(s)${NC}"
    echo ""
    echo "Corrija os problemas acima antes de fazer deploy."
    echo "Consulte CONFIGURACAO_SECRETS.md para mais detalhes."
    exit 1
fi
