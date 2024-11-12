document.addEventListener('DOMContentLoaded', () => {
    const apiKeyManager = new ApiKeyManager('status', () => {
        setTimeout(() => window.close(), 1500);
    });
    
    apiKeyManager.loadApiKey();
    document.getElementById('saveButton').addEventListener('click', () => {
        apiKeyManager.saveApiKey();
    });
}); 