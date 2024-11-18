// Main content script
let cachedXPaths = null;
let cachedIgnoredWords = null;
let isProcessing = false;

function getElementByXPath(xpath) {
    try {
        return document.evaluate(
            xpath,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
        );
    } catch (e) {
        console.error('Invalid XPath:', xpath, e);
        return null;
    }
}

async function findAndLogContext() {
    if (!cachedXPaths || isProcessing) return;
    
    try {
        isProcessing = true;
        ContentManager.reset();
        
        for (let xpathIndex = 0; xpathIndex < cachedXPaths.length; xpathIndex++) {
            const xpath = cachedXPaths[xpathIndex];
            const elements = getElementByXPath(xpath);
            
            if (elements && elements.snapshotLength > 0) {
                for (let i = 0; i < elements.snapshotLength; i++) {
                    const element = elements.snapshotItem(i);
                    const text = element.textContent.trim();
                    
                    // Check if text should be skipped
                    if (ContentManager.shouldSkipContent(text)) continue;
                    
                    // Check ignored words
                    const shouldSkip = cachedIgnoredWords.some(word => 
                        text.toLowerCase().includes(word.toLowerCase())
                    );
                    
                    if (!shouldSkip) {
                        await ContentManager.processContent(text, xpath, xpathIndex);
                    }
                }
            }
        }
    } finally {
        isProcessing = false;
    }
}

// Initialize cache and start monitoring
console.log('Content script initialized');
chrome.storage.sync.get({
    xpathExpressions: ['//*[@id="context"]'],
    ignoredWords: [],
    openaiKey: null
}, function(data) {
    cachedXPaths = data.xpathExpressions;
    cachedIgnoredWords = data.ignoredWords;
    if (data.openaiKey) {
        Config.setApiKey(data.openaiKey);
    }
    // Initial check
    setTimeout(findAndLogContext, 500);
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        if (changes.xpathExpressions) {
            cachedXPaths = changes.xpathExpressions.newValue;
        }
        if (changes.ignoredWords) {
            cachedIgnoredWords = changes.ignoredWords.newValue;
        }
        if (changes.openaiKey) {
            Config.setApiKey(changes.openaiKey.newValue);
        }
        findAndLogContext();
    }
});

// Debounce function
let timeout = null;
const debouncedFindAndLog = () => {
    if (timeout) {
        clearTimeout(timeout);
    }
    timeout = setTimeout(findAndLogContext, 250);
};

// Create observer
const observer = new MutationObserver((mutations) => {
    if (!document.body.contains(mutations[0].target)) return;
    
    const hasRelevantChanges = mutations.some(mutation => 
        mutation.type === 'childList' || 
        (mutation.type === 'characterData' && 
         mutation.target.nodeType === Node.TEXT_NODE)
    );
    
    if (hasRelevantChanges) {
        debouncedFindAndLog();
    }
});

// Start observing after a short delay
setTimeout(() => {
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
    });
}, 1000);

// Add message listener for testing
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "testXPath") {
        const elements = getElementByXPath(request.xpath);
        if (elements && elements.snapshotLength > 0) {
            console.log(`Found ${elements.snapshotLength} elements with XPath '${request.xpath}':`);
            for (let i = 0; i < elements.snapshotLength; i++) {
                console.log(`Element ${i + 1}:`, elements.snapshotItem(i).textContent);
            }
        } else {
            console.log(`No elements found with XPath '${request.xpath}'`);
        }
    }
});

// Add this to your existing content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateApiKey') {
        console.log('Received new API key');
        Config.setApiKey(request.key);
    }
});

// Initialize API key on load
chrome.storage.local.get(['openaiKey'], function(result) {
    if (result.openaiKey) {
        console.log('Initializing with saved API key');
        Config.setApiKey(result.openaiKey);
    }
});

// ... rest of your existing content.js code ... 