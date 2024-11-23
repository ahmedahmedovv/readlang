# Context Finder Chrome Extension

A Chrome extension that enhances text-to-speech functionality with OpenAI's TTS API, featuring audio caching and customizable display options.

## Features

- 🎯 Automatically detects and reads content from specified page elements
- 🔊 Text-to-speech powered by OpenAI's TTS API
- 💾 Audio caching system for improved performance
- 🎨 Customizable display position (top-left, top-right, bottom-left, bottom-right)
- 🗣️ Multiple voice options (Alloy, Echo, Fable, Onyx, Nova)
- 🔄 Replay functionality for last spoken content
- 📊 Cache management with size tracking
- 🔐 Secure API key storage

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Configuration

### Required Setup
1. Open the extension popup by clicking the extension icon
2. Enter your OpenAI API key in the settings
3. Choose your preferred voice and display position
4. Click "Save Changes"

### Available Settings

- **Voice Options:**
  - Alloy
  - Echo
  - Fable
  - Onyx
  - Nova

- **Display Positions:**
  - Top Left
  - Top Right
  - Bottom Left
  - Bottom Right

## Usage

The extension will automatically:
1. Monitor specified page elements for content changes
2. Display the content in a floating window
3. Read the content aloud using the selected voice
4. Cache audio for improved performance

### Controls
- 🔊 **Replay Button**: Click to replay the last spoken content
- 🗑️ **Clear Cache**: Manage audio cache through the extension popup
- 📊 **Cache Info**: View current cache size and entry count

## Technical Details

### Components

- `content.js`: Main content script handling DOM operations and UI
- `speech.js`: Speech service managing TTS functionality and audio caching
- `popup.js`: Settings management and user interface
- `config.js`: Configuration management and settings storage

### Features Implementation

#### Audio Caching
