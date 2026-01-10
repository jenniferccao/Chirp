# 🫧 Sticky Whispers - AI-Powered Voice Notes

Leave cute, AI-enhanced voice notes on any webpage that persist across visits!

## ✨ Features

### 🎙️ Voice Recording
- Record voice notes up to 30 seconds
- Real-time recording visualization
- Automatic audio enhancement using ElevenLabs Audio Isolation
- Drag-and-drop bubble placement anywhere on webpages

### 🤖 AI-Powered Transcription
- Automatic speech-to-text conversion
- Search through all your transcribed whispers
- Hover over bubbles to see transcript previews
- Export notes with transcriptions

### 🗣️ Text-to-Speech
- Create voice whispers from text
- 8+ premium AI voices (Rachel, Domi, Bella, Antoni, etc.)
- Load custom voices from your ElevenLabs account
- Perfect for accessibility and quick notes

### 🎨 Beautiful UI
- 5 color themes: Pink, Lavender, Mint, Peach, Sky
- Smooth animations and sparkle effects
- Floating bubbles with hover effects
- Dark mode friendly

### 🔍 Smart Search
- Search across all pages and whispers
- Highlight matching text
- Quick navigation to any note
- Filter by URL or content

### 💾 Export & Sync
- Export all notes as JSON
- Per-page organization
- Character usage tracking
- Cloud sync ready

## 🚀 Installation

### Prerequisites
1. Get a free ElevenLabs API key at [elevenlabs.io](https://elevenlabs.io)
2. Chrome/Edge browser (Manifest V3 compatible)

### Setup
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. Click the extension icon and enter your ElevenLabs API key

## 📖 Usage

### Recording a Voice Whisper
1. Click the extension icon
2. Click "Start Recording"
3. Speak your message (up to 30 seconds)
4. Click "Stop Recording"
5. Click anywhere on the page to place your whisper

### Creating a Text Whisper
1. Click the extension icon
2. Switch to the "Text" tab
3. Type your message
4. Select a voice
5. Click "Generate Voice Whisper"
6. Click anywhere on the page to place it

### Searching Whispers
1. Click the extension icon
2. Switch to the "Search" tab
3. Type your search query
4. Click any result to navigate to that page

### Managing Whispers
- **Play**: Click the bubble or use the play button in the popup
- **Move**: Drag bubbles to reposition them
- **Delete**: Hover over a bubble and click the × button
- **Export**: Click the 💾 icon in the popup

## 🎯 ElevenLabs Integration

### Features Powered by ElevenLabs
- **Audio Isolation**: Removes background noise from recordings
- **Text-to-Speech**: Converts text to natural-sounding speech
- **Voice Library**: Access to premium AI voices
- **Character Tracking**: Monitor your API usage

### API Endpoints Used
- `/v1/text-to-speech/{voice_id}` - Generate speech from text
- `/v1/audio-isolation` - Enhance audio quality
- `/v1/voices` - List available voices
- `/v1/user/subscription` - Get usage statistics

### Cost Tracking
The extension tracks character usage and displays it in the footer:
- Text-to-Speech: ~1 character per character
- Audio Enhancement: No character cost
- Free tier: 10,000 characters/month

## 🏗️ Architecture

```
Chirp/
├── manifest.json           # Extension configuration
├── background/
│   └── service-worker.js   # Background tasks & API calls
├── content/
│   ├── bubble.js          # Bubble rendering & interactions
│   └── bubble.css         # Bubble styling
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styling
├── services/
│   └── elevenlabs-service.js  # ElevenLabs API wrapper
└── icons/                 # Extension icons
```

## 🔧 Technical Details

### Storage
- Uses Chrome's `storage.local` API
- Stores audio as base64-encoded data URLs
- Organizes notes by URL (hostname + pathname)
- Stores transcripts alongside audio

### Permissions
- `storage` - Save notes and API keys
- `activeTab` - Access current page
- `scripting` - Inject content scripts
- `notifications` - Future feature
- `host_permissions: <all_urls>` - Work on any website

### Browser Compatibility
- Chrome 88+
- Edge 88+
- Any Chromium-based browser with Manifest V3 support

## 🎨 Customization

### Adding New Colors
Edit `bubble.css` and add new gradient classes:

```css
.whisper-bubble.custom {
  background: linear-gradient(135deg, #color1, #color2);
}
```

### Adding New Voices
Voices are loaded from your ElevenLabs account. Click the 🔄 button in the Text tab to refresh the voice list.

### Changing Recording Duration
Edit `popup.js` line 75:

```javascript
if (seconds >= 30) { // Change 30 to your desired duration
  stopRecording();
}
```

## 🐛 Troubleshooting

### Microphone Not Working
- Check browser permissions in `chrome://settings/content/microphone`
- Ensure HTTPS or localhost (required for microphone access)

### API Key Invalid
- Verify your key at [elevenlabs.io/app/settings](https://elevenlabs.io/app/settings)
- Ensure you have available character quota
- Check for extra spaces when pasting

### Transcription Not Working
- Web Speech API requires internet connection
- Only works in Chrome/Edge (uses browser's built-in recognition)
- May not work in all languages

### Bubbles Not Appearing
- Refresh the page after installation
- Check if the page blocks content scripts (some sites do)
- Open browser console for error messages

## 🚀 Future Enhancements

- [ ] Multi-language support
- [ ] Voice cloning with ElevenLabs
- [ ] Collaborative whispers (share with friends)
- [ ] Browser sync across devices
- [ ] Mobile app companion
- [ ] Integration with Ray-Ban Meta Glasses
- [ ] AR visualization
- [ ] Voice commands ("Hey Meta, leave a whisper")

## 📄 License

MIT License - feel free to use and modify!

## 🙏 Credits

- Built with [ElevenLabs API](https://elevenlabs.io)
- Icons from emoji sets
- Inspired by sticky notes and voice memos

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review ElevenLabs API documentation

---

Made with 💜 for SheHacks+ 2026

