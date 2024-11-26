class SpeechService {
    constructor(config) {
        this.config = config;
        this.lastSpokenContent = '';
        this.isSpeaking = false;
        this.speakTimeout = null;
        this.audioCache = new Map();
        this.speechQueue = [];
        this.isProcessingQueue = false;
        this.totalCacheSize = 0;
        this.db = null;

        // Initialize IndexedDB
        this.initializeDB();

        // Listen for config changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync') {
                if (changes.apiKey) {
                    this.config.openai.apiKey = changes.apiKey.newValue;
                }
                if (changes.voice) {
                    this.config.openai.voice = changes.voice.newValue;
                }
            }
        });
    }

    async initializeDB() {
        try {
            const request = indexedDB.open('SpeechCache', 1);
            
            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('audioData')) {
                    const store = db.createObjectStore('audioData', { keyPath: 'text' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('size', 'size', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.loadCacheFromDB();
            };
        } catch (error) {
            console.error('Failed to initialize IndexedDB:', error);
        }
    }

    async loadCacheFromDB() {
        try {
            const transaction = this.db.transaction(['audioData'], 'readonly');
            const store = transaction.objectStore('audioData');
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result;
                this.totalCacheSize = 0;
                this.audioCache.clear();

                items.forEach(item => {
                    const audioUrl = URL.createObjectURL(item.blob);
                    this.audioCache.set(item.text, {
                        url: audioUrl,
                        size: item.size
                    });
                    this.totalCacheSize += item.size;
                });
            };
        } catch (error) {
            console.error('Failed to load cache from IndexedDB:', error);
        }
    }

    async speak(text, onSourceCallback) {
        if (this.speakTimeout) {
            clearTimeout(this.speakTimeout);
        }

        this.speechQueue.push({ text, onSourceCallback });
        if (!this.isProcessingQueue) {
            this.processSpeechQueue();
        }
    }

    async processSpeechQueue() {
        if (this.isProcessingQueue || this.speechQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        
        while (this.speechQueue.length > 0) {
            const { text, onSourceCallback } = this.speechQueue[0];
            
            try {
                if (this.isSpeaking) {
                    if (this.currentAudio) {
                        this.currentAudio.pause();
                        this.currentAudio.onended = null;
                        this.isSpeaking = false;
                    }
                }

                this.isSpeaking = true;
                let audioUrl;

                const isFromCache = this.audioCache.has(text);
                if (isFromCache) {
                    console.log('Using cached audio');
                    audioUrl = this.audioCache.get(text).url;
                } else {
                    console.log('Fetching new audio from API');
                    const response = await fetch(this.config.openai.endpoint, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.config.openai.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: this.config.openai.model,
                            voice: this.config.openai.voice,
                            input: text
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Speech generation failed');
                    }

                    const audioBlob = await response.blob();
                    audioUrl = await this.setAudioCache(text, audioBlob);
                }

                if (onSourceCallback) {
                    onSourceCallback(isFromCache);
                }

                const audio = new Audio(audioUrl);
                this.currentAudio = audio;
                
                audio.onended = () => {
                    this.isSpeaking = false;
                    this.lastSpokenContent = text;
                    this.currentAudio = null;
                    this.processSpeechQueue();
                };

                await audio.play();
                this.speechQueue.shift();

            } catch (error) {
                console.error('Text-to-speech error:', error);
                this.isSpeaking = false;
                this.currentAudio = null;
                this.speechQueue.shift();
            }
        }
        
        this.isProcessingQueue = false;
    }

    replay(text) {
        // Clear any existing speech and queue
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.onended = null;
            this.currentAudio = null;
        }
        this.isSpeaking = false;
        this.isProcessingQueue = false;
        this.speechQueue = []; // Clear the queue
        
        // Start fresh speech
        this.speak(text, (isFromCache) => {
            const display = document.getElementById(CONFIG.selectors.display);
            if (display) {
                const sourceIndicator = display.firstChild;
                sourceIndicator.textContent = isFromCache ? 
                    '🔄 Playing from cache' : 
                    '🌐 Fetching from OpenAI';
            }
        });
    }

    async getCacheSize() {
        return {
            entries: this.audioCache.size,
            totalSize: this.totalCacheSize,
        };
    }

    async setAudioCache(text, audioBlob) {
        try {
            const audioUrl = URL.createObjectURL(audioBlob);
            this.audioCache.set(text, {
                url: audioUrl,
                size: audioBlob.size
            });
            this.totalCacheSize += audioBlob.size;

            // Save to IndexedDB
            const transaction = this.db.transaction(['audioData'], 'readwrite');
            const store = transaction.objectStore('audioData');
            await store.put({
                text: text,
                blob: audioBlob,
                size: audioBlob.size,
                timestamp: Date.now()
            });

            return audioUrl;
        } catch (error) {
            console.error('Failed to save to IndexedDB:', error);
            throw error;
        }
    }

    async clearCache() {
        try {
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.onended = null;
                this.currentAudio = null;
            }
            this.isSpeaking = false;
            
            // Clear memory cache
            this.audioCache.forEach(({url}) => URL.revokeObjectURL(url));
            this.audioCache.clear();
            this.totalCacheSize = 0;

            // Clear IndexedDB
            const transaction = this.db.transaction(['audioData'], 'readwrite');
            const store = transaction.objectStore('audioData');
            await store.clear();
        } catch (error) {
            console.error('Failed to clear IndexedDB cache:', error);
            throw error;
        }
    }
}

window.SpeechService = SpeechService; 