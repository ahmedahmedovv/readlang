// Speech service using OpenAI API
class SpeechService {
    static audioCache = new Map();
    static CACHE_META_KEY = 'audio_cache_meta';
    static MAX_CACHE_AGE_DAYS = 7; // Cache items expire after 7 days
    
    static async initializeCache() {
        console.log('Initializing audio cache...');
        try {
            // Get cache metadata
            const meta = await this.getCacheMeta();
            console.log(`Found ${Object.keys(meta).length} cached items`);

            // Clean expired items
            await this.cleanExpiredCache(meta);
            
            // Update cache size in UI if popup is open
            this.updateCacheUISize();
            
        } catch (error) {
            console.error('Cache initialization error:', error);
        }
    }

    static async getCacheMeta() {
        try {
            const result = await chrome.storage.local.get(this.CACHE_META_KEY);
            return result[this.CACHE_META_KEY] || {};
        } catch (error) {
            console.error('Error getting cache metadata:', error);
            return {};
        }
    }

    static async updateCacheMeta(key, data) {
        try {
            const meta = await this.getCacheMeta();
            meta[key] = {
                timestamp: Date.now(),
                size: data.length,
                ...data
            };
            await chrome.storage.local.set({ [this.CACHE_META_KEY]: meta });
        } catch (error) {
            console.error('Error updating cache metadata:', error);
        }
    }

    static async cleanExpiredCache(meta) {
        const now = Date.now();
        const maxAge = this.MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;
        const keysToRemove = [];

        for (const [key, data] of Object.entries(meta)) {
            if (now - data.timestamp > maxAge) {
                keysToRemove.push(key);
            }
        }

        if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
            const newMeta = { ...meta };
            keysToRemove.forEach(key => delete newMeta[key]);
            await chrome.storage.local.set({ [this.CACHE_META_KEY]: newMeta });
            console.log(`Cleaned ${keysToRemove.length} expired cache items`);
        }
    }

    static async updateCacheUISize() {
        console.group('📊 Cache Size Update');
        try {
            const items = await chrome.storage.local.get(null);
            const audioKeys = Object.keys(items).filter(key => key.startsWith('audio_'));
            
            // Calculate total size in bytes
            let totalSize = 0;
            for (const key of audioKeys) {
                if (items[key]) {
                    // Base64 string length to approximate byte size
                    totalSize += items[key].length * 0.75; // Convert base64 to approximate byte size
                }
            }

            console.log('Cache statistics:', {
                itemCount: audioKeys.length,
                totalSizeBytes: totalSize,
                keys: audioKeys
            });

            // Format size for display
            let sizeDisplay;
            if (totalSize > 1048576) { // 1 MB
                sizeDisplay = `${(totalSize / 1048576).toFixed(2)} MB`;
            } else if (totalSize > 1024) { // 1 KB
                sizeDisplay = `${(totalSize / 1024).toFixed(2)} KB`;
            } else {
                sizeDisplay = `${Math.round(totalSize)} bytes`;
            }

            // Send update to popup if it's open
            chrome.runtime.sendMessage({
                action: 'updateCacheSize',
                data: {
                    size: sizeDisplay,
                    count: audioKeys.length
                }
            }).catch(() => {
                // Ignore error if popup is closed
                console.log('Popup not available for update');
            });

            console.log('Cache size updated:', {
                display: sizeDisplay,
                items: audioKeys.length
            });

        } catch (error) {
            console.error('Error updating cache size:', error);
        }
        console.groupEnd();
    }

    static async textToSpeech(text) {
        console.group('🔊 Text-to-Speech Request');
        console.log('Processing text:', text);

        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(text);
            const cachedAudio = await this.getFromCache(cacheKey);
            
            if (cachedAudio) {
                console.log('📦 Using CACHED audio file');
                console.groupEnd();
                return cachedAudio;
            }

            // If not in cache, call API
            console.log('🌐 No cache found, calling OpenAI API...');
            
            const apiKey = await Config.getApiKey();
            if (!apiKey) {
                throw new Error('No API key configured');
            }

            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    voice: 'alloy',
                    input: text
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Cache the new audio
            await this.addToCache(cacheKey, audioBlob);
            
            console.log('🆕 NEW audio generated from OpenAI');
            console.groupEnd();
            return audioUrl;

        } catch (error) {
            console.error('❌ Text-to-speech error:', error);
            console.groupEnd();
            throw error;
        }
    }

    static async getFromCache(key) {
        try {
            const result = await chrome.storage.local.get(key);
            if (result[key]) {
                console.log('💾 Cache hit:', key);
                const blob = this.base64ToBlob(result[key]);
                return URL.createObjectURL(blob);
            }
            console.log('💭 Cache miss:', key);
        } catch (error) {
            console.error('❌ Cache retrieval error:', error);
        }
        return null;
    }

    static async addToCache(key, blob) {
        try {
            const base64 = await this.blobToBase64(blob);
            await chrome.storage.local.set({ [key]: base64 });
            console.log('✅ Added to cache:', key);
            await this.updateCacheUISize();
        } catch (error) {
            console.error('❌ Cache storage error:', error);
        }
    }

    static generateCacheKey(text) {
        // Create a consistent key for the text
        return `audio_${text.slice(0, 100)}`; // Limit key length
    }

    static async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    static base64ToBlob(base64) {
        const parts = base64.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        
        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        
        return new Blob([uInt8Array], { type: contentType });
    }

    static async clearCache() {
        try {
            const meta = await this.getCacheMeta();
            const keys = Object.keys(meta);
            await chrome.storage.local.remove([...keys, this.CACHE_META_KEY]);
            this.audioCache.clear();
            console.log('✅ Cache cleared successfully');
            await this.updateCacheUISize();
        } catch (error) {
            console.error('Cache clearing error:', error);
        }
    }
} 