// app.js - Lógica Frontend para Vexus Apps
let currentPage = 'home';
let isLoginMode = true;
let currentProduct = null;
let paymentCheckInterval = null;

// Forçar URL absoluta do Worker para garantir funcionamento em qualquer domínio
const API_BASE = 'https://vexus-apps.z3roreign.workers.dev/api';

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateUserDisplay();
    showPage('home');
});

// Navegação entre páginas
function showPage(page) {
    // Limpar intervalo de verificação se sair do checkout
    if (currentPage === 'checkout' && page !== 'checkout') {
        if (paymentCheckInterval) clearInterval(paymentCheckInterval);
    }

    // Ocultar todas as páginas
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Mostrar página selecionada
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = page;
    }
    
    // Atualizar conteúdo específico
    if (page === 'purchases') {
        renderPurchases();
    }
    
    window.scrollTo(0, 0);
}

// Renderizar produtos do catálogo
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = DATA.products.map(product => `
        <div class="product-card" onclick="selectProduct(${product.id})">
            <div class="product-icon">${product.icon}</div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-price">R$ ${product.price.toFixed(2)}</div>
            <button class="product-btn" onclick="event.stopPropagation(); selectProduct(${product.id})">Ver Detalhes</button>
        </div>
    `).join('');
}

// Selecionar produto
function selectProduct(productId) {
    const user = getCurrentUser();
    if (!user) {
        alert('Faça login para comprar');
        showPage('auth');
        return;
    }
    
    currentProduct = DATA.products.find(p => p.id === productId);
    renderProductDetail();
    showPage('product-detail');
}

