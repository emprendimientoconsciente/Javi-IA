// Estado de la aplicación
let currentUser = null;
let currentConversation = null;
let conversations = [];
let settings = {
    aiModel: 'gpt-3.5',
    temperature: 0.7,
    maxTokens: 1000,
    autoSave: true,
    theme: 'dark'
};

// Elementos del DOM
const loginPage = document.getElementById('loginPage');
const chatPage = document.getElementById('chatPage');
const loginForm = document.getElementById('loginForm');
const messageForm = document.getElementById('messageForm');
const messagesContainer = document.getElementById('messagesContainer');
const userNameSpan = document.getElementById('userName');
const userEmailSpan = document.getElementById('userEmail');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const charCount = document.getElementById('charCount');
const conversationsList = document.getElementById('conversationsList');
const currentChatTitle = document.getElementById('currentChatTitle');
const messageCount = document.getElementById('messageCount');
const sidebar = document.getElementById('sidebar');
const settingsModal = document.getElementById('settingsModal');

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);
loginForm.addEventListener('submit', handleLogin);
messageForm.addEventListener('submit', handleSendMessage);
messageInput.addEventListener('input', handleInputChange);
messageInput.addEventListener('keydown', handleKeyDown);

// Botones
document.getElementById('logoutBtn').addEventListener('click', handleLogout);
document.getElementById('newChatBtn').addEventListener('click', createNewConversation);
document.getElementById('clearChatBtn').addEventListener('click', clearCurrentChat);
document.getElementById('saveChatBtn').addEventListener('click', saveCurrentChat);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('exportBtn').addEventListener('click', exportConversations);
document.getElementById('settingsBtn').addEventListener('click', openSettings);
document.getElementById('closeSettings').addEventListener('click', closeSettings);
document.getElementById('saveSettings').addEventListener('click', saveSettings);
document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);

// Configuración de temperatura
document.getElementById('temperature').addEventListener('input', (e) => {
    document.getElementById('tempValue').textContent = e.target.value;
});

// Funciones principales
function initializeApp() {
    loadSettings();
    loadConversations();
    applyTheme();
    showLoginPage();
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const name = document.getElementById('nameInput').value || email.split('@')[0];
    
    if (email) {
        currentUser = { email, name };
        userNameSpan.textContent = name;
        userEmailSpan.textContent = email;
        showChatPage();
        createNewConversation();
    }
}

function handleLogout() {
    if (settings.autoSave) {
        saveConversations();
    }
    
    currentUser = null;
    currentConversation = null;
    conversations = [];
    
    // Limpiar formularios
    document.getElementById('emailInput').value = '';
    document.getElementById('nameInput').value = '';
    
    showLoginPage();
}

function handleSendMessage(e) {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (message && currentConversation) {
        // Agregar mensaje del usuario
        addMessage('user', message);
        messageInput.value = '';
        updateCharCount();
        updateSendButton();
        
        // Mostrar indicador de escritura
        showTypingIndicator();
        
        // Simular respuesta de la IA (más avanzada)
        setTimeout(() => {
            removeTypingIndicator();
            callRealAPI(message);
        }, 500);
    }
}

function handleInputChange() {
    updateCharCount();
    updateSendButton();
    autoResizeTextarea();
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
    }
}

function addMessage(role, content) {
    if (!currentConversation) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const messageContent = document.createElement('div');
    messageContent.textContent = content;
    messageDiv.appendChild(messageContent);
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString();
    messageDiv.appendChild(timeDiv);
    
    // Remover mensaje de bienvenida si existe
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    messagesContainer.appendChild(messageDiv);
    
    // Guardar mensaje en la conversación
    const messageObj = {
        role,
        content,
        timestamp: new Date().toISOString()
    };
    
    currentConversation.messages.push(messageObj);
    currentConversation.updatedAt = new Date().toISOString();
    
    // Actualizar título si es el primer mensaje del usuario
    if (role === 'user' && currentConversation.messages.filter(m => m.role === 'user').length === 1) {
        currentConversation.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
        updateConversationsList();
        updateChatHeader();
    }
    
    updateChatHeader();
    scrollToBottom();
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'message assistant typing';
    
    const dots = document.createElement('div');
    dots.innerHTML = 'IA está escribiendo<span class="typing-dots">...</span>';
    typingDiv.appendChild(dots);
    
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
    
    // Animación de puntos
    let dotCount = 0;
    const interval = setInterval(() => {
        const dotsSpan = typingDiv.querySelector('.typing-dots');
        if (dotsSpan) {
            dotCount = (dotCount + 1) % 4;
            dotsSpan.textContent = '.'.repeat(dotCount);
        } else {
            clearInterval(interval);
        }
    }, 500);
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function sendMessage(message) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
    
    const data = await response.json();
    return data.response;
}

async function callRealAPI(message) {
    try {
        const data = await sendMessage(message);
        
        // Extraer la respuesta del formato de Flowise
        let aiResponse = 'Lo siento, no pude procesar tu mensaje.';
        
        if (data && typeof data === 'string') {
            aiResponse = data;
        } else if (data && data.text) {
            aiResponse = data.text;
        } else if (data && data.answer) {
            aiResponse = data.answer;
        }
        
        addMessage('assistant', aiResponse);
        
        if (settings.autoSave) {
            saveConversations();
        }
        
    } catch (error) {
        console.error('Error calling API:', error);
        
        // Mensaje de error amigable para el usuario
        const errorMessage = 'Lo siento, hubo un problema al conectar con el servidor. Por favor, intenta de nuevo en unos momentos.';
        addMessage('assistant', errorMessage);
        
        if (settings.autoSave) {
            saveConversations();
        }
    }
}

