const DEFAULT_CONFIG = {
    selectors: {
        wordCard: '#wordCardText',
        context: '#context',
        display: 'tts-status-display'
    },
    ignoredWords: [
        '_',
        'loading context',
        'no context',
        'xxx'
    ],
    speech: {
        debounceTime: 300
    },
    textFormatting: {
        sentenceEnd: '. \n'
    },
    displayStyles: {
        position: 'fixed',
        top: '10px',
        left: '10px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '4px',
        zIndex: '9999',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif'
    }
};

let CONFIG = DEFAULT_CONFIG;

chrome.storage.sync.get(['position'], function(items) {
    if (items.position) {
        updatePosition(items.position);
    }
});

function updatePosition(position) {
    switch(position) {
        case 'top-right':
            CONFIG.displayStyles.top = '10px';
            CONFIG.displayStyles.right = '10px';
            CONFIG.displayStyles.left = 'auto';
            CONFIG.displayStyles.bottom = 'auto';
            break;
        case 'bottom-left':
            CONFIG.displayStyles.bottom = '10px';
            CONFIG.displayStyles.left = '10px';
            CONFIG.displayStyles.top = 'auto';
            CONFIG.displayStyles.right = 'auto';
            break;
        case 'bottom-right':
            CONFIG.displayStyles.bottom = '10px';
            CONFIG.displayStyles.right = '10px';
            CONFIG.displayStyles.top = 'auto';
            CONFIG.displayStyles.left = 'auto';
            break;
        default: // top-left
            CONFIG.displayStyles.top = '10px';
            CONFIG.displayStyles.left = '10px';
            CONFIG.displayStyles.right = 'auto';
            CONFIG.displayStyles.bottom = 'auto';
    }
}

// Listen for settings changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync') {
        if (changes.position) {
            updatePosition(changes.position.newValue);
            // Update existing display if it exists
            const display = document.getElementById(CONFIG.selectors.display);
            if (display) {
                Object.assign(display.style, CONFIG.displayStyles);
            }
        }
    }
}); 