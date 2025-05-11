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
    // IMPORTANT: This is the n8n webhook URL.
    // Ensure your n8n workflow is set up to receive a POST request
    // with a JSON body like { "prompt": "your message" } and
    // respond with JSON containing a "response" field.
    const API_URL = 'https://cofe-code.duckdns.org/160cf466/webhook/caebaaaa-3b30-4ace-9970-b756538f81fb';

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
            // Using fetch to send a POST request to the n8n webhook URL
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Sending the message as a JSON body with a 'prompt' field
                body: JSON.stringify({ prompt: messageText }),
            });

            // The rest of this block is similar to your original fetch handling
            if (!response.ok) {
                // Attempt to read error details from the response body if available
                const errorDetails = await response.text().catch(() => 'No error details available');
                throw new Error(`API responded with status ${response.status}. Details: ${errorDetails.substring(0, 200)}...`); // Limit error message length
            }

            const data = await response.json();
            // Expecting the n8n workflow to return a JSON object with a 'response' field
            const aiResponseText = data.response;

            if (typeof aiResponseText !== 'string') {
                 // If the n8n response doesn't have the expected format
                 throw new Error('Invalid response format from n8n: "response" field is missing or not a string.');
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
            // Display a user-friendly error message
            addMessage(`${errorPromptText} ${error.message || 'An unknown error occurred while contacting the AI.'}`, 'error');

        } finally {
            // Re-enable input and button
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

        // Reset message index for errors, increment for regular messages
        if(sender !== 'error') {
            messageIndex++;
            messageDiv.style.setProperty('--message-index', messageIndex);
        } else {
             messageIndex = 0; // Or handle error messages differently if needed
        }


        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('message-avatar');
        avatarDiv.textContent = (sender === 'user' ? (document.documentElement.lang === 'fa' ? 'شما' : 'You') : (sender === 'ai' ? 'AI' : '!'));

        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('message-bubble');
        bubbleDiv.textContent = text; // Use textContent for security

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleDiv);

        chatArea.appendChild(messageDiv);

         return messageDiv;
    }

    function addTypingIndicator() {
         const typingDiv = document.createElement('div');
         typingDiv.classList.add('message', 'ai-message', 'typing-indicator'); // Added typing-indicator class

         const avatarDiv = document.createElement('div');
         avatarDiv.classList.add('message-avatar');
         avatarDiv.textContent = 'AI'; // Consistent avatar for typing

         const bubbleDiv = document.createElement('div');
         bubbleDiv.classList.add('message-bubble');
         // Simple animated dots for typing
         bubbleDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

         typingDiv.appendChild(avatarDiv);
         typingDiv.appendChild(bubbleDiv);
         chatArea.appendChild(typingDiv);

         scrollToBottom();

         return typingDiv; // Return the created element so it can be removed
    }

    function removeTypingIndicator(indicatorElement) {
         // Check if the element exists and is still in the DOM before trying to remove it
         if (indicatorElement && chatArea.contains(indicatorElement)) {
             chatArea.removeChild(indicatorElement);
         }
    }


    // --- Event Listeners ---
    sendButton.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent default newline
            sendMessage();
        }
    });

    chatInput.addEventListener('input', adjustTextareaHeight);

    // --- Helper Functions ---
    function adjustTextareaHeight() {
         // Use requestAnimationFrame for better performance
         requestAnimationFrame(() => {
             chatInput.style.height = 'auto'; // Reset height to get actual scroll height
             chatInput.style.height = chatInput.scrollHeight + 'px';
         });
    }

    function scrollToBottom() {
        // Use requestAnimationFrame and smooth behavior
         requestAnimationFrame(() => {
            chatArea.scrollTo({
                top: chatArea.scrollHeight,
                behavior: 'smooth'
            });
         });
    }

    // --- Sidebar Toggle ---
    if (sidebarToggleButton) {
         sidebarToggleButton.addEventListener('click', () => {
             sidebar.classList.toggle('expanded');
         });
         // Ensure language is applied to the toggle button on load
         applyLanguage(currentLang);
    }


    // --- Initial Setup ---
     // Apply initial adjustments after DOM is loaded
     requestAnimationFrame(() => {
         adjustTextareaHeight();
         scrollToBottom();
     });

     // Apply initial language settings
     body.style.setProperty('--dir', currentLang === 'fa' ? 'rtl' : 'ltr');
     body.style.setProperty('--text-align', currentLang === 'fa' ? 'right' : 'left');

});
