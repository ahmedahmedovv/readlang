class ApiKeyManager {
    constructor(statusElementId, onSaveCallback = null) {
        this.statusElement = document.getElementById(statusElementId);
        this.onSaveCallback = onSaveCallback;
    }

    loadApiKey() {
        chrome.storage.sync.get(['apiKey'], (result) => {
            if (result.apiKey) {
                document.getElementById('apiKey').value = result.apiKey;
            }
        });
    }

    showStatus(message, isError = false) {
        this.statusElement.textContent = message;
        this.statusElement.style.color = isError ? '#dc3545' : '#28a745';
    }

    saveApiKey() {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (!apiKey) {
            this.showStatus('Please enter an API key', true);
            return;
        }

        chrome.storage.sync.set({ apiKey }, () => {
            this.showStatus('API key saved!');
            if (this.onSaveCallback) {
                this.onSaveCallback();
            }
        });
    }
} 