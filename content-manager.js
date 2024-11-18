// Content management and logging
class ContentManager {
    static loggedContent = new Set();
    static loggedTexts = new Set();
    static globalCounter = 1;
    static audioElement = null;

    static async processContent(text, xpath, xpathIndex) {
        console.log('Processing content:', text); // Debug log
        
        if (this.shouldSkipContent(text)) {
            console.log('Skipping invalid content'); // Debug log
            return;
        }

        const contentKey = `${xpath}:${text}`;
        if (this.loggedContent.has(contentKey) || this.loggedTexts.has(text)) {
            console.log('Content already logged'); // Debug log
            return;
        }

        this.logContent(text, xpath, xpathIndex);
        await this.speakContent(text);
    }

    static shouldSkipContent(text) {
        const should = !text || text.trim() === '' || text.includes('_');
        console.log('Should skip content:', should); // Debug log
        return should;
    }

    static async speakContent(text) {
        console.log('Attempting to speak:', text); // Debug log
        const audioUrl = await SpeechService.textToSpeech(text);
        if (audioUrl) {
            console.log('Got audio URL:', audioUrl); // Debug log
            if (this.audioElement) {
                this.audioElement.pause();
                URL.revokeObjectURL(this.audioElement.src);
            }

            this.audioElement = new Audio(audioUrl);
            try {
                await this.audioElement.play();
                console.log('Audio playing'); // Debug log
            } catch (error) {
                console.error('Error playing audio:', error);
            }
        }
    }

    static logContent(text, xpath, xpathIndex) {
        console.log(
            `[${this.globalCounter}] XPath ${xpathIndex + 1}: '${xpath}'`,
            '\nContent:', text,
            '\n-------------------'
        );
        this.loggedContent.add(`${xpath}:${text}`);
        this.loggedTexts.add(text);
        this.globalCounter++;
    }

    static reset() {
        console.log('Resetting ContentManager'); // Debug log
        this.loggedContent.clear();
        this.loggedTexts.clear();
        this.globalCounter = 1;
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
    }
} 