document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings
    chrome.storage.sync.get({
        voice: 'alloy',
        position: 'top-left',
        apiKey: ''
    }, function(items) {
        document.getElementById('voice').value = items.voice;
        document.getElementById('position').value = items.position;
        document.getElementById('apiKey').value = items.apiKey;
    });

    // Save settings
    document.getElementById('save').addEventListener('click', function() {
        const voice = document.getElementById('voice').value;
        const apiKey = document.getElementById('apiKey').value;

        chrome.storage.sync.set({
            voice: voice,
            apiKey: apiKey
        }, function() {
            // Show save confirmation
            const button = document.getElementById('save');
            const originalText = button.textContent;
            button.textContent = 'Saved!';
            button.style.backgroundColor = '#34A853';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '#1a73e8';
            }, 1500);
        });
    });

    // Update cache size when popup opens
    updateCacheSize();

    // Update clear cache handler to refresh size display
    document.getElementById('clearCache').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'clearCache'}, function(response) {
                const button = document.getElementById('clearCache');
                const originalText = button.textContent;
                button.textContent = 'Cache Cleared!';
                
                // Update cache size display
                updateCacheSize();
                
                setTimeout(() => {
                    button.textContent = originalText;
                }, 1500);
            });
        });
    });
});

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateCacheSize() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getCacheSize'}, function(response) {
            if (response) {
                const sizeElement = document.getElementById('cacheSize');
                sizeElement.textContent = `Cache size: ${formatBytes(response.totalSize)} (${response.entries} items)`;
            }
        });
    });
} 