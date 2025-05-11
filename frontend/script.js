// frontend/script.js

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const container = document.querySelector('.container');
    const sidebar = document.querySelector('.sidebar');
    const themeSwitchButton = document.getElementById('theme-switch');
    const langSwitchButton = document.getElementById('lang-switch');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatArea = document.querySelector('.chat-area');
    const disclaimer = document.querySelector('.disclaimer');
    const sidebarToggleButton = document.getElementById('sidebar-toggle');


    // --- API Configuration ---
    // IMPORTANT: Make sure your Node.js API is running on this address and port!
    const API_URL = 'http://localhost:3000/api/chat'; // Replace if your API is on a different address/port

    // --- Theme Switching ---
    const currentTheme = localStorage.getItem('theme') || 'dark-mode';
    body.className = currentTheme;
    updateThemeButtonIcon(currentTheme);

    themeSwitchButton.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light-mode' : 'dark-mode';
        body.className = newTheme;
        localStorage.setItem('theme', newTheme);
        updateThemeButtonIcon(newTheme);
    });

    function updateThemeButtonIcon(theme) {
        const iconSpan = themeSwitchButton.querySelector('.icon');
        iconSpan.textContent = theme === 'dark-mode' ? '🌙' : '☀️';
    }

    // --- Language Switching ---
    let currentLang = localStorage.getItem('lang') || 'fa';
    applyLanguage(currentLang);

    langSwitchButton.addEventListener('click', () => {
        const nextLang = langSwitchButton.getAttribute('data-lang');
        applyLanguage(nextLang);
    });

    function applyLanguage(lang) {
        document.documentElement.lang = lang;
        body.style.setProperty('--dir', lang === 'fa' ? 'rtl' : 'ltr');
        body.style.setProperty('--text-align', lang === 'fa' ? 'right' : 'left');

        if (lang === 'fa') {
            langSwitchButton.querySelector('.text').textContent = langSwitchButton.getAttribute('data-en');
            langSwitchButton.setAttribute('data-lang', 'en');
        } else {
            langSwitchButton.querySelector('.text').textContent = langSwitchButton.getAttribute('data-fa');
            langSwitchButton.setAttribute('data-lang', 'fa');
        }

        document.querySelectorAll('[data-en], [data-fa]').forEach(element => {
            const text = element.getAttribute('data-' + lang);
            if (text) {
                 if (element.classList.contains('new-chat-button') && element.querySelector('.text')) {
                     element.querySelector('.text').textContent = text;
                 } else if (element.tagName === 'BUTTON' && element.querySelector('.icon')) {
                    // Skip buttons with icons and text spans already handled
                 }
                 else {
                     element.textContent = text;
                 }
            }
        });

        chatInput.placeholder = chatInput.getAttribute('data-' + lang + '-placeholder') || '';
        disclaimer.textContent = disclaimer.getAttribute('data-' + lang) || '';

        if (sidebarToggleButton && sidebarToggleButton.hasAttribute('data-' + lang + '-text')) {
             sidebarToggleButton.textContent = sidebarToggleButton.getAttribute('data-' + lang + '-text');
        }


        localStorage.setItem('lang', lang);
    }


    // --- Handling Sending Messages and AI Response (API Connected) ---

    let messageIndex = 0;
    let typingIndicatorElement = null;

    async function sendMessage() {
        const messageText = chatInput.value.trim();
        if (messageText === '') {
            return;
        }

        chatInput.disabled = true;
        sendButton.disabled = true;
        sendButton.style.opacity = '0.8';
        sendButton.style.cursor = 'not-allowed';

        addMessage(messageText, 'user');

        chatInput.value = '';
        adjustTextareaHeight();

        scrollToBottom();

        typingIndicatorElement = addTypingIndicator();
        scrollToBottom();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: messageText }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error format' }));
                const errorMsg = errorData.error || response.statusText || `API Error: ${response.status}`;
                throw new Error(`API responded with status ${response.status}: ${errorMsg}`);
            }

            const data = await response.json();
            const aiResponseText = data.response;

            if (typeof aiResponseText !== 'string') {
                 throw new Error('Invalid response format from API: "response" field is missing or not a string.');
            }

            removeTypingIndicator(typingIndicatorElement);
            typingIndicatorElement = null;

            addMessage(aiResponseText, 'ai');

        } catch (error) {
            console.error('Error fetching response from API:', error);

            if (typingIndicatorElement) {
                 removeTypingIndicator(typingIndicatorElement);
                 typingIndicatorElement = null;
            }

            const errorPromptText = document.documentElement.lang === 'fa' ? 'خطا:' : 'Error:';
            addMessage(`${errorPromptText} ${error.message || 'An unknown error occurred.'}`, 'error');

        } finally {
            chatInput.disabled = false;
            sendButton.disabled = false;
            sendButton.style.opacity = '';
            sendButton.style.cursor = '';

            chatInput.focus();
            scrollToBottom();
        }
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        if(sender === 'error') {
             messageDiv.classList.add('error-message');
        }

        if(sender !== 'error') {
            messageIndex++;
            messageDiv.style.setProperty('--message-index', messageIndex);
        } else {
             messageIndex = 0;
        }


        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('message-avatar');
        avatarDiv.textContent = (sender === 'user' ? (document.documentElement.lang === 'fa' ? 'شما' : 'You') : (sender === 'ai' ? 'AI' : '!'));

        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('message-bubble');
        bubbleDiv.textContent = text;

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleDiv);

        chatArea.appendChild(messageDiv);

         return messageDiv;
    }

    function addTypingIndicator() {
         const typingDiv = document.createElement('div');
         typingDiv.classList.add('message', 'ai-message', 'typing-indicator');

         const avatarDiv = document.createElement('div');
         avatarDiv.classList.add('message-avatar');
         avatarDiv.textContent = 'AI';

         const bubbleDiv = document.createElement('div');
         bubbleDiv.classList.add('message-bubble');
         bubbleDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

         typingDiv.appendChild(avatarDiv);
         typingDiv.appendChild(bubbleDiv);
         chatArea.appendChild(typingDiv);

         scrollToBottom();

         return typingDiv;
    }

    function removeTypingIndicator(indicatorElement) {
         if (indicatorElement && chatArea.contains(indicatorElement)) {
             chatArea.removeChild(indicatorElement);
         }
    }

    sendButton.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    chatInput.addEventListener('input', adjustTextareaHeight);

    function adjustTextareaHeight() {
         requestAnimationFrame(() => {
             chatInput.style.height = 'auto';
             chatInput.style.height = chatInput.scrollHeight + 'px';
         });
    }

    function scrollToBottom() {
        chatArea.scrollTo({
            top: chatArea.scrollHeight,
            behavior: 'smooth'
        });
    }

    // --- Sidebar Toggle ---
    if (sidebarToggleButton) {
         sidebarToggleButton.addEventListener('click', () => {
             sidebar.classList.toggle('expanded');
         });
         applyLanguage(currentLang);
    }


    // --- Initial Setup ---
     requestAnimationFrame(() => {
         adjustTextareaHeight();
         scrollToBottom();
     });

     body.style.setProperty('--dir', currentLang === 'fa' ? 'rtl' : 'ltr');
     body.style.setProperty('--text-align', currentLang === 'fa' ? 'right' : 'left');

});