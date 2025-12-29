// Estado da aplicação
let currentPage = 'home';
let isLoginMode = true;
let currentProduct = null;
let paymentCheckInterval = null;
// Configuração da API - Detecta se está no domínio principal ou no Pages
const API_BASE = window.location.hostname.includes('pages.dev') 
    ? 'https://vexus-apps.z3roreign.workers.dev/api' // URL do seu Worker (ajuste se necessário)
    : window.location.origin + '/api';

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateUserDisplay();
    
    // Limpeza forçada de elementos legados (caso o HTML esteja em cache)
    const forceCleanup = () => {
        // Seletores variados para garantir a remoção
        const selectors = [
            'button[onclick*="confirmPayment"]',
            '#confirmPaymentBtn',
            '.confirm-btn'
        ];
        
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        // Remover qualquer botão que contenha o texto "Confirmar Pagamento"
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.trim().toLowerCase().includes('confirmar pagamento')) {
                btn.remove();
            }
        });
    };
    
    // Executar várias vezes para garantir (devido a renderizações assíncronas)
    forceCleanup();
    setTimeout(forceCleanup, 500);
    setTimeout(forceCleanup, 1000);
    setTimeout(forceCleanup, 2000);
    
    // Monitorar mudanças no DOM para garantir que o botão não reapareça
    const observer = new MutationObserver(() => {
        forceCleanup();
    });
    observer.observe(document.body, { childList: true, subtree: true });
});

// Navegação entre páginas
function showPage(page) {
    // Limpar intervalo de verificação se sair do checkout
    if (currentPage === 'checkout' && page !== 'checkout') {
        clearInterval(paymentCheckInterval);
    }

    // Ocultar todas as páginas
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Mostrar página selecionada
    document.getElementById(page).classList.add('active');
    currentPage = page;
    
    // Atualizar conteúdo específico
    if (page === 'purchases') {
        renderPurchases();
    }
}

// Renderizar produtos
function renderProducts() {
    const grid = document.getElementById('productsGrid');
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
        <button class="buy-btn" onclick="goToCheckout()">Comprar Agora</button>
    `;
}

// Ir para checkout
async function goToCheckout() {
    if (!currentProduct) return;
    
    const user = getCurrentUser();
    if (!user) {
        alert('Faça login primeiro');
        return;
    }

    try {
        // Criar pagamento via API
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

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || 'Erro ao criar pagamento');
            } catch (e) {
                throw new Error(errorText || 'Erro desconhecido ao criar pagamento');
            }
        }

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Resposta inválida do servidor: ' + responseText);
        }
        
        // Salvar ID da compra
        localStorage.setItem('current_purchase_id', data.purchaseId);

        document.getElementById('checkoutProduct').textContent = currentProduct.name;
        document.getElementById('checkoutPrice').textContent = `R$ ${currentProduct.price.toFixed(2)}`;
        document.getElementById('pixCode').value = data.pixCode;

        // Gerar QR Code
        if (data.qrCode) {
            generateQRCode(data.pixCode);
        }

        showPage('checkout');

        // Iniciar verificação automática de pagamento
        startPaymentCheck();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao criar pagamento: ' + error.message);
    }
}

// Iniciar verificação automática de pagamento
function startPaymentCheck() {
    // Verificar a cada 3 segundos para uma experiência mais rápida
    paymentCheckInterval = setInterval(async () => {
        const purchaseId = localStorage.getItem('current_purchase_id');
        if (!purchaseId) return;

        try {
            const response = await fetch(`${API_BASE}/payment/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ purchaseId })
            });

            if (!response.ok) return;

            const data = await response.json();

            if (data.status === 'paid') {
                // Pagamento recebido!
                clearInterval(paymentCheckInterval);
                
                const statusDiv = document.getElementById('paymentStatus');
                statusDiv.innerHTML = `
                    <div style="color: var(--success); font-size: 1.2rem; font-weight: bold;">
                        ✓ Pagamento Confirmado!
                    </div>
                    <p style="color: var(--text-secondary); margin-top: 1rem;">
                        Você pode ativar seu bot agora em "Meus Comprados"
                    </p>
                `;

                // Redirecionar após 3 segundos
                setTimeout(() => {
                    localStorage.removeItem('current_purchase_id');
                    showPage('purchases');
                }, 3000);
            }
        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
        }
    }, 3000);
}

// Gerar QR Code
function generateQRCode(pixCode) {
    const qrContainer = document.getElementById('qrCode');
    const encodedCode = encodeURIComponent(pixCode);
    qrContainer.innerHTML = `
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedCode}" alt="QR Code Pix" style="width: 200px; height: 200px; border-radius: 0.5rem;">
    `;
}

