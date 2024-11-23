function containsIgnoredWords(text) {
    return CONFIG.ignoredWords.some(word => 
        text.toLowerCase().includes(word.toLowerCase())
    );
}

const speechService = new SpeechService(CONFIG);

// Add these cached selectors at the top
const domElements = {
    wordCard: null,
    context: null,
    display: null
};

// Cache DOM elements
function cacheDOMElements() {
    domElements.wordCard = document.querySelector(CONFIG.selectors.wordCard);
    domElements.context = document.querySelector(CONFIG.selectors.context);
    domElements.display = document.getElementById(CONFIG.selectors.display);
}

function showContextContent() {
    // Update cache
    cacheDOMElements();
    
    let combinedContent = '';
    
    if (domElements.wordCard) {
        const wordCardText = domElements.wordCard.textContent.trim();
        if (!containsIgnoredWords(wordCardText)) {
            combinedContent += wordCardText + CONFIG.textFormatting.sentenceEnd;
        }
    }
    
    if (domElements.context) {
        const contextText = domElements.context.textContent.trim();
        if (!containsIgnoredWords(contextText)) {
            combinedContent += contextText;
        }
    }
    
    // Only proceed if content changed
    if (combinedContent && (!domElements.display || domElements.display.children[1].textContent !== combinedContent)) {
        let display = document.getElementById(CONFIG.selectors.display);
        
        if (!display) {
            display = document.createElement('div');
            display.id = CONFIG.selectors.display;
            Object.assign(display.style, CONFIG.displayStyles);
            
            const sourceIndicator = document.createElement('div');
            sourceIndicator.style.fontSize = '12px';
            sourceIndicator.style.color = '#666';
            sourceIndicator.style.marginBottom = '5px';
            
            const speakButton = document.createElement('button');
            speakButton.textContent = CONFIG.speech.button.text;
            Object.assign(speakButton.style, {
                ...CONFIG.speech.button.styles,
                padding: '8px 16px',
                backgroundColor: '#1a73e8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            });
            
            speakButton.onclick = () => {
                const contentDiv = display.children[1];
                const currentContent = contentDiv.textContent;
                if (currentContent) {
                    speechService.replay(currentContent);
                }
            };
            
            display.appendChild(sourceIndicator);
            display.appendChild(document.createElement('div'));
            display.appendChild(speakButton);
            document.body.appendChild(display);
        }
        
        const contentDiv = display.children[1];
        if (contentDiv.textContent !== combinedContent) {
            contentDiv.textContent = combinedContent;
            
            const sourceIndicator = display.firstChild;
            speechService.speak(combinedContent, (isFromCache) => {
                sourceIndicator.textContent = isFromCache ? 
                    '🔄 Playing from cache' : 
                    '🌐 Fetching from OpenAI';
            });
        }
    }
}

showContextContent();

// Optimize the observer
const observer = new MutationObserver((mutations) => {
    // Use some() instead of for...of for better performance
    const shouldUpdate = mutations.some(mutation => {
        const target = mutation.target;
        return target.id === CONFIG.selectors.wordCard.slice(1) || 
               target.id === CONFIG.selectors.context.slice(1);
    });
    
    if (shouldUpdate) {
        showContextContent();
    }
});

// More specific observation
observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: false // Disable if not needed
});

// Add message listener at the bottom of the file
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'clearCache') {
        speechService.clearCache();
        sendResponse({success: true});
    } else if (request.action === 'getCacheSize') {
        speechService.getCacheSize().then(size => {
            sendResponse(size);
        });
        return true; // Required for async response
    }
    return true;
}); 