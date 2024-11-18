# Context Finder Chrome Extension

A Chrome extension that monitors webpage content using XPath selectors and converts text to speech using OpenAI's TTS API.

## Features

- 🔍 Monitor specific webpage elements using customizable XPath expressions
- 🔊 Text-to-speech conversion using OpenAI's TTS API
- ⚡ Real-time content updates through MutationObserver
- 🚫 Ignore specific words or phrases
- 🔑 Secure API key management
- 🧪 XPath testing functionality

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `readlang` directory

## Configuration

### API Key Setup
1. Open the extension popup
2. Enter your OpenAI API key in the designated field
3. Click the save button

### Element Monitoring
1. Add XPath expressions to monitor specific elements
2. Test XPath expressions using the test button (🧪)
3. Remove unwanted expressions using the trash icon

### Ignored Words
- Add words or phrases (one per line) that should be ignored during content processing

## Technical Details

### File Structure
- `manifest.json`: Extension configuration
- `popup.html/css/js`: Extension UI and settings management
- `content.js`: Main content script for webpage monitoring
- `content-manager.js`: Content processing and audio playback
- `speech-service.js`: OpenAI TTS API integration
- `config.js`: API key management

### Technologies Used
- Chrome Extensions API
- OpenAI TTS API
- MutationObserver API
- XPath for DOM traversal
- Chrome Storage API

## Permissions
- `activeTab`: Access to current tab
- `storage`: Save extension settings
- `tabs`: Tab management
- Access to OpenAI API endpoints

## Development

### Building
No build process required - this is a vanilla JavaScript project.

### Testing
1. Make changes to the code
2. Reload the extension in `chrome://extensions/`
3. Test functionality in a new tab

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

