/**
 * Cloudflare Worker - Backend para Vexus Apps
 * Processa pagamentos via Bitso e envia webhooks Discord
 */

// Tipos de requisição
const ENDPOINTS = {
    CREATE_PAYMENT: '/api/payment/create',
    CHECK_PAYMENT: '/api/payment/check',
    ACTIVATE_BOT: '/api/bot/activate',
    GET_PURCHASES: '/api/purchases'
};

/**
 * Handler principal do Worker
 */
export default {
    async fetch(request, env, ctx) {
        // CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Rotear requisições
            if (path === ENDPOINTS.CREATE_PAYMENT && request.method === 'POST') {
                return await createPayment(request, env);
            }
            if (path === ENDPOINTS.CHECK_PAYMENT && request.method === 'POST') {
                return await checkPayment(request, env);
            }
            if (path === ENDPOINTS.ACTIVATE_BOT && request.method === 'POST') {
                return await activateBot(request, env);
            }
            if (path === ENDPOINTS.GET_PURCHASES && request.method === 'GET') {
                return await getPurchases(request, env);
            }

            return jsonResponse({ error: 'Endpoint não encontrado' }, 404);
        } catch (error) {
            console.error('Erro:', error);
            return jsonResponse({ error: error.message }, 500);
        }
    }
};

/**
 * Criar pagamento Pix via Bitso
 */
async function createPayment(request, env) {
    const { amount, email, productId, productName } = await request.json();

    if (!amount || !email || !productId) {
        return jsonResponse({ error: 'Dados incompletos' }, 400);
    }

    try {
        // Chamar API Bitso para gerar Pix
        const bitsoResponse = await fetch('https://api.bitso.com/v3/payout_requests/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.BITSO_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount.toString(),
                currency: 'BRL',
                payment_method: 'pix',
                email: email,
                reference: `vexus-${productId}-${Date.now()}`
            })
        });

        if (!bitsoResponse.ok) {
            throw new Error('Erro ao gerar Pix na Bitso');
        }

        const bitsoData = await bitsoResponse.json();

        // Salvar compra em KV
        const purchaseId = `purchase-${Date.now()}`;
        const purchase = {
            id: purchaseId,
            email,
            productId,
            productName,
            amount,
            pixCode: bitsoData.payout_request.qr_code,
            status: 'pending',
            createdAt: new Date().toISOString(),
            bitsoId: bitsoData.payout_request.id
        };

        await env.PURCHASES.put(purchaseId, JSON.stringify(purchase));

        return jsonResponse({
            success: true,
            purchaseId,
            pixCode: bitsoData.payout_request.qr_code,
            qrCode: bitsoData.payout_request.qr_code_url
        });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Verificar status do pagamento
 */
async function checkPayment(request, env) {
    const { purchaseId } = await request.json();

    if (!purchaseId) {
        return jsonResponse({ error: 'purchaseId obrigatório' }, 400);
    }

    try {
        const purchaseData = await env.PURCHASES.get(purchaseId);
        if (!purchaseData) {
            return jsonResponse({ error: 'Compra não encontrada' }, 404);
        }

        const purchase = JSON.parse(purchaseData);

        // Verificar status na Bitso
        const bitsoResponse = await fetch(
            `https://api.bitso.com/v3/payout_requests/${purchase.bitsoId}`,
            {
                headers: {
                    'Authorization': `Bearer ${env.BITSO_API_KEY}`
                }
            }
        );

        if (bitsoResponse.ok) {
            const bitsoData = await bitsoResponse.json();
            const status = bitsoData.payout_request.status;

            // Atualizar status
            if (status === 'completed') {
                purchase.status = 'paid';
                purchase.paidAt = new Date().toISOString();
                await env.PURCHASES.put(purchaseId, JSON.stringify(purchase));
            }
        }

        return jsonResponse({
            purchaseId,
            status: purchase.status,
            amount: purchase.amount,
            productName: purchase.productName
        });
    } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Ativar bot com token Discord
 */
async function activateBot(request, env) {
    const { purchaseId, botToken, email } = await request.json();

    if (!purchaseId || !botToken) {
        return jsonResponse({ error: 'Dados incompletos' }, 400);
    }

    try {
        const purchaseData = await env.PURCHASES.get(purchaseId);
        if (!purchaseData) {
            return jsonResponse({ error: 'Compra não encontrada' }, 404);
        }

        const purchase = JSON.parse(purchaseData);

        // Verificar se já foi ativado
        if (purchase.activatedAt) {
            return jsonResponse({ 
                error: 'Este bot já foi ativado. Aguarde 24 horas para ativar novamente.' 
            }, 400);
        }

        // Atualizar compra
        purchase.botToken = botToken;
        purchase.activatedAt = new Date().toISOString();
        purchase.status = 'activated';
        await env.PURCHASES.put(purchaseId, JSON.stringify(purchase));

        // Enviar webhook Discord
        await sendDiscordWebhook(env, {
            type: 'bot_activated',
            product: purchase.productName,
            email: email,
            token: botToken.substring(0, 10) + '...',
            timestamp: new Date().toISOString()
        });

        return jsonResponse({
            success: true,
            message: 'Bot ativado com sucesso! Aguarde 24 horas para ativar novamente.',
            activatedAt: purchase.activatedAt
        });
    } catch (error) {
        console.error('Erro ao ativar bot:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Obter compras do usuário
 */
async function getPurchases(request, env) {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
        return jsonResponse({ error: 'email obrigatório' }, 400);
    }

    try {
        // Listar todas as compras (em produção, usar índice)
        const purchases = [];
        const keys = await env.PURCHASES.list();

        for (const key of keys.keys) {
            const data = await env.PURCHASES.get(key.name);
            const purchase = JSON.parse(data);
            if (purchase.email === email) {
                purchases.push(purchase);
            }
        }

        return jsonResponse({ purchases });
    } catch (error) {
        console.error('Erro ao obter compras:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Enviar webhook Discord
 */
async function sendDiscordWebhook(env, data) {
    if (!env.DISCORD_WEBHOOK_URL) {
        console.warn('DISCORD_WEBHOOK_URL não configurado');
        return;
    }

    const embed = {
        title: data.type === 'bot_activated' ? '🤖 Bot Ativado' : '💳 Nova Compra',
        description: `Produto: ${data.product}`,
        fields: [
            { name: 'Email', value: data.email, inline: true },
            { name: 'Valor', value: data.amount ? `R$ ${data.amount.toFixed(2)}` : 'N/A', inline: true },
            { name: 'Token', value: data.token || 'N/A', inline: false },
            { name: 'Data', value: data.timestamp, inline: false }
        ],
        color: data.type === 'bot_activated' ? 65280 : 255
    };

    try {
        await fetch(env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) {
        console.error('Erro ao enviar webhook Discord:', error);
    }
}

/**
 * Helper para resposta JSON
 */
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
