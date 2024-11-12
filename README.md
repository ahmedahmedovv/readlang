# Readlang Card and ContextSpeaker Chrome Extension

A Chrome extension that automatically reads text content from Readlang flashcards using OpenAI's Text-to-Speech API.

## Features

- Automatically detects and reads text from Readlang flashcards
- Uses OpenAI's high-quality TTS-1 model for natural-sounding speech
- Supports automatic text detection and playback
- Includes both popup and options pages for API key management
- Prevents duplicate readings of the same text

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `readlang` directory

## Setup

1. Get an OpenAI API key from [OpenAI's platform](https://platform.openai.com/)
2. Click the extension icon in Chrome's toolbar
3. Enter your OpenAI API key in the popup
4. Click "Save API Key"

## Usage

1. Navigate to [Readlang flashcards](https://readlang.com/flashcards)
2. The extension will automatically detect and read new flashcard text
3. Text is read using OpenAI's 'alloy' voice

## Configuration

The extension monitors specific XPath elements for text changes:
- Primary flashcard text
- Secondary flashcard content

You can modify these XPaths in the `core.js` file if needed.

## Files Structure

\`\`\`
readlang/
├── manifest.json      # Extension manifest
├── popup.html        # API key entry popup
├── popup.js          # Popup functionality
├── options.html      # Settings page
├── options.js        # Settings functionality
├── apiKeyManager.js  # API key management
└── core.js          # Main extension logic
\`\`\`

## Permissions

The extension requires the following permissions:
- \`activeTab\`: To access the current tab's content
- \`storage\`: To store the OpenAI API key
- \`https://api.openai.com/*\`: To communicate with OpenAI's API

## Development

To modify the extension:
1. Make your changes to the source files
2. Reload the extension in \`chrome://extensions/\`
3. Test your changes on Readlang flashcards

## Debugging

The extension includes a Debug helper that logs important events to the console. Open Chrome DevTools while on Readlang to view these logs.

## Notes

- The extension only activates on \`readlang.com/flashcards\`
- API keys are stored securely in Chrome's sync storage
- Text-to-speech requests are queued to prevent overlapping playback

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