function createNewConversation() {
    const conversation = {
        id: Date.now().toString(),
        title: 'Nueva Conversación',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    conversations.unshift(conversation);
    currentConversation = conversation;
    
    // Limpiar chat
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <i class="fas fa-robot"></i>
            </div>
            <h3>¡Nueva conversación iniciada!</h3>
            <p>¿En qué puedo ayudarte hoy?</p>
        </div>
    `;
    
    updateConversationsList();
    updateChatHeader();
    messageInput.focus();
}

function loadConversation(conversationId) {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    currentConversation = conversation;
    
    // Limpiar contenedor
    messagesContainer.innerHTML = '';
    
    if (conversation.messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <h3>¡Conversación cargada!</h3>
                <p>¿En qué puedo ayudarte?</p>
            </div>
        `;
    } else {
        // Cargar mensajes
        conversation.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.role}`;
            
            const messageContent = document.createElement('div');
            messageContent.textContent = msg.content;
            messageDiv.appendChild(messageContent);
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = new Date(msg.timestamp).toLocaleTimeString();
            messageDiv.appendChild(timeDiv);
            
            messagesContainer.appendChild(messageDiv);
        });
    }
    
    updateConversationsList();
    updateChatHeader();
    scrollToBottom();
}

function updateConversationsList() {
    conversationsList.innerHTML = '';
    
    conversations.forEach(conversation => {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        if (currentConversation && conversation.id === currentConversation.id) {
            item.classList.add('active');
        }
        
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        const preview = lastMessage ? lastMessage.content.substring(0, 50) + '...' : 'Sin mensajes';
        
        item.innerHTML = `
            <div class="conversation-title">${conversation.title}</div>
            <div class="conversation-preview">${preview}</div>
        `;
        
        item.addEventListener('click', () => loadConversation(conversation.id));
        conversationsList.appendChild(item);
    });
}

function updateChatHeader() {
    if (currentConversation) {
        currentChatTitle.textContent = currentConversation.title;
        messageCount.textContent = `${currentConversation.messages.length} mensajes`;
    }
}

function clearCurrentChat() {
    if (currentConversation && confirm('¿Estás seguro de que quieres limpiar esta conversación?')) {
        currentConversation.messages = [];
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <h3>¡Conversación limpiada!</h3>
                <p>¿En qué puedo ayudarte?</p>
            </div>
        `;
        updateChatHeader();
        updateConversationsList();
    }
}

function saveCurrentChat() {
    if (currentConversation && currentConversation.messages.length > 0) {
        saveConversations();
        
        // Mostrar confirmación
        const originalText = document.getElementById('saveChatBtn').innerHTML;
        document.getElementById('saveChatBtn').innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            document.getElementById('saveChatBtn').innerHTML = originalText;
        }, 1000);
    }
}

function toggleTheme() {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveSettings();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', settings.theme);
    const themeIcon = document.querySelector('#themeToggle i');
    themeIcon.className = settings.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function exportConversations() {
    if (conversations.length === 0) {
        alert('No hay conversaciones para exportar.');
        return;
    }
    
    const dataStr = JSON.stringify(conversations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `chat-conversations-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function openSettings() {
    // Cargar valores actuales
    document.getElementById('aiModel').value = settings.aiModel;
    document.getElementById('temperature').value = settings.temperature;
    document.getElementById('tempValue').textContent = settings.temperature;
    document.getElementById('maxTokens').value = settings.maxTokens;
    document.getElementById('autoSave').checked = settings.autoSave;
    
    settingsModal.classList.add('active');
}

function closeSettings() {
    settingsModal.classList.remove('active');
}

function saveSettings() {
    settings.aiModel = document.getElementById('aiModel').value;
    settings.temperature = parseFloat(document.getElementById('temperature').value);
    settings.maxTokens = parseInt(document.getElementById('maxTokens').value);
    settings.autoSave = document.getElementById('autoSave').checked;
    
    localStorage.setItem('chatSettings', JSON.stringify(settings));
    closeSettings();
}

function loadSettings() {
    const savedSettings = localStorage.getItem('chatSettings');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
    }
}

function saveConversations() {
    localStorage.setItem('chatConversations', JSON.stringify(conversations));
}

function loadConversations() {
    const savedConversations = localStorage.getItem('chatConversations');
    if (savedConversations) {
        conversations = JSON.parse(savedConversations);
    }
}

function toggleSidebar() {
    sidebar.classList.toggle('open');
}

function updateCharCount() {
    const count = messageInput.value.length;
    charCount.textContent = `${count}/2000`;
    
    if (count > 1800) {
        charCount.style.color = 'var(--warning-color)';
    } else if (count > 1900) {
        charCount.style.color = 'var(--danger-color)';
    } else {
        charCount.style.color = 'var(--text-muted)';
    }
}

function updateSendButton() {
    const hasText = messageInput.value.trim().length > 0;
    sendBtn.disabled = !hasText;
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showLoginPage() {
    loginPage.classList.add('active');
    chatPage.classList.remove('active');
}

function showChatPage() {
    loginPage.classList.remove('active');
    chatPage.classList.add('active');
    messageInput.focus();
}

// Cerrar modal al hacer clic fuera
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        closeSettings();
    }
});

// Cerrar sidebar en móvil al hacer clic fuera
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !document.getElementById('sidebarToggle').contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});