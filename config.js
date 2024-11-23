// Configuration and API key management
class Config {
    static #apiKey = null;
    static #initialized = false;

    static async initialize() {
        if (this.#initialized) return;
        
        try {
            const result = await chrome.storage.local.get(['openaiKey']);
            this.#apiKey = result.openaiKey;
            this.#initialized = true;
            console.log('Config initialized:', { hasApiKey: !!this.#apiKey });
        } catch (error) {
            console.error('Config initialization error:', error);
        }
    }

    static async getApiKey() {
        if (!this.#initialized) {
            await this.initialize();
        }
        return this.#apiKey;
    }

    static async setApiKey(key) {
        try {
            await chrome.storage.local.set({ openaiKey: key });
            this.#apiKey = key;
            console.log('API key updated successfully');
        } catch (error) {
            console.error('Error setting API key:', error);
            throw error;
        }
    }
} 