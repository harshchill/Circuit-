// Chat functionality

let chatMessages = [];
let activeSession = false;

function initializeChat() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');
    
    if (!chatForm || !chatInput || !messagesContainer) {
        console.error('Chat elements not found in the DOM');
        return;
    }
    
    // Initialize empty chat
    renderChatMessages();
    
    // Add chat welcome message
    if (chatMessages.length === 0) {
        addBotMessage("Hey there! 👋 I'm your Gen Z study buddy. Upload some study materials and I'll help you crush that exam! What can I help you with today?", "Welcome");
    }
    
    // Handle form submission
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addUserMessage(message);
        
        // Clear input
        chatInput.value = '';
        
        // Get bot response
        getBotResponse(message);
    });
    
    // Enable/disable chat based on whether files have been uploaded
    document.addEventListener('filesUploaded', function(e) {
        const filesData = e.detail;
        if (filesData && filesData.length > 0) {
            enableChat();
        }
    });
}

function enableChat() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    
    if (chatForm) {
        chatForm.classList.remove('disabled');
    }
    
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = 'Ask me anything about your materials...';
    }
    
    activeSession = true;
    
    // Add a notification message
    addBotMessage("Sweet! I've got your study materials now. Ask me anything about them or how to prepare for your exam! 🔥", "Info");
}

function addUserMessage(message) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    chatMessages.push({
        text: message,
        sender: 'user',
        timestamp: timestamp
    });
    
    renderChatMessages();
    scrollChatToBottom();
}

function addBotMessage(message, type = "Response") {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Generate random Gen Z slang/meme to add occasionally
    const memeText = type === "Response" && Math.random() > 0.7 ? getRandomMeme() : null;
    
    chatMessages.push({
        text: message,
        sender: 'bot',
        timestamp: timestamp,
        memeText: memeText
    });
    
    renderChatMessages();
    scrollChatToBottom();
}

function getBotResponse(message) {
    // Add a loading indicator
    const loadingId = showLoadingIndicator();
    
    // Make request to the chat endpoint
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Remove loading indicator
        hideLoadingIndicator(loadingId);
        
        if (data.response) {
            addBotMessage(data.response);
        } else {
            addBotMessage("Oops! Something went wrong with my brain. Try asking something else!");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        hideLoadingIndicator(loadingId);
        addBotMessage("Yikes! I'm having technical difficulties. Give me a sec and try again! 🙈");
    });
}

function showLoadingIndicator() {
    const id = 'loading-' + Date.now();
    const loadingMessage = {
        id: id,
        sender: 'bot',
        loading: true
    };
    
    chatMessages.push(loadingMessage);
    renderChatMessages();
    scrollChatToBottom();
    
    return id;
}

function hideLoadingIndicator(id) {
    chatMessages = chatMessages.filter(msg => msg.id !== id);
    renderChatMessages();
}

function renderChatMessages() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';
    
    chatMessages.forEach(message => {
        if (message.loading) {
            // Render loading indicator
            const loadingElement = document.createElement('div');
            loadingElement.className = 'message message-bot';
            loadingElement.innerHTML = `
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
            messagesContainer.appendChild(loadingElement);
        } else {
            // Render regular message
            const messageElement = document.createElement('div');
            messageElement.className = `message message-${message.sender} animate-fade-in`;
            
            let messageContent = `<div>${message.text}</div>`;
            
            // Add meme text if available
            if (message.memeText) {
                messageContent += `<div class="meme-text">${message.memeText}</div>`;
            }
            
            // Add timestamp
            messageContent += `<div class="message-time">${message.timestamp}</div>`;
            
            messageElement.innerHTML = messageContent;
            messagesContainer.appendChild(messageElement);
        }
    });
}

function scrollChatToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function getRandomMeme() {
    const memes = [
        "NO CAP! 💯",
        "That's FIRE! 🔥",
        "IYKYK...",
        "Living rent-free in my head",
        "This is such a mood",
        "Based! 👑",
        "It's giving... knowledge",
        "Straight facts, no printer",
        "CEO of studying 📚",
        "Main character energy",
        "I'm deceased 💀",
        "Absolutely slaying this",
        "*chef's kiss*",
        "Vibing with this 🤌",
        "We stan education 👏"
    ];
    
    return memes[Math.floor(Math.random() * memes.length)];
}
