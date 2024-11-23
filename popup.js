function createXPathInput(value = '') {
    const div = document.createElement('div');
    div.className = 'element-item';
    
    div.innerHTML = `
        <span class="xpath-number"></span>
        <input type="text" class="xpath-expression" value="${value}" 
               placeholder="Enter XPath expression">
        <i class="hi-pro hi-psychology test-xpath" title="Test XPath"></i>
        <i class="hi-pro hi-trash remove-element" title="Remove"></i>
    `;
    
    // Add remove handler
    div.querySelector('.remove-element').addEventListener('click', () => {
        div.remove();
        updateXPathNumbers();
    });
    
    // Add test handler
    div.querySelector('.test-xpath').addEventListener('click', () => {
        const xpath = div.querySelector('.xpath-expression').value;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "testXPath",
                    xpath: xpath
                });
            }
        });
    });
    
    updateXPathNumbers();
    return div;
}

// Function to update XPath numbers
function updateXPathNumbers() {
    const numbers = document.querySelectorAll('.xpath-number');
    numbers.forEach((span, index) => {
        span.textContent = `${index + 1}.`;
    });
}

// Save options
function saveOptions() {
    const xpathInputs = document.querySelectorAll('.xpath-expression');
    const xpathExpressions = Array.from(xpathInputs)
        .map(input => input.value.trim())
        .filter(xpath => xpath.length > 0);

    const ignoredWords = document.getElementById('ignoredWords')
        .value
        .split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0);

    chrome.storage.sync.set({
        xpathExpressions: xpathExpressions,
        ignoredWords: ignoredWords
    }, function() {
        const status = document.getElementById('status');
        status.style.display = 'inline';
        setTimeout(() => {
            status.style.display = 'none';
        }, 2000);
    });
}

// Restore options
function restoreOptions() {
    chrome.storage.sync.get({
        xpathExpressions: ['//*[@id="context"]'],
        ignoredWords: []
    }, function(items) {
        const elementList = document.getElementById('elementList');
        elementList.innerHTML = '';
        
        items.xpathExpressions.forEach(xpath => {
            elementList.appendChild(createXPathInput(xpath));
        });
        
        document.getElementById('ignoredWords').value = items.ignoredWords.join('\n');
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('addElement').addEventListener('click', () => {
    document.getElementById('elementList').appendChild(createXPathInput());
});

// Popup script for handling UI and storage
document.addEventListener('DOMContentLoaded', async () => {
    // Load saved API key
    const result = await chrome.storage.local.get(['openaiKey']);
    if (result.openaiKey) {
        document.getElementById('apiKey').value = result.openaiKey;
        console.log('Loaded saved API key');
    }

    // Save API key
    document.getElementById('saveKey').addEventListener('click', async () => {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (apiKey) {
            try {
                await chrome.storage.local.set({ openaiKey: apiKey });
                console.log('API key saved to storage');
                showStatus('API key saved successfully!');
                
                // Notify content script
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) {
                    chrome.tabs.sendMessage(tab.id, { 
                        action: 'updateApiKey', 
                        key: apiKey 
                    });
                }
            } catch (error) {
                console.error('Error saving API key:', error);
                showStatus('Error saving API key');
            }
        } else {
            showStatus('Please enter an API key');
        }
    });

    // Handle Enter key
    document.getElementById('apiKey').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('saveKey').click();
        }
    });

    // Update cache size display
    updateCacheSize();

    // Clear cache button handler
    document.getElementById('clearCache').addEventListener('click', async () => {
        await chrome.storage.local.get(null, async (items) => {
            const audioKeys = Object.keys(items).filter(key => key.startsWith('audio_'));
            await chrome.storage.local.remove(audioKeys);
            showStatus('Cache cleared successfully');
            updateCacheSize();
        });
    });

    // Initial cache size check
    await SpeechService.updateCacheUISize();

    try {
        const apiKey = await Config.getApiKey();
        if (!apiKey) {
            showStatus('Please configure your OpenAI API key', 'error');
            document.getElementById('apiKeyInput').focus();
        }
    } catch (error) {
        console.error('Error checking API key:', error);
    }
});

function showStatus(message) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.style.display = 'inline';
    setTimeout(() => {
        status.style.display = 'none';
    }, 2000);
}

async function updateCacheSize() {
    const items = await chrome.storage.local.get(null);
    const audioKeys = Object.keys(items).filter(key => key.startsWith('audio_'));
    const totalSize = audioKeys.reduce((size, key) => {
        return size + (items[key].length * 2); // Approximate size in bytes
    }, 0);
    
    const sizeDisplay = totalSize > 1048576 
        ? `${(totalSize / 1048576).toFixed(2)} MB` 
        : `${(totalSize / 1024).toFixed(2)} KB`;
    
    document.getElementById('cacheSize').textContent = 
        `Cache Size: ${sizeDisplay} (${audioKeys.length} items)`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateCacheSize') {
        const sizeDisplay = message.size > 1048576 
            ? `${(message.size / 1048576).toFixed(2)} MB` 
            : `${(message.size / 1024).toFixed(2)} KB`;
        
        document.getElementById('cacheSize').textContent = 
            `Cache Size: ${sizeDisplay} (${message.count} items)`;
    }
});

// Update the cache display in popup
function updateCacheDisplay(data) {
    const cacheElement = document.getElementById('cacheSize');
    if (cacheElement) {
        cacheElement.textContent = `Cache Size: ${data.size} (${data.count} items)`;
    }
}

// Listen for cache size updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateCacheSize' && message.data) {
        updateCacheDisplay(message.data);
    }
});

// Initialize cache display when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup opened, requesting cache size update');
    try {
        // Request initial cache size update
        await SpeechService.updateCacheUISize();
    } catch (error) {
        console.error('Error initializing cache display:', error);
        // Show error state in UI
        document.getElementById('cacheSize').textContent = 'Cache Size: Error loading';
    }
});

// Add clear cache functionality
document.getElementById('clearCache')?.addEventListener('click', async () => {
    console.log('Clearing cache...');
    try {
        await SpeechService.clearCache();
        // Update display after clearing
        await SpeechService.updateCacheUISize();
        showStatus('Cache cleared successfully');
    } catch (error) {
        console.error('Error clearing cache:', error);
        showStatus('Error clearing cache');
    }
}); 