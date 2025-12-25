// Estado da aplicação
let currentPage = 'home';
let isLoginMode = true;
let currentProduct = null;

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateUserDisplay();
});

// Navegação entre páginas
function showPage(page) {
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
function goToCheckout() {
    if (!currentProduct) return;
    
    document.getElementById('checkoutProduct').textContent = currentProduct.name;
    document.getElementById('checkoutPrice').textContent = `R$ ${currentProduct.price.toFixed(2)}`;
    
    // Gerar código Pix simulado
    const pixCode = generatePixCode(currentProduct.price);
    document.getElementById('pixCode').value = pixCode;
    
    // Gerar QR code simulado
    generateQRCode(pixCode);
    
    showPage('checkout');
}

// Gerar código Pix
function generatePixCode(amount) {
    // Simulação de código Pix (em produção, seria gerado pela API Bitso)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `00020126580014br.gov.bcb.pix0136${random}-${random}-${random}-${random}-${random}5204000053039865802BR5913VEXUS APPS6009SAO PAULO62410503***63047D3D`;
}

// Gerar QR Code
function generateQRCode(pixCode) {
    const qrContainer = document.getElementById('qrCode');
    // Usar API QR Code gratuita
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

// Confirmar pagamento
function confirmPayment() {
    if (!currentProduct) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    // Criar compra
    const purchase = {
        id: Date.now(),
        userId: user.id,
        productId: currentProduct.id,
        productName: currentProduct.name,
        price: currentProduct.price,
        date: new Date().toLocaleString('pt-BR'),
        status: 'active',
        activatedAt: null,
        botToken: null
    };
    
    const purchases = getPurchases();
    purchases.push(purchase);
    savePurchases(purchases);
    
    // Simular webhook Discord
    sendDiscordNotification(`Nova compra: ${user.email} comprou ${currentProduct.name} por R$ ${currentProduct.price.toFixed(2)}`);
    
    alert('Pagamento confirmado! Você pode ativar seu bot agora.');
    showPage('purchases');
}

// Enviar notificação Discord
function sendDiscordNotification(message) {
    // Em produção, isso seria feito via API
    console.log('Notificação Discord:', message);
}

// Renderizar compras
function renderPurchases() {
    const user = getCurrentUser();
    if (!user) {
        document.getElementById('purchasesList').innerHTML = '<p>Faça login para ver suas compras</p>';
        return;
    }
    
    const purchases = getPurchases().filter(p => p.userId === user.id);
    
    if (purchases.length === 0) {
        document.getElementById('purchasesList').innerHTML = '<p>Você ainda não comprou nenhum bot</p>';
        return;
    }
    
    document.getElementById('purchasesList').innerHTML = purchases.map(purchase => `
        <div class="purchase-card">
            <h3>${purchase.productName}</h3>
            <span class="purchase-status ${purchase.status}">${purchase.status === 'active' ? 'Ativo' : 'Aguardando'}</span>
            <div class="purchase-info">
                <p>Comprado em: ${purchase.date}</p>
                <p>Valor: R$ ${purchase.price.toFixed(2)}</p>
            </div>
            <button class="activate-btn" onclick="goToActivation(${purchase.id})" ${purchase.activatedAt ? 'disabled' : ''}>
                ${purchase.activatedAt ? 'Já Ativado' : 'Ativar Bot'}
            </button>
        </div>
    `).join('');
}

// Ir para ativação
function goToActivation(purchaseId) {
    document.getElementById('activationProductId').value = purchaseId;
    showPage('activation');
}

// Lidar com ativação
function handleActivation(event) {
    event.preventDefault();
    
    const purchaseId = document.getElementById('activationProductId').value;
    const botToken = document.getElementById('botToken').value;
    
    if (!botToken) {
        alert('Digite o token do bot');
        return;
    }
    
    // Atualizar compra
    const purchases = getPurchases();
    const purchase = purchases.find(p => p.id == purchaseId);
    
    if (purchase) {
        purchase.activatedAt = new Date().toLocaleString('pt-BR');
        purchase.botToken = botToken;
        savePurchases(purchases);
        
        // Enviar webhook Discord
        sendDiscordNotification(`Bot ativado: ${purchase.productName} - Token: ${botToken.substring(0, 10)}...`);
        
        // Bloquear por 24 horas
        const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        alert(`Bot ativado com sucesso! Você poderá ativar novamente em ${blockUntil.toLocaleString('pt-BR')}`);
        
        showPage('purchases');
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
