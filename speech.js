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
                    console.log('Fetching new audio from Google Translate');
                    const response = await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage(
                            { action: 'speak', text: text },
                            response => {
                                if (response.error) {
                                    reject(new Error(response.error));
                                } else {
                                    resolve(response);
                                }
                            }
                        );
                    });

                    if (!response.audioData) {
                        throw new Error('No audio data received');
                    }

                    // Convert base64 to blob
                    const byteString = atob(response.audioData.split(',')[1]);
                    const mimeString = response.audioData.split(',')[0].split(':')[1].split(';')[0];
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    const audioBlob = new Blob([ab], { type: mimeString });
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

        // Save to IndexedDB with simplified metadata
        await this.db.saveAudio(text, audioBlob, {
            timestamp: Date.now()
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