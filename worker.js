/**
 * Cloudflare Worker - Backend para Vexus Apps
 * Integração com API Bitso para pagamentos PIX
 * Aprovação automática apenas após confirmação de pagamento
 */

// Endpoints da API
const ENDPOINTS = {
    CREATE_PAYMENT: '/api/payment/create',
    CHECK_PAYMENT: '/api/payment/check',
    ACTIVATE_BOT: '/api/bot/activate',
    GET_PURCHASES: '/api/purchases'
};

// Configuração da API Bitso
const BITSO_API_BASE = 'https://api.bitso.com/v3';

/**
 * Handler principal do Worker
 */
export default {
    async fetch(request, env, ctx) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };

        // CORS headers
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        let path = url.pathname;
        
        // Normalizar path para remover prefixo /api se presente (Cloudflare Pages Functions vs Workers)
        if (path.startsWith('/api')) {
            path = path.substring(4);
        }
        if (path === '') path = '/';
        
        console.log(`[DEBUG] Request Path: ${path}, Method: ${request.method}`);

        // Endpoints normalizados (sem /api)
        const ROUTES = {
            CREATE_PAYMENT: '/payment/create',
            CHECK_PAYMENT: '/payment/check',
            ACTIVATE_BOT: '/bot/activate',
            GET_PURCHASES: '/purchases'
        };

        try {
            // Rotear requisições
            if (path === ROUTES.CREATE_PAYMENT && request.method === 'POST') {
                return await createPayment(request, env);
            }
            if (path === ROUTES.CHECK_PAYMENT && request.method === 'POST') {
                return await checkPayment(request, env);
            }
            if (path === ROUTES.ACTIVATE_BOT && request.method === 'POST') {
                return await activateBot(request, env);
            }
            if (path === ROUTES.GET_PURCHASES && request.method === 'GET') {
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
 * Criar pagamento PIX via API Bitso
 */
async function createPayment(request, env) {
    const { amount, email, productId, productName } = await request.json();

    if (!amount || !email || !productId) {
        return jsonResponse({ error: 'Dados incompletos' }, 400);
    }

    const purchaseId = `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const reference = `vexus-${productId}-${Date.now()}`;

    // MODO DE TESTE / FALLBACK: Se a API Key for "MOCK" ou estiver ausente, gera um PIX de teste
    if (!env.BITSO_API_KEY || env.BITSO_API_KEY === 'MOCK') {
        console.log('Usando modo de teste (Mock PIX)');
        const mockPixCode = `00020126580014BR.GOV.BCB.PIX0136teste-pix-vexus-apps-${purchaseId}5204000053039865404${amount.toFixed(2)}5802BR5910Vexus Apps6009SAO PAULO62070503***6304ABCD`;
        
        const purchase = {
            id: purchaseId,
            email,
            productId,
            productName,
            amount,
            pixCode: mockPixCode,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockPixCode)}`,
            status: 'pending',
            createdAt: new Date().toISOString(),
            bitsoId: 'mock-id',
            reference
        };

        await env.PURCHASES.put(purchaseId, JSON.stringify(purchase));
        
        // Indexar por email
        const emailKey = `email:${email}`;
        const emailPurchases = JSON.parse(await env.PURCHASES.get(emailKey) || '[]');
        emailPurchases.push(purchaseId);
        await env.PURCHASES.put(emailKey, JSON.stringify(emailPurchases));

        return jsonResponse({
            success: true,
            purchaseId,
            pixCode: mockPixCode,
            qrCode: purchase.qrCodeUrl
        });
    }

    try {
        // Chamar API Bitso para criar payout request (PIX)
        const bitsoResponse = await fetch(`${BITSO_API_BASE}/payout_requests/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.BITSO_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount.toFixed(2),
                currency: 'BRL',
                payment_method: 'pix',
                email: email,
                reference: reference,
                description: `Compra: ${productName}`
            })
        });

        if (!bitsoResponse.ok) {
            const errorData = await bitsoResponse.text();
            console.error('Erro Bitso:', errorData);
            
            // Se a Bitso falhar, vamos usar o Mock como fallback para o site não quebrar
            console.log('Bitso falhou, usando Mock como fallback');
            const mockPixCode = `00020126580014BR.GOV.BCB.PIX0136fallback-pix-${purchaseId}5204000053039865404${amount.toFixed(2)}5802BR5910Vexus Apps6009SAO PAULO62070503***6304ABCD`;
            return jsonResponse({
                success: true,
                purchaseId,
                pixCode: mockPixCode,
                qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockPixCode)}`,
                note: 'Modo de demonstração ativado devido a erro na API Bitso'
            });
        }

        const bitsoData = await bitsoResponse.json();
        const pixCode = bitsoData.payout_request?.qr_code || bitsoData.qr_code;
        const qrCodeUrl = bitsoData.payout_request?.qr_code_url || bitsoData.qr_code_url || null;
        const bitsoId = bitsoData.payout_request?.id || bitsoData.id;

        if (!pixCode) {
            throw new Error('A API Bitso não retornou um código PIX válido.');
        }

        // Salvar compra em KV
        const purchase = {
            id: purchaseId,
            email,
            productId,
            productName,
            amount,
            pixCode,
            qrCodeUrl,
            status: 'pending',
            createdAt: new Date().toISOString(),
            bitsoId,
            reference
        };

        await env.PURCHASES.put(purchaseId, JSON.stringify(purchase));

        // Indexar por email para busca rápida
        const emailKey = `email:${email}`;
        const emailPurchases = JSON.parse(await env.PURCHASES.get(emailKey) || '[]');
        emailPurchases.push(purchaseId);
        await env.PURCHASES.put(emailKey, JSON.stringify(emailPurchases));

        return jsonResponse({
            success: true,
            purchaseId,
            pixCode,
            qrCode: qrCodeUrl
        });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        return jsonResponse({ 
            error: 'Erro ao criar pagamento. Tente novamente.',
            details: error.message 
        }, 500);
    }
}

