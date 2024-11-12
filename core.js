// Debug helper
const Debug = {
    log: function(message, data = null) {
        console.log(`[Debug] ${message}`, data || '');
    }
};

// Config
const config = {
    apiKey: '',
    xpaths: [
        "/html/body/div[1]/div[3]/div/div/div[4]/div[1]/span",
        "/html/body/div/div[3]/div/div/div[2]/div"
    ]
};

class TTSService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.isPlaying = false;
        Debug.log('TTS Service initialized');
    }

    async speakText(text) {
        if (!text || text === '.') {
            Debug.log('Empty or invalid text, skipping');
            return;
        }

        try {
            if (this.isPlaying) {
                Debug.log('Already playing, waiting...');
                await new Promise(resolve => setTimeout(resolve, 500));
                return this.speakText(text);
            }

            Debug.log('Speaking text:', text);
            this.isPlaying = true;

            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    input: text,
                    voice: 'alloy'
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            return new Promise((resolve) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    this.isPlaying = false;
                    Debug.log('Audio completed');
                    resolve();
                };

                audio.onerror = (error) => {
                    Debug.log('Audio error:', error);
                    this.isPlaying = false;
                    resolve();
                };

                audio.play().catch(error => {
                    Debug.log('Playback error:', error);
                    this.isPlaying = false;
                    resolve();
                });
            });
        } catch (error) {
            Debug.log('TTS error:', error);
            this.isPlaying = false;
        }
    }
}

function getElementText(xpath) {
    const element = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;

    if (!element) {
        Debug.log(`No element found for xpath: ${xpath}`);
        return null;
    }

    const text = element.textContent?.trim();
    if (!text || text.toLowerCase().includes('loading') || text.includes('_')) {
        return null;
    }

    const lastSpoken = element.getAttribute('data-last-spoken');
    if (text === lastSpoken) {
        return null;
    }

    element.setAttribute('data-last-spoken', text);
    Debug.log(`Found new text for ${xpath}:`, text);
    return text;
}

async function checkAndSpeak() {
    const texts = config.xpaths
        .map(xpath => getElementText(xpath))
        .filter(text => text !== null);

    if (texts.length > 0) {
        Debug.log('Found texts to speak:', texts);
        for (const text of texts) {
            await window.ttsService.speakText(text);
        }
    }
}

// Initialize
chrome.storage.sync.get(['apiKey'], (result) => {
    if (result.apiKey) {
        window.ttsService = new TTSService(result.apiKey);
    } else {
        Debug.log('No API key found. Please set it in the extension options.');
    }
});

// Set up observer
const observer = new MutationObserver(() => {
    if (window.location.href.includes('readlang.com/flashcards')) {
        checkAndSpeak();
    }
});

// Start observing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        checkAndSpeak();
    });
} else {
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
    checkAndSpeak();
}