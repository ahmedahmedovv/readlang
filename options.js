document.addEventListener('DOMContentLoaded', () => {
    const apiKeyManager = new ApiKeyManager('status', () => {
        setTimeout(() => {
            document.getElementById('status').textContent = '';
        }, 2000);
    });
    
    apiKeyManager.loadApiKey();
    document.getElementById('save').addEventListener('click', () => {
        apiKeyManager.saveApiKey();
    });
}); 