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
    }
};

let CONFIG = DEFAULT_CONFIG;

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