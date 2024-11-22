// Content management and logging
class ContentManager {
    static loggedContent = new Set();
    static loggedTexts = new Set();
    static globalCounter = 1;
    static audioElement = null;
    static currentlyPlaying = false;
    static processingContent = false;

    static hasContent(contentKey) {
        const hasKey = this.loggedContent.has(contentKey);
        console.log(`Checking content key: ${contentKey}, exists: ${hasKey}`);
        return hasKey;
    }

    static async processContent(text, xpath, xpathIndex) {
        if (this.processingContent) {
            console.log('Already processing content, skipping...');
            return;
        }

        try {
            this.processingContent = true;
            console.log('Processing content:', text);
            
            if (this.shouldSkipContent(text)) {
                console.log('Skipping invalid content');
                return;
            }

            const contentKey = `${xpath}:${text}`;
            if (this.loggedContent.has(contentKey) || this.loggedTexts.has(text)) {
                console.log('Content already logged, skipping:', contentKey);
                return;
            }

            this.logContent(text, xpath, xpathIndex);
            
            if (!this.currentlyPlaying) {
                await this.speakContent(text);
            } else {
                console.log('Audio already playing, skipping speech');
            }
        } finally {
            this.processingContent = false;
        }
    }

    static async speakContent(text) {
        if (this.currentlyPlaying) {
            console.log('Already playing audio, skipping');
            return;
        }

        console.log('Starting speech for:', text);
        this.currentlyPlaying = true;
        
        try {
            const audioUrl = await SpeechService.textToSpeech(text);
            if (audioUrl) {
                console.log('Got audio URL:', audioUrl);
                
                if (this.audioElement) {
                    this.audioElement.pause();
                    URL.revokeObjectURL(this.audioElement.src);
                }

                this.audioElement = new Audio(audioUrl);
                
                await new Promise((resolve, reject) => {
                    this.audioElement.addEventListener('ended', () => {
                        console.log('Audio playback completed');
                        resolve();
                    });
                    
                    this.audioElement.addEventListener('error', (e) => {
                        console.error('Audio playback error:', e);
                        reject(e);
                    });
                    
                    this.audioElement.play().catch(reject);
                });
                
                URL.revokeObjectURL(audioUrl);
            }
        } catch (error) {
            console.error('Error playing audio:', error);
        } finally {
            this.currentlyPlaying = false;
            console.log('Speech completed, ready for next content');
        }
    }

    static logContent(text, xpath, xpathIndex) {
        const contentKey = `${xpath}:${text}`;
        console.log(
            `[${this.globalCounter}] XPath ${xpathIndex + 1}: '${xpath}'`,
            '\nContent:', text,
            '\n-------------------'
        );
        this.loggedContent.add(contentKey);
        this.loggedTexts.add(text);
        this.globalCounter++;
    }

    static shouldSkipContent(text) {
        const should = !text || text.trim() === '' || text.includes('_');
        console.log('Should skip content:', should, 'Text:', text);
        return should;
    }

    static reset() {
        console.log('Resetting ContentManager');
        if (this.audioElement) {
            this.audioElement.pause();
            URL.revokeObjectURL(this.audioElement.src);
            this.audioElement = null;
        }
        this.currentlyPlaying = false;
        this.processingContent = false;
    }
} 