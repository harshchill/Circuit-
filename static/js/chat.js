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
        addBotMessage("Kya scene hai bro! 👋 Main hun aapka study buddy yaar. Kuch notes upload karo aur main tumhe exam crack karne mein help karunga! Bolo kya chahiye aaj? 🔥", "Welcome");
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
    addBotMessage("Mast! Tumhare saare notes mere paas aa gaye hain ab. Kuch bhi poocho inke baare mein ya exam ki taiyari ke liye tips chahiye to batao! 🔥", "Info");
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
            addBotMessage("Arrey bhai! Mere dimaag mein kuch gadbad ho gayi. Kuch aur poocho na! 😅");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        hideLoadingIndicator(loadingId);
        addBotMessage("Oho! Technical lafda ho gaya hai! Ek second ruko aur dobara try karo yaar! 🙈");
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
            
            // Create message content div
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            // Format text with proper line breaks and emoji support
            const formattedText = formatChatText(message.text);
            contentDiv.innerHTML = formattedText;
            
            // Append content to message element
            messageElement.appendChild(contentDiv);
            
            // Add meme text if available
            if (message.memeText) {
                const memeDiv = document.createElement('div');
                memeDiv.className = 'meme-text';
                memeDiv.textContent = message.memeText;
                messageElement.appendChild(memeDiv);
            }
            
            // Add timestamp
            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = message.timestamp;
            messageElement.appendChild(timeDiv);
            
            messagesContainer.appendChild(messageElement);
        }
    });
}

// Function to properly format chat text with line breaks and emojis
function formatChatText(text) {
    if (!text) return '';
    
    // First process any bullet point lists
    const lines = text.split('\n');
    let inList = false;
    let formatted = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for bullet points (- * •)
        if (line.trim().match(/^[-*•][ \t]+/)) {
            // If this is the first bullet point, start a list
            if (!inList) {
                formatted += '<ul class="chat-list">';
                inList = true;
            }
            
            // Add the bullet point as a list item, removing the bullet character
            const listContent = line.trim().replace(/^[-*•][ \t]+/, '');
            formatted += `<li>${listContent}</li>`;
        } else {
            // If we were in a list and now we're not, close the list
            if (inList) {
                formatted += '</ul>';
                inList = false;
            }
            
            // Add the regular line
            formatted += line + '\n';
        }
    }
    
    // Close any open list at the end
    if (inList) {
        formatted += '</ul>';
    }
    
    // Replace line breaks with <br> tags (but not inside lists)
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Replace markdown-style bold with HTML bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace markdown-style italic with HTML italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Add support for Hinglish words/phrases by highlighting them
    const hinglishPatterns = [
        /\b(yaar|bhai|matlab|samjhe|haina|ekdum|scene|vibe)\b/gi,
        /\b(samajh gaye|bilkul|mast|solid hai|full faadu)\b/gi
    ];
    
    hinglishPatterns.forEach(pattern => {
        formatted = formatted.replace(pattern, match => {
            return `<span class="hinglish-highlight">${match}</span>`;
        });
    });
    
    return formatted;
}

function scrollChatToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function getRandomMeme() {
    const memes = [
        "Ekdum Sahi Hai! 💯",
        "Full Faadu! 🔥",
        "IYKYK...",
        "Dimaag mein rent-free chal raha hai",
        "Bilkul mood hai yeh",
        "Solid hai! 👑",
        "Ye hai... knowledge ki baarish",
        "Seedhi baat, no bakwaas",
        "Padhai ka CEO 📚",
        "Main character energy",
        "Mai toh dead ho gaya 💀",
        "Full-on slay kar raha hai",
        "*chef's kiss*",
        "Iss vibe se connect ho raha hoon 🤌",
        "Education ki jai ho 👏",
        "Dil se OP! ❤️",
        "Ye toh mast hai boss! 👌",
        "Samajh gaye na? 😏",
        "Tension not, apun hai na!",
        "Kya baat, kya baat! 🙌",
        "Filmy ho gaya bhai! 🎬",
        "Dimaag ke taale khul gaye 🔓",
        "Dekh ke maja aa gaya 🤩"
    ];
    
    return memes[Math.floor(Math.random() * memes.length)];
}
