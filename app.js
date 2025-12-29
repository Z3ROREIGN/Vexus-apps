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
    
    // Limpeza forçada de elementos legados
    const forceCleanup = () => {
        const selectors = ['button[onclick*="confirmPayment"]'];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => el.remove());
        });
    };
    forceCleanup();
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
    
    document.getElementById('catalog').classList.add('hidden');
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
        // Mostrar loading
        const buyBtn = document.querySelector('.buy-btn');
        const originalText = buyBtn.innerText;
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
            throw new Error(`Erro do servidor (${response.status}): ${responseText || 'Resposta vazia'}`);
        }
        
        if (!response.ok || data.error) {
            throw new Error(data.error || `Erro ${response.status}`);
        }

        // Exibir checkout
        showCheckout(data);
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        alert('Erro ao criar pagamento: ' + error.message);
    } finally {
        const buyBtn = document.querySelector('.buy-btn');
        if (buyBtn) {
            buyBtn.innerText = 'Comprar Agora';
            buyBtn.disabled = false;
        }
    }
}

// Exibir tela de checkout
function showCheckout(paymentData) {
    const checkout = document.getElementById('checkout');
    const details = document.getElementById('productDetails');
    
    document.getElementById('pixCode').value = paymentData.pixCode;
    document.getElementById('qrCodeImg').src = paymentData.qrCode;
    
    details.classList.add('hidden');
    checkout.classList.remove('hidden');
    
    // Iniciar verificação automática
    startPaymentCheck(paymentData.paymentId);
}

// Verificar status do pagamento
function startPaymentCheck(paymentId) {
    if (paymentCheckInterval) clearInterval(paymentCheckInterval);
    
    paymentCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/payment/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId })
            });
            
            const data = await response.json();
            
            if (data.status === 'paid' || data.status === 'completed') {
                clearInterval(paymentCheckInterval);
                showSuccess();
            }
        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
        }
    }, 5000);
}

function showSuccess() {
    alert('Pagamento confirmado com sucesso! Seu bot já está disponível em "Meus Comprados".');
    location.reload();
}

function copyPix() {
    const pixCode = document.getElementById('pixCode');
    pixCode.select();
    document.execCommand('copy');
    alert('Código PIX copiado!');
}

// Gerenciamento de Usuários (LocalStorage)
function getUsers() {
    const users = localStorage.getItem('vexus_users');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('vexus_users', JSON.stringify(users));
}

function getCurrentUser() {
    const user = localStorage.getItem('vexus_current_user');
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('vexus_current_user', JSON.stringify(user));
}

// Autenticação
function showAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
}

function hideAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('authTitle');
    const btn = document.getElementById('authSubmitBtn');
    const toggleText = document.getElementById('authToggleText');
    
    if (isLoginMode) {
        title.innerText = 'Login';
        btn.innerText = 'Entrar';
        toggleText.innerHTML = 'Não tem conta? <a href="#" onclick="toggleAuthMode()">Registre-se</a>';
    } else {
        title.innerText = 'Registrar';
        btn.innerText = 'Registrar';
        toggleText.innerHTML = 'Já tem conta? <a href="#" onclick="toggleAuthMode()">Faça login</a>';
    }
}

async function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    if (!email || !password) {
        alert('Preencha todos os campos');
        return;
    }

    const users = getUsers();
    
    if (isLoginMode) {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            setCurrentUser(user);
            hideAuthModal();
            updateUserDisplay();
        } else {
            alert('Email ou senha incorretos');
        }
    } else {
        if (users.find(u => u.email === email)) {
            alert('Email já cadastrado');
            return;
        }
        
        const newUser = { email, password, purchases: [] };
        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser);
        hideAuthModal();
        updateUserDisplay();
    }
}

function updateUserDisplay() {
    const user = getCurrentUser();
    const authBtn = document.getElementById('authBtn');
    const userEmailSpan = document.getElementById('userEmail');
    
    if (user) {
        authBtn.innerText = 'Sair';
        authBtn.onclick = logout;
        if (userEmailSpan) userEmailSpan.innerText = user.email;
    } else {
        authBtn.innerText = 'Entrar';
        authBtn.onclick = showAuthModal;
        if (userEmailSpan) userEmailSpan.innerText = '';
    }
}

function logout() {
    localStorage.removeItem('vexus_current_user');
    location.reload();
}
