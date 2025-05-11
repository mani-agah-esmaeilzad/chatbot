document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const container = document.querySelector('.container'); // Get container
    const sidebar = document.querySelector('.sidebar'); // Get sidebar
    const themeSwitchButton = document.getElementById('theme-switch');
    const langSwitchButton = document.getElementById('lang-switch');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatArea = document.querySelector('.chat-area');
    const disclaimer = document.querySelector('.disclaimer');

    // --- Theme Switching ---
    const currentTheme = localStorage.getItem('theme') || 'dark-mode';
    body.className = currentTheme;
    updateThemeButtonIcon(currentTheme);

    themeSwitchButton.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light-mode' : 'dark-mode';
        body.className = newTheme; // Change class
        localStorage.setItem('theme', newTheme); // Save preference
        updateThemeButtonIcon(newTheme); // Update icon
        // Optional: Trigger a slight animation on the body or container
        // container.classList.add('theme-change-anim');
        // setTimeout(() => container.classList.remove('theme-change-anim'), 500); // Needs CSS animation
    });

    function updateThemeButtonIcon(theme) {
        const iconSpan = themeSwitchButton.querySelector('.icon');
        iconSpan.textContent = theme === 'dark-mode' ? '🌙' : '☀️';
    }


    // --- Language Switching ---
    let currentLang = localStorage.getItem('lang') || 'fa';
    applyLanguage(currentLang);

    langSwitchButton.addEventListener('click', () => {
        // Get the *next* language from the button's data attribute
        const nextLang = langSwitchButton.getAttribute('data-lang');
        applyLanguage(nextLang);
    });

    function applyLanguage(lang) {
        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'fa') ? 'rtl' : 'ltr';

        // Update button text and data-lang attribute for the *next* click
        if (lang === 'fa') {
            langSwitchButton.querySelector('.text').textContent = langSwitchButton.getAttribute('data-en'); // Show 'English'
            langSwitchButton.setAttribute('data-lang', 'en'); // Next click will switch to English
        } else { // lang === 'en'
            langSwitchButton.querySelector('.text').textContent = langSwitchButton.getAttribute('data-fa'); // Show 'فارسی'
            langSwitchButton.setAttribute('data-lang', 'fa'); // Next click will switch to Persian
        }

        // Update all elements with data-en and data-fa attributes
        document.querySelectorAll('[data-en], [data-fa]').forEach(element => {
            const text = element.getAttribute('data-' + lang);
            if (text) {
                 // Update text for elements that don't have internal spans (like new chat button icon)
                 if (element.classList.contains('new-chat-button') && element.querySelector('.text')) {
                     element.querySelector('.text').textContent = text;
                 } else if (element.tagName === 'BUTTON' && element.querySelector('.icon')) {
                    // Skip buttons with icons and text spans already handled
                 }
                 else {
                     // For other elements, just update textContent
                     element.textContent = text;
                 }
            }
        });

         // Update placeholders using the specific data attributes
        chatInput.placeholder = chatInput.getAttribute('data-' + lang + '-placeholder') || '';
        disclaimer.textContent = disclaimer.getAttribute('data-' + lang) || '';


        localStorage.setItem('lang', lang);

        // Optional: Re-render or update dynamic content if needed based on language
    }


    // --- Handling Sending Messages and AI Response ---

    let messageIndex = 0; // Counter for message animation delay

    function sendMessage() {
        const messageText = chatInput.value.trim();
        if (messageText === '') {
            return;
        }

        // Disable input and button
        chatInput.disabled = true;
        sendButton.disabled = true;
        sendButton.style.opacity = '0.8'; // Indicate disabled state visually
        sendButton.style.cursor = 'not-allowed';


        // Add user message
        addMessage(messageText, 'user');

        // Show typing indicator
        const typingIndicator = addTypingIndicator();

        // Simulate AI response
        simulateAiResponse(messageText, typingIndicator);

        // Clear and reset input
        chatInput.value = '';
        adjustTextareaHeight();
        scrollToBottom(); // Scroll immediately after sending user message
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        // Set CSS variable for animation delay
        messageDiv.style.setProperty('--message-index', ++messageIndex);


        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('message-avatar');
        // Use a simple letter or icon representation
        avatarDiv.textContent = (sender === 'user' ? 'You' : 'AI');


        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('message-bubble');
        bubbleDiv.textContent = text; // Use textContent for safety


        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleDiv);

        chatArea.appendChild(messageDiv);

        // Wait for the message element to be added to the DOM before potentially scrolling or animating
        // Using a small timeout allows the browser to render the element
         requestAnimationFrame(() => {
             scrollToBottom(); // Scroll after message is added and animation starts
         });

         return messageDiv; // Return the message element
    }

    function addTypingIndicator() {
         const typingDiv = document.createElement('div');
         typingDiv.classList.add('message', 'ai-message', 'typing-indicator');

         const avatarDiv = document.createElement('div');
         avatarDiv.classList.add('message-avatar');
         avatarDiv.textContent = 'AI'; // Basic AI avatar

         const bubbleDiv = document.createElement('div');
         bubbleDiv.classList.add('message-bubble');
         bubbleDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>'; // Dots for animation

         typingDiv.appendChild(avatarDiv);
         typingDiv.appendChild(bubbleDiv);
         chatArea.appendChild(typingDiv);

         scrollToBottom(); // Scroll to show indicator

         return typingDiv; // Return the indicator element
    }

    function removeTypingIndicator(indicatorElement) {
         if (indicatorElement && indicatorElement.parentElement) {
             indicatorElement.parentElement.removeChild(indicatorElement);
         }
    }


    function simulateAiResponse(userMessage, typingIndicator) {
        const responses_fa = [
             "بسیار عالی! چه کمکی می‌توانم انجام دهم؟",
             "متوجه شدم. در مورد این موضوع اطلاعات بیشتری می‌خواهید؟",
             "پاسخ شما: این یک پاسخ آزمایشی از Cofe Code است.",
             "سوال خوبی است! در حال پردازش هستم...",
             "فکر می‌کنم منظور شما را متوجه شدم. بگذارید توضیح دهم."
        ];
         const responses_en = [
            "Excellent! What can I help you with?",
            "Understood. Would you like more information on this topic?",
            "Here is your response: This is a test response from Cofe Code.",
            "That's a great question! Processing...",
            "I think I understand what you mean. Let me explain."
        ];

        const currentResponses = (document.documentElement.lang === 'fa') ? responses_fa : responses_en;
        const randomResponse = currentResponses[Math.floor(Math.random() * currentResponses.length)];

        // Simulate typing delay
        const typingTime = Math.max(1000, randomResponse.length * 40); // Longer response = longer typing

        setTimeout(() => {
            removeTypingIndicator(typingIndicator); // Remove indicator first

            // Reset message index counter for next message sequence
            messageIndex = 0; // Reset counter for the AI response itself

            addMessage(randomResponse, 'ai'); // Add the actual AI message

            // Re-enable input and button after response
            chatInput.disabled = false;
            sendButton.disabled = false;
            sendButton.style.opacity = ''; // Reset opacity
            sendButton.style.cursor = '';

            chatInput.focus(); // Put focus back on input
            scrollToBottom();

        }, typingTime); // Use calculated typing time
    }


    // --- Input Area Interactions ---

    sendButton.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    chatInput.addEventListener('input', adjustTextareaHeight);

    function adjustTextareaHeight() {
        // Allow a short delay to ensure content is rendered before calculating
         requestAnimationFrame(() => {
             chatInput.style.height = 'auto';
             chatInput.style.height = chatInput.scrollHeight + 'px';
             // Optional: Add max height check if needed
         });
    }

     // Scroll chat area to the bottom smoothly
    function scrollToBottom() {
        chatArea.scrollTo({
            top: chatArea.scrollHeight,
            behavior: 'smooth' // Smooth scroll
        });
    }

    // --- Sidebar Toggle (for mobile) ---
    // You need to add a button in HTML to trigger this
    // Example button: <button id="sidebar-toggle">☰</button>
    const sidebarToggleButton = document.getElementById('sidebar-toggle'); // Assume this button exists

    if (sidebarToggleButton) {
         sidebarToggleButton.addEventListener('click', () => {
             sidebar.classList.toggle('expanded');
             // You might also want to add an overlay on main-content when sidebar is expanded
             // to prevent interaction with chat area
         });
    }


    // --- Initial Setup ---
    // Wait for requestAnimationFrame to ensure initial layout is complete
     requestAnimationFrame(() => {
         adjustTextareaHeight(); // Adjust height on page load
         scrollToBottom(); // Scroll to bottom on page load (if any messages)
     });


});