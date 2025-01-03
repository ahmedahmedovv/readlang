document.addEventListener('click', function(event) {
    if (event.ctrlKey) {
        const text = event.target.textContent.trim();
        
        if (text) {
            chrome.runtime.sendMessage(
                { action: 'speak', text: text },
                response => {
                    if (response.audioData) {
                        const audio = new Audio(response.audioData);
                        audio.play().catch(error => {
                            console.error('Error playing audio:', error);
                        });
                    }
                }
            );
        }
    }
}); 