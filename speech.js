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
        this.db = new AudioDB();

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

        this.init();
    }

    async init() {
        await this.db.init();
        await this.loadAudioCache();
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
        
        // Start fresh speech without status indicator
        this.speak(text);
    }

    async clearCache() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.onended = null;
            this.currentAudio = null;
        }
        this.isSpeaking = false;
        this.audioCache.forEach(({url}) => URL.revokeObjectURL(url));
        this.audioCache.clear();
        this.totalCacheSize = 0;
        await this.db.clearAll();
    }

    async getCacheSize() {
        return {
            entries: this.audioCache.size,
            totalSize: this.totalCacheSize,
        };
    }

    async setAudioCache(text, audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        this.audioCache.set(text, {
            url: audioUrl,
            size: audioBlob.size
        });
        this.totalCacheSize += audioBlob.size;

        // Save to IndexedDB
        await this.db.saveAudio(text, audioBlob, {
            voice: this.config.openai.voice
        });

        return audioUrl;
    }

    async loadAudioCache() {
        const items = await this.db.getAllMetadata();
        for (const item of items) {
            const audioData = await this.db.getAudio(item.text);
            if (audioData) {
                const audioUrl = URL.createObjectURL(audioData.audio);
                this.audioCache.set(item.text, {
                    url: audioUrl,
                    size: item.size
                });
                this.totalCacheSize += item.size;
            }
        }
    }
}

window.SpeechService = SpeechService; 