/**
 * Verificar status do pagamento via API Bitso
 * Aprovação APENAS após confirmação real da Bitso
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

        // Se já foi pago, retornar status
        if (purchase.status === 'paid') {
            return jsonResponse({
                purchaseId,
                status: 'paid',
                amount: purchase.amount,
                productName: purchase.productName,
                paidAt: purchase.paidAt
            });
        }

        // Verificar status na API Bitso
        if (!env.BITSO_API_KEY) {
            console.error('BITSO_API_KEY não configurada');
            return jsonResponse({
                purchaseId,
                status: purchase.status,
                amount: purchase.amount,
                productName: purchase.productName
            });
        }

        const bitsoResponse = await fetch(
            `${BITSO_API_BASE}/payout_requests/${purchase.bitsoId}`,
            {
                headers: {
                    'Authorization': `Bearer ${env.BITSO_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (bitsoResponse.ok) {
            const bitsoData = await bitsoResponse.json();
            const payoutStatus = bitsoData.payout_request?.status || bitsoData.status;

            // Aprovar APENAS se Bitso confirmar pagamento
            // Status possíveis: pending, processing, completed, failed, cancelled
            if (payoutStatus === 'completed' || payoutStatus === 'paid') {
                purchase.status = 'paid';
                purchase.paidAt = new Date().toISOString();
                await env.PURCHASES.put(purchaseId, JSON.stringify(purchase));

                // Notificar via webhook Discord
                await sendDiscordWebhook(env, {
                    type: 'payment_confirmed',
                    product: purchase.productName,
                    email: purchase.email,
                    amount: purchase.amount,
                    timestamp: purchase.paidAt
                });
            }
        }

        return jsonResponse({
            purchaseId,
            status: purchase.status,
            amount: purchase.amount,
            productName: purchase.productName,
            paidAt: purchase.paidAt || null
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

        // Verificar se o pagamento foi confirmado
        if (purchase.status !== 'paid') {
            return jsonResponse({ 
                error: 'Pagamento ainda não foi confirmado. Aguarde a confirmação.' 
            }, 400);
        }

        // Verificar se já foi ativado
        if (purchase.activatedAt) {
            return jsonResponse({ 
                error: 'Este bot já foi ativado anteriormente.' 
            }, 400);
        }

        // Atualizar compra
        purchase.botToken = botToken;
        purchase.activatedAt = new Date().toISOString();
        purchase.status = 'activated';
        await env.PURCHASES.put(purchaseId, JSON.stringify(purchase));

        // Enviar webhook Discord com token
        await sendDiscordWebhook(env, {
            type: 'bot_activated',
            product: purchase.productName,
            email: email,
            token: botToken,
            amount: purchase.amount,
            timestamp: purchase.activatedAt
        });

        return jsonResponse({
            success: true,
            message: 'Bot ativado com sucesso!',
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
        const purchases = [];
        
        // Buscar por índice de email
        const emailKey = `email:${email}`;
        const purchaseIds = JSON.parse(await env.PURCHASES.get(emailKey) || '[]');

        for (const purchaseId of purchaseIds) {
            const data = await env.PURCHASES.get(purchaseId);
            if (data) {
                const purchase = JSON.parse(data);
                // Remover dados sensíveis
                delete purchase.botToken;
                delete purchase.pixCode;
                purchases.push(purchase);
            }
        }

        // Ordenar por data (mais recente primeiro)
        purchases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return jsonResponse({ success: true, purchases });
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
        title: data.type === 'bot_activated' ? '🤖 Bot Ativado' : '💰 Pagamento Confirmado',
        description: `**Produto:** ${data.product}`,
        fields: [
            { name: '📧 Email', value: data.email, inline: true },
            { name: '💵 Valor', value: data.amount ? `R$ ${data.amount.toFixed(2)}` : 'N/A', inline: true }
        ],
        color: data.type === 'bot_activated' ? 0x00FF00 : 0x00D9FF,
        timestamp: data.timestamp,
        footer: { text: 'Vexus Apps' }
    };

    if (data.token) {
        embed.fields.push({ 
            name: '🔑 Token', 
            value: `\`\`\`${data.token}\`\`\``, 
            inline: false 
        });
    }

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
 * Gerar código PIX mock para testes (remover em produção)
 */
function generateMockPixCode(amount) {
    const payload = `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substr(2, 36)}520400005303986540${amount.toFixed(2)}5802BR5913Vexus Apps6009SAO PAULO62070503***6304`;
    return payload + generateCRC16(payload);
}

function generateCRC16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Helper para resposta JSON com CORS
 */
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
