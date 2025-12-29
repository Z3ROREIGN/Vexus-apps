// app.js - Lógica Frontend para Vexus Apps
let currentPage = 'home';
let isLoginMode = true;
let currentProduct = null;
let paymentCheckInterval = null;

// Lista de Produtos (Recuperada do data.json)
const products = [
    {
      "id": 1,
      "name": "Ticket",
      "price": 4.00,
      "icon": "👥",
      "description": "Bot para gerenciamento de tickets de suporte. Automatize o atendimento ao cliente com sistema de tickets inteligente.",
      "features": [
        "Criação automática de tickets",
        "Categorização de problemas",
        "Atribuição de staff",
        "Histórico de conversas",
        "Notificações em tempo real"
      ]
    },
    {
      "id": 2,
      "name": "Vendas",
      "price": 5.00,
      "icon": "⚡",
      "description": "Bot para automação de vendas e conversão. Aumente suas vendas com chatbot inteligente e integração de pagamentos.",
      "features": [
        "Chatbot de vendas",
        "Integração de pagamentos",
        "Cupons e promoções",
        "Análise de conversão",
        "Sugestões de produtos"
      ]
    },
    {
      "id": 3,
      "name": "Manager",
      "price": 8.00,
      "icon": "⚙️",
      "description": "Bot para gerenciamento completo do servidor. Controle total com moderação, logs e automações avançadas.",
      "features": [
        "Moderação automática",
        "Sistema de logs",
        "Gerenciamento de roles",
        "Automação de eventos",
        "Análise de servidor"
      ]
    }
];

// Forçar URL absoluta do Worker para garantir funcionamento em qualquer domínio
const API_BASE = 'https://vexus-apps.z3roreign.workers.dev/api';

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateUserDisplay();
});

// Renderizar produtos do catálogo
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-icon">${product.icon}</div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">R$ ${product.price.toFixed(2)}</div>
            <button onclick="showDetails(${product.id})">Ver Detalhes</button>
        </div>
    `).join('');
}

// Mostrar detalhes do produto
function showDetails(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    currentProduct = product;
    const details = document.getElementById('productDetails');
    const catalog = document.getElementById('catalog');
    
    details.innerHTML = `
        <div class="details-content">
            <button class="back-btn" onclick="hideDetails()">← Voltar</button>
            <div class="product-header">
                <div class="product-icon-large">${product.icon}</div>
                <h2>${product.name}</h2>
            </div>
            <p class="product-desc-large">${product.description}</p>
            <div class="price-large">R$ ${product.price.toFixed(2)}</div>
            
            <div class="features-list">
                <h3>Recursos:</h3>
                <ul>
                    ${product.features.map(f => `<li>✓ ${f}</li>`).join('')}
                </ul>
            </div>
            
            <button class="buy-btn" onclick="startPurchase(${product.id})">Comprar Agora</button>
        </div>
    `;
    
    catalog.classList.add('hidden');
    details.classList.remove('hidden');
    window.scrollTo(0, 0);
}

function hideDetails() {
    document.getElementById('productDetails').classList.add('hidden');
    document.getElementById('catalog').classList.remove('hidden');
    currentProduct = null;
}

// Iniciar processo de compra
async function startPurchase(productId) {
    const product = products.find(p => p.id === productId);
    const user = getCurrentUser();
    
    if (!user) {
        showAuthModal();
        return;
    }

    try {
        const buyBtn = document.querySelector('.buy-btn');
        buyBtn.innerText = 'Processando...';
        buyBtn.disabled = true;

        const response = await fetch(`${API_BASE}/payment/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: product.price,
                email: user.email,
                productId: product.id,
                productName: product.name
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
    const checkout = document.getElementById('checkout');
    const details = document.getElementById('productDetails');
    
    document.getElementById('pixCode').value = paymentData.pixCode;
    document.getElementById('qrCodeImg').src = paymentData.qrCode;
    
    details.classList.add('hidden');
    checkout.classList.remove('hidden');
    
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
                location.reload();
            }
        } catch (e) {}
    }, 5000);
}

function copyPix() {
    const pixCode = document.getElementById('pixCode');
    pixCode.select();
    document.execCommand('copy');
    alert('Código PIX copiado!');
}

// Autenticação e Usuários
function getUsers() {
    return JSON.parse(localStorage.getItem('vexus_users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('vexus_users', JSON.stringify(users));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('vexus_current_user') || 'null');
}

function setCurrentUser(user) {
    localStorage.setItem('vexus_current_user', JSON.stringify(user));
}

function showAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
}

function hideAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? 'Login' : 'Registrar';
    document.getElementById('authSubmitBtn').innerText = isLoginMode ? 'Entrar' : 'Registrar';
}

async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    if (!email || !password) return alert('Preencha tudo');

    const users = getUsers();
    if (isLoginMode) {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            setCurrentUser(user);
            location.reload();
        } else alert('Dados incorretos');
    } else {
        if (users.find(u => u.email === email)) return alert('Email já existe');
        const newUser = { email, password, purchases: [] };
        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser);
        location.reload();
    }
}

function updateUserDisplay() {
    const user = getCurrentUser();
    const authBtn = document.getElementById('authBtn');
    if (user) {
        authBtn.innerText = 'Sair';
        authBtn.onclick = () => { localStorage.removeItem('vexus_current_user'); location.reload(); };
        document.getElementById('userEmail').innerText = user.email;
    } else {
        authBtn.innerText = 'Entrar';
        authBtn.onclick = showAuthModal;
    }
}
