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

function createStatusDisplay() {
    const display = document.createElement('div');
    display.id = CONFIG.selectors.display;
    
    // Create replay button
    const replayButton = document.createElement('button');
    replayButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="rgb(86, 119, 144)">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
    `;
    
    // Style the button and container
    Object.assign(display.style, {
        position: 'absolute',
        top: '2px',
        left: '3px',
        zIndex: '9999'
    });
    
    Object.assign(replayButton.style, {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '20px',
        padding: '4px 8px',
        backgroundColor: 'transparent',
        borderRadius: '4px'
    });
    
    // Add hover effect
    replayButton.addEventListener('mouseover', () => {
        replayButton.querySelector('svg').setAttribute('fill', 'black');
    });
    
    replayButton.addEventListener('mouseout', () => {
        replayButton.querySelector('svg').setAttribute('fill', 'rgb(86, 119, 144)');
    });
    
    replayButton.title = 'Replay';
    
    // Add click handler
    replayButton.addEventListener('click', () => {
        const lastContent = speechService.lastSpokenContent;
        if (lastContent) {
            speechService.replay(lastContent);
        }
    });
    
    display.appendChild(replayButton);
    
    // Append to wordCard instead of body
    const wordCard = document.querySelector('#word.wordCard');
    if (wordCard) {
        wordCard.style.position = 'relative';
        wordCard.appendChild(display);
    }
    
    return display;
}

function showContextContent() {
    // Update cache
    cacheDOMElements();
    
    // Create or get status display
    if (!domElements.display) {
        domElements.display = createStatusDisplay();
    }
    
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
    
    // Only proceed if content exists and has changed
    if (combinedContent) {
        speechService.speak(combinedContent);
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