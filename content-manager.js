// Content management and logging
class ContentManager {
    static audioElement = null;
    static currentlyPlaying = false;
    static processingContent = false;
    static recentlyProcessed = new Set(); // Store recently processed content
    static RECENT_TIMEOUT = 5000; // 5 seconds

    static shouldSkipContent(text) {
        // Check for invalid content conditions
        const skipConditions = {
            empty: !text || text.trim() === '',
            hasUnderscore: text.includes('_'),
            tooShort: text.trim().length < 2
        };

        console.log('🔍 Skip check:', {
            text: text,
            conditions: skipConditions,
            shouldSkip: Object.values(skipConditions).some(condition => condition)
        });

        return Object.values(skipConditions).some(condition => condition);
    }

    static async processContent(text, xpath, xpathIndex) {
        console.group('🎯 Content Processing');
        console.log('Processing text:', text);
        
        try {
            if (this.processingContent) {
                console.log('⏳ Already processing content, skipping...');
                return;
            }

            // Add underscore check here as well for extra safety
            if (this.shouldSkipContent(text)) {
                console.log('⏭️ Skipping content with underscore or invalid format');
                return;
            }

            this.processingContent = true;
            
            // Check if content was recently processed
            const contentKey = `${xpath}:${text}`;
            if (this.recentlyProcessed.has(contentKey)) {
                console.log('⏭️ Content recently processed, skipping');
                return;
            }

            // Add to recently processed and remove after timeout
            this.recentlyProcessed.add(contentKey);
            setTimeout(() => {
                this.recentlyProcessed.delete(contentKey);
            }, this.RECENT_TIMEOUT);

            console.log('🆕 Processing new content');
            
            if (!this.currentlyPlaying) {
                await this.speakContent(text);
            } else {
                console.log('🔊 Audio already playing, skipping');
            }
        } catch (error) {
            console.error('❌ Error processing content:', error);
        } finally {
            this.processingContent = false;
            console.groupEnd();
        }
    }

    static async speakContent(text) {
        console.group('🎵 Audio Playback');
        console.log('Text to speak:', text);
        
        if (this.currentlyPlaying) {
            console.log('⏳ Already playing audio, skipping');
            console.groupEnd();
            return;
        }

        this.currentlyPlaying = true;
        
        try {
            const audioUrl = await SpeechService.textToSpeech(text);
            if (audioUrl) {
                console.log('🎧 Starting audio playback');
                
                if (this.audioElement) {
                    this.audioElement.pause();
                    URL.revokeObjectURL(this.audioElement.src);
                }

                this.audioElement = new Audio(audioUrl);
                
                await new Promise((resolve, reject) => {
                    this.audioElement.addEventListener('play', () => {
                        console.log('▶️ Audio started playing');
                    });

                    this.audioElement.addEventListener('ended', () => {
                        console.log('✅ Audio playback completed');
                        resolve();
                    });
                    
                    this.audioElement.addEventListener('error', (e) => {
                        console.error('❌ Audio playback error:', e);
                        reject(e);
                    });
                    
                    const playPromise = this.audioElement.play();
                    if (playPromise) {
                        playPromise.catch(error => {
                            console.error('❌ Play error:', error);
                            reject(error);
                        });
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error playing audio:', error);
        } finally {
            this.currentlyPlaying = false;
            console.log('🔄 Ready for next content');
            console.groupEnd();
        }
    }

    static reset() {
        if (this.audioElement) {
            this.audioElement.pause();
            URL.revokeObjectURL(this.audioElement.src);
            this.audioElement = null;
        }
        this.currentlyPlaying = false;
        this.processingContent = false;
        this.recentlyProcessed.clear();
    }
} 