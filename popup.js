document.addEventListener('DOMContentLoaded', () => {
    // Load existing API key
    chrome.storage.sync.get(['apiKey'], (result) => {
        if (result.apiKey) {
            document.getElementById('apiKey').value = result.apiKey;
        }
    });

    // Save API key
    document.getElementById('saveButton').addEventListener('click', () => {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (!apiKey) {
            document.getElementById('status').textContent = 'Please enter an API key';
            return;
        }

        chrome.storage.sync.set({ apiKey }, () => {
            document.getElementById('status').textContent = 'API key saved!';
            setTimeout(() => {
                window.close();
            }, 1500);
        });
    });
}); 