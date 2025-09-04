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
        'xxx',
        '?'
    ],
    speech: {
        debounceTime: 300
    },
    textFormatting: {
        sentenceEnd: '\n',
        cleanCharacters: ['.']
    }
};

let CONFIG = DEFAULT_CONFIG; 