// Dados da aplicação (simulado com localStorage)
const DATA = {
    products: [
        {
            id: 1,
            name: "Ticket",
            price: 4.00,
            icon: "👥",
            description: "Bot para gerenciamento de tickets de suporte. Automatize o atendimento ao cliente com sistema de tickets inteligente.",
            features: [
                "Criação automática de tickets",
                "Categorização de problemas",
                "Atribuição de staff",
                "Histórico de conversas",
                "Notificações em tempo real"
            ]
        },
        {
            id: 2,
            name: "Vendas",
            price: 5.00,
            icon: "⚡",
            description: "Bot para automação de vendas e conversão. Aumente suas vendas com chatbot inteligente e integração de pagamentos.",
            features: [
                "Chatbot de vendas",
                "Integração de pagamentos",
                "Cupons e promoções",
                "Análise de conversão",
                "Sugestões de produtos"
            ]
        },
        {
            id: 3,
            name: "Manager",
            price: 8.00,
            icon: "⚙️",
            description: "Bot para gerenciamento completo do servidor. Controle total com moderação, logs e automações avançadas.",
            features: [
                "Moderação automática",
                "Sistema de logs",
                "Gerenciamento de roles",
                "Automação de eventos",
                "Análise de servidor"
            ]
        }
    ]
};

// LocalStorage helpers
function getUsers() {
    return JSON.parse(localStorage.getItem('vexus_users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('vexus_users', JSON.stringify(users));
}

function getPurchases() {
    return JSON.parse(localStorage.getItem('vexus_purchases') || '[]');
}

function savePurchases(purchases) {
    localStorage.setItem('vexus_purchases', JSON.stringify(purchases));
}

function getActivations() {
    return JSON.parse(localStorage.getItem('vexus_activations') || '[]');
}

function saveActivations(activations) {
    localStorage.setItem('vexus_activations', JSON.stringify(activations));
}

function getCurrentUser() {
    const userId = localStorage.getItem('vexus_current_user');
    if (!userId) return null;
    const users = getUsers();
    return users.find(u => u.id === userId);
}

function setCurrentUser(userId) {
    localStorage.setItem('vexus_current_user', userId);
}

function clearCurrentUser() {
    localStorage.removeItem('vexus_current_user');
}