// Renderizar detalhes do produto
function renderProductDetail() {
    if (!currentProduct) return;
    
    const detail = document.getElementById('productDetail');
    detail.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">${currentProduct.icon}</div>
            <h2>${currentProduct.name}</h2>
        </div>
        <p>${currentProduct.description}</p>
        <div class="product-detail-price">R$ ${currentProduct.price.toFixed(2)}</div>
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Recursos:</h3>
        <ul style="margin-bottom: 2rem; color: var(--text-secondary);">
            ${currentProduct.features.map(f => `<li style="margin-bottom: 0.5rem;">✓ ${f}</li>`).join('')}
        </ul>
        <button class="buy-btn" onclick="startPurchase()">Comprar Agora</button>
    `;
}

// Iniciar processo de compra
async function startPurchase() {
    if (!currentProduct) return;
    const user = getCurrentUser();
    
    try {
        const buyBtn = document.querySelector('.buy-btn');
        const originalText = buyBtn.innerText;
        buyBtn.innerText = 'Processando...';
        buyBtn.disabled = true;

        const response = await fetch(`${API_BASE}/payment/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: currentProduct.price,
                email: user.email,
                productId: currentProduct.id,
                productName: currentProduct.name
            })
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Erro do servidor: ${responseText || 'Resposta vazia'}`);
        }
        
        if (!response.ok || data.error) {
            throw new Error(data.error || 'Erro ao criar pagamento');
        }

        showCheckout(data);
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message);
    } finally {
        const buyBtn = document.querySelector('.buy-btn');
        if (buyBtn) {
            buyBtn.innerText = 'Comprar Agora';
            buyBtn.disabled = false;
        }
    }
}

function showCheckout(paymentData) {
    document.getElementById('checkoutProduct').innerText = currentProduct.name;
    document.getElementById('checkoutPrice').innerText = `R$ ${currentProduct.price.toFixed(2)}`;
    document.getElementById('pixCode').value = paymentData.pixCode;
    
    const qrCodeContainer = document.getElementById('qrCode');
    qrCodeContainer.innerHTML = `<img src="${paymentData.qrCode}" alt="QR Code Pix" style="max-width: 250px; margin: 0 auto; display: block; border-radius: 10px;">`;
    
    showPage('checkout');
    startPaymentCheck(paymentData.purchaseId);
}

function startPaymentCheck(purchaseId) {
    if (paymentCheckInterval) clearInterval(paymentCheckInterval);
    paymentCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/payment/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ purchaseId })
            });
            const data = await response.json();
            if (data.status === 'paid' || data.status === 'completed') {
                clearInterval(paymentCheckInterval);
                alert('Pagamento confirmado!');
                
                // Adicionar aos comprados localmente para exibição imediata
                const purchases = getPurchases();
                purchases.push({
                    id: purchaseId,
                    productId: currentProduct.id,
                    productName: currentProduct.name,
                    date: new Date().toLocaleDateString(),
                    status: 'Ativo'
                });
                savePurchases(purchases);
                
                showPage('purchases');
            }
        } catch (e) {}
    }, 5000);
}

function copyPixCode() {
    const pixCode = document.getElementById('pixCode');
    pixCode.select();
    document.execCommand('copy');
    alert('Código PIX copiado!');
}

// Autenticação
function toggleAuth() {
    const user = getCurrentUser();
    if (user) {
        clearCurrentUser();
        location.reload();
    } else {
        showPage('auth');
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? 'Login' : 'Registrar';
    document.querySelector('#authForm button').innerText = isLoginMode ? 'Entrar' : 'Registrar';
    document.querySelector('.auth-toggle').innerHTML = isLoginMode ? 
        'Não tem conta? <a href="#" onclick="toggleAuthMode()">Registre-se</a>' : 
        'Já tem conta? <a href="#" onclick="toggleAuthMode()">Faça Login</a>';
}

async function handleAuth(event) {
    event.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    const users = getUsers();
    if (isLoginMode) {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            setCurrentUser(user.id);
            location.reload();
        } else {
            alert('Email ou senha incorretos');
        }
    } else {
        if (users.find(u => u.email === email)) {
            alert('Este email já está cadastrado');
            return;
        }
        const newUser = {
            id: 'user-' + Date.now(),
            email,
            password,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser.id);
        location.reload();
    }
}

function updateUserDisplay() {
    const user = getCurrentUser();
    const userDisplay = document.getElementById('userDisplay');
    const authBtn = document.getElementById('authBtn');
    
    if (user) {
        userDisplay.innerText = user.email;
        authBtn.innerText = 'Sair';
    } else {
        userDisplay.innerText = 'Visitante';
        authBtn.innerText = 'Entrar';
    }
}

// Meus Comprados
function renderPurchases() {
    const list = document.getElementById('purchasesList');
    const purchases = getPurchases();
    const user = getCurrentUser();
    
    if (!user) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Faça login para ver suas compras.</p>';
        return;
    }

    if (purchases.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Você ainda não possui bots comprados.</p>';
        return;
    }

    list.innerHTML = purchases.map(p => `
        <div class="purchase-card">
            <div class="purchase-info">
                <h3>${p.productName}</h3>
                <p>Comprado em: ${p.date}</p>
                <span class="status-badge">${p.status}</span>
            </div>
            <button class="activate-btn" onclick="goToActivation('${p.productId}')">Ativar Bot</button>
        </div>
    `).join('');
}

function goToActivation(productId) {
    document.getElementById('activationProductId').value = productId;
    showPage('activation');
}

async function handleActivation(event) {
    event.preventDefault();
    const productId = document.getElementById('activationProductId').value;
    const botToken = document.getElementById('botToken').value;
    const user = getCurrentUser();

    try {
        const submitBtn = event.target.querySelector('button');
        submitBtn.innerText = 'Processando...';
        submitBtn.disabled = true;

        const response = await fetch(`${API_BASE}/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId,
                botToken,
                userEmail: user.email
            })
        });

        if (response.ok) {
            alert('Solicitação de ativação enviada com sucesso! Verifique seu Discord.');
            showPage('purchases');
        } else {
            alert('Erro ao enviar ativação. Tente novamente.');
        }
    } catch (e) {
        alert('Erro de conexão.');
    } finally {
        const submitBtn = event.target.querySelector('button');
        submitBtn.innerText = 'Confirmar Ativação';
        submitBtn.disabled = false;
    }
}
