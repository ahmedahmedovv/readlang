// Speech service using OpenAI API
class SpeechService {
    static async textToSpeech(text) {
        const apiKey = await Config.getApiKey();
        console.log('API Key status:', apiKey ? 'available' : 'not available');
        
        if (!apiKey) {
            console.error('OpenAI API key not set. Please set your API key in the extension popup.');
            return null;
        }

        try {
            console.log('Making API request to OpenAI...');
            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    voice: 'alloy',
                    input: text
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', response.status, errorData);
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            console.log('Successfully received audio response');
            const audioBlob = await response.blob();
            return URL.createObjectURL(audioBlob);
        } catch (error) {
            console.error('Speech synthesis failed:', error);
            return null;
        }
    }
} 