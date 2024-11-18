// Configuration and API key management
class Config {
    static #apiKey = null;

    static async getApiKey() {
        if (!this.#apiKey) {
            return new Promise((resolve) => {
                chrome.storage.local.get(['openaiKey'], (result) => {
                    console.log('Getting API key from storage:', result.openaiKey ? 'found' : 'not found');
                    this.#apiKey = result.openaiKey;
                    resolve(this.#apiKey);
                });
            });
        }
        return this.#apiKey;
    }

    static async setApiKey(key) {
        console.log('Setting new API key');
        this.#apiKey = key;
        return new Promise((resolve) => {
            chrome.storage.local.set({ openaiKey: key }, () => {
                console.log('API key saved successfully');
                resolve();
            });
        });
    }
} 