// Copiar código Pix
function copyPixCode() {
    const pixCode = document.getElementById('pixCode');
    pixCode.select();
    document.execCommand('copy');
    alert('Código Pix copiado!');
}

// Renderizar compras
async function renderPurchases() {
    const user = getCurrentUser();
    if (!user) {
        document.getElementById('purchasesList').innerHTML = '<p>Faça login para ver suas compras</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/purchases?email=${encodeURIComponent(user.email)}`);
        if (!response.ok) {
            throw new Error('Erro ao obter compras');
        }

        const data = await response.json();
        const purchases = data.purchases || [];

        if (purchases.length === 0) {
            document.getElementById('purchasesList').innerHTML = '<p>Você ainda não comprou nenhum bot</p>';
            return;
        }

        document.getElementById('purchasesList').innerHTML = purchases.map(purchase => `
            <div class="purchase-card">
                <h3>${purchase.productName}</h3>
                <span class="purchase-status ${purchase.status}">${getStatusLabel(purchase.status)}</span>
                <div class="purchase-info">
                    <p>Comprado em: ${new Date(purchase.createdAt).toLocaleString('pt-BR')}</p>
                    <p>Valor: R$ ${purchase.amount.toFixed(2)}</p>
                </div>
                <button class="activate-btn" onclick="goToActivation('${purchase.id}')" ${purchase.activatedAt ? 'disabled' : ''}>
                    ${purchase.activatedAt ? 'Já Ativado' : 'Ativar Bot'}
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('purchasesList').innerHTML = '<p>Erro ao carregar compras</p>';
    }
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Aguardando Pagamento',
        'paid': 'Pago',
        'activated': 'Ativado'
    };
    return labels[status] || status;
}

// Ir para ativação
function goToActivation(purchaseId) {
    document.getElementById('activationProductId').value = purchaseId;
    showPage('activation');
}

// Lidar com ativação
async function handleActivation(event) {
    event.preventDefault();
    
    const purchaseId = document.getElementById('activationProductId').value;
    const botToken = document.getElementById('botToken').value;
    const user = getCurrentUser();

    if (!botToken) {
        alert('Digite o token do bot');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/bot/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                purchaseId,
                botToken,
                email: user.email
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao ativar bot');
        }

        const data = await response.json();
        alert(data.message);
        showPage('purchases');
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro: ' + error.message);
    }
}

// Alternar modo de autenticação
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').textContent = isLoginMode ? 'Login' : 'Registrar';
    document.querySelector('.auth-toggle a').textContent = isLoginMode ? 'Registre-se' : 'Faça login';
}

// Lidar com autenticação
function handleAuth(event) {
    event.preventDefault();
    
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    if (!email || !password) {
        alert('Preencha todos os campos');
        return;
    }

    const users = getUsers();
    
    if (isLoginMode) {
        // Login
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            setCurrentUser(user.id);
            updateUserDisplay();
            showPage('home');
            document.getElementById('authForm').reset();
        } else {
            alert('Email ou senha incorretos');
        }
    } else {
        // Registrar
        if (users.find(u => u.email === email)) {
            alert('Email já registrado');
            return;
        }
        
        const newUser = {
            id: Date.now().toString(),
            email: email,
            password: password,
            createdAt: new Date().toLocaleString('pt-BR')
        };
        
        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser.id);
        updateUserDisplay();
        showPage('home');
        document.getElementById('authForm').reset();
    }
}

// Alternar autenticação
function toggleAuth() {
    const user = getCurrentUser();
    if (user) {
        clearCurrentUser();
        updateUserDisplay();
        showPage('home');
    } else {
        isLoginMode = true;
        document.getElementById('authTitle').textContent = 'Login';
        showPage('auth');
    }
}

// Funções de gerenciamento de usuário (LocalStorage)
function getUsers() {
    return JSON.parse(localStorage.getItem('vexus_users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('vexus_users', JSON.stringify(users));
}

function getCurrentUser() {
    const userId = localStorage.getItem('vexus_current_user');
    if (!userId) return null;
    const users = getUsers();
    return users.find(u => u.id === userId) || null;
}

function setCurrentUser(userId) {
    localStorage.setItem('vexus_current_user', userId);
}

function clearCurrentUser() {
    localStorage.removeItem('vexus_current_user');
}

// Atualizar exibição de usuário
function updateUserDisplay() {
    const user = getCurrentUser();
    const userDisplay = document.getElementById('userDisplay');
    const authBtn = document.getElementById('authBtn');
    
    if (user) {
        userDisplay.textContent = user.email.split('@')[0];
        authBtn.textContent = 'Sair';
    } else {
        userDisplay.textContent = 'Entrar';
        authBtn.textContent = 'Entrar';
    }
}
