chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'speak') {
    fetch(`https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(request.text)}`)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          sendResponse({ audioData: reader.result });
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error('Error fetching audio:', error);
        sendResponse({ error: error.message });
      });
    return true; // Required for async response
  }
}); 