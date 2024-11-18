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
});

function showStatus(message) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.style.display = 'inline';
    setTimeout(() => {
        status.style.display = 'none';
    }, 2000);
} 