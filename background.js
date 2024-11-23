chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed/updated');
    
    // Initialize default settings
    const defaults = {
        xpathExpressions: ['//*[@id="context"]'],
        ignoredWords: [],
        openaiKey: null
    };

    try {
        const stored = await chrome.storage.sync.get(defaults);
        await chrome.storage.sync.set(stored);
        console.log('Settings initialized:', stored);
    } catch (error) {
        console.error('Error initializing settings:', error);
    }
});

// Listen for content script connection
chrome.runtime.onConnect.addListener((port) => {
    console.log('Content script connected:', port.name);
    
    port.onDisconnect.addListener(() => {
        console.log('Content script disconnected:', port.name);
    });
}); 