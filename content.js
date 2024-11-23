// Add this at the top of content.js
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add this helper function at the top of content.js
function getElementByXPath(xpath) {
    try {
        return document.evaluate(
            xpath,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
        );
    } catch (error) {
        console.error('XPath evaluation error:', error);
        return null;
    }
}

// Global state
let isInitialized = false;
let isProcessing = false;
let cachedXPaths = null;
let cachedIgnoredWords = [];

async function initializeExtension() {
    console.group('🚀 Extension Initialization');
    
    try {
        // First check for API key
        const apiKey = await Config.getApiKey();
        if (!apiKey) {
            console.warn('⚠️ No API key found - speech functionality will not work');
            return;
        }
        console.log('✅ API key found');

        // Load settings
        const settings = await chrome.storage.sync.get({
            xpathExpressions: ['//*[@id="context"]'],
            ignoredWords: []
        });

        // Cache settings
        cachedXPaths = settings.xpathExpressions;
        cachedIgnoredWords = settings.ignoredWords;

        // Initialize services
        await SpeechService.initializeCache();
        ContentManager.reset();

        // Set up observer
        setupMutationObserver();

        isInitialized = true;
        console.log('✅ Extension fully initialized');
        
        // Run initial scan
        findAndLogContext();

    } catch (error) {
        console.error('❌ Initialization error:', error);
    }
    
    console.groupEnd();
}

function setupMutationObserver() {
    const observer = new MutationObserver(debounce(() => {
        if (isInitialized) {
            findAndLogContext();
        }
    }, 500));

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('📡 Mutation observer setup complete');
}

// Initialize on document load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

// Re-initialize on extension update
chrome.runtime.onConnect.addListener(() => {
    initializeExtension();
});

async function findAndLogContext() {
    if (!cachedXPaths || isProcessing) {
        console.warn('🚫 Scan blocked:', {
            reason: !cachedXPaths ? 'No XPaths configured' : 'Already processing',
            cachedXPaths: cachedXPaths,
            isProcessing: isProcessing
        });
        return;
    }
    
    try {
        isProcessing = true;
        console.group('🔍 Content Scan');
        
        for (let xpathIndex = 0; xpathIndex < cachedXPaths.length; xpathIndex++) {
            const xpath = cachedXPaths[xpathIndex];
            console.group(`🔎 Processing XPath ${xpathIndex + 1}/${cachedXPaths.length}: ${xpath}`);
            
            const elements = getElementByXPath(xpath);
            
            if (!elements || elements.snapshotLength === 0) {
                console.log('No elements found for XPath:', xpath);
                console.groupEnd();
                continue;
            }
            
            console.log(`Found ${elements.snapshotLength} elements`);
            
            for (let i = 0; i < elements.snapshotLength; i++) {
                const element = elements.snapshotItem(i);
                const text = element.textContent.trim();
                
                console.group(`📄 Element ${i + 1}/${elements.snapshotLength}`);
                console.log('Text content:', text);
                
                if (!text || ContentManager.shouldSkipContent(text)) {
                    console.log('⏭️ Skipping invalid content');
                    console.groupEnd();
                    continue;
                }

                // Check ignored words
                if (cachedIgnoredWords.some(word => 
                    text.toLowerCase().includes(word.toLowerCase())
                )) {
                    console.log('⏭️ Skipping: Contains ignored word');
                    console.groupEnd();
                    continue;
                }

                try {
                    console.log('🎯 Processing content:', text);
                    await ContentManager.processContent(text, xpath, xpathIndex);
                    console.log('✅ Content processed successfully');
                } catch (error) {
                    console.error('❌ Error processing content:', error);
                }
                
                console.groupEnd(); // Element group
            }
            
            console.groupEnd(); // XPath group
        }
        
    } catch (error) {
        console.error('❌ Fatal error in content scan:', error);
    } finally {
        isProcessing = false;
        console.groupEnd();
    }
}