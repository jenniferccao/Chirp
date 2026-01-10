# 🚀 Installation & Testing Guide

## Quick Start (5 minutes)

### Step 1: Get Your ElevenLabs API Key

1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up for a free account (no credit card required)
3. Navigate to your profile settings
4. Copy your API key from the "API Key" section
5. **Important**: Keep this key private!

### Step 2: Load the Extension

1. Open Chrome or Edge browser
2. Navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" using the toggle in the top right
4. Click "Load unpacked"
5. Select the `Chirp` folder
6. The extension icon should appear in your toolbar

### Step 3: Configure the Extension

1. Click the Sticky Whispers extension icon
2. Paste your ElevenLabs API key in the input field
3. Click "Save Key"
4. Wait for validation (should show "✓ API key validated successfully!")
5. The main interface will appear

## 🧪 Testing the Features

### Test 1: Record a Voice Whisper

1. Click the extension icon
2. Make sure you're on the "Record" tab
3. Click "Start Recording"
4. Say something like "This is my first whisper!"
5. Click "Stop Recording"
6. You should see:
   - A transcript preview (if auto-transcribe is enabled)
   - Message: "Recording saved! Click anywhere on the page to place your whisper."
7. Click anywhere on the webpage
8. A floating bubble should appear with sparkles ✨
9. Click the bubble to play it back

**Expected Result**: Audio plays back clearly, bubble floats with animation

### Test 2: Text-to-Speech Whisper

1. Click the extension icon
2. Switch to the "Text" tab (✍️)
3. Type: "Hello from the future! This is AI-generated speech."
4. Select a voice from the dropdown (try "Rachel" or "Antoni")
5. Click "Generate Voice Whisper"
6. Wait a few seconds for generation
7. Click anywhere on the page to place it
8. Click the bubble to hear the AI voice

**Expected Result**: Natural-sounding AI voice speaks your text

### Test 3: Audio Enhancement

1. Record a whisper with some background noise
2. Make sure "✨ Enhance Audio Quality" is checked
3. Record and place the whisper
4. The audio should sound cleaner than the original

**Expected Result**: Background noise is reduced

### Test 4: Search Functionality

1. Create 2-3 whispers with different content
2. Click the extension icon
3. Switch to the "Search" tab (🔍)
4. Type a word that appears in one of your transcripts
5. Results should appear showing matching whispers
6. Click a result to navigate to that page

**Expected Result**: Search finds and highlights matching content

### Test 5: Bubble Interactions

1. **Hover**: Hover over a bubble to see the transcript tooltip
2. **Drag**: Click and drag a bubble to move it
3. **Delete**: Hover and click the × button to delete
4. **Play from popup**: Open popup and click ▶️ on a note

**Expected Result**: All interactions work smoothly

### Test 6: Export Notes

1. Create a few whispers on a page
2. Click the extension icon
3. Click the 💾 export button
4. A JSON file should download
5. Open it to see your notes with transcripts

**Expected Result**: JSON file contains all note data

## 🔍 Verification Checklist

- [ ] Extension loads without errors
- [ ] API key validates successfully
- [ ] Microphone permission granted
- [ ] Voice recording works
- [ ] Audio playback works
- [ ] Transcription appears
- [ ] Text-to-speech generates audio
- [ ] Bubbles appear on page
- [ ] Bubbles are draggable
- [ ] Bubbles can be deleted
- [ ] Search finds notes
- [ ] Export downloads JSON
- [ ] Notes persist after page reload
- [ ] Multiple colors work
- [ ] Character usage displays

## 🐛 Common Issues & Solutions

### Issue: "API key not found" error

**Solution**: 
- Re-enter your API key
- Check for extra spaces
- Verify key is active at elevenlabs.io

### Issue: Microphone not working

**Solution**:
- Click the 🔒 icon in the address bar
- Allow microphone access
- Reload the page
- Try on HTTPS site (not HTTP)

### Issue: Transcription not appearing

**Solution**:
- Check "📝 Auto-Transcribe" is enabled
- Speak clearly and loudly
- Wait a few seconds after recording
- Try on a different browser (Chrome works best)

### Issue: Text-to-speech fails

**Solution**:
- Check your ElevenLabs character quota
- Verify API key is valid
- Try a shorter text
- Check internet connection

### Issue: Bubbles don't appear

**Solution**:
- Refresh the page
- Check browser console for errors (F12)
- Try on a different website
- Reload the extension

### Issue: "Character limit exceeded"

**Solution**:
- Check your usage at elevenlabs.io
- Wait for monthly reset
- Upgrade your ElevenLabs plan
- Use shorter texts

## 📊 Testing Different Scenarios

### Scenario 1: Research Assistant
1. Open a Wikipedia article
2. Record notes about interesting facts
3. Use search to find specific notes later
4. Export for your research paper

### Scenario 2: Shopping Companion
1. Browse an e-commerce site
2. Leave voice notes on products you like
3. Compare notes when deciding what to buy
4. Share exported notes with friends

### Scenario 3: Learning Tool
1. Watch a YouTube tutorial
2. Leave timestamped voice notes
3. Review notes when practicing
4. Search for specific concepts

### Scenario 4: Accessibility
1. Use text-to-speech for reading assistance
2. Voice notes instead of typing
3. Hands-free note-taking
4. Screen reader compatible

## 🎯 Performance Testing

### Test Load Time
1. Open browser console (F12)
2. Go to "Performance" tab
3. Record while loading a page with 10+ whispers
4. Check load time (should be < 1 second)

### Test Storage Usage
1. Create 50 whispers
2. Open `chrome://extensions/`
3. Click "Details" on Sticky Whispers
4. Check storage usage (should be reasonable)

### Test Memory Usage
1. Open Chrome Task Manager (Shift+Esc)
2. Find "Extension: Sticky Whispers"
3. Check memory usage (should be < 50MB)

## 🔐 Security Testing

### Verify API Key Storage
1. Open browser console
2. Type: `chrome.storage.local.get(['elevenLabsApiKey'], console.log)`
3. Verify key is stored securely
4. Check it's not exposed in page context

### Test Permissions
1. Go to `chrome://extensions/`
2. Click "Details" on Sticky Whispers
3. Review permissions
4. Ensure only necessary permissions are requested

## 📱 Cross-Browser Testing

### Chrome
- Version 88+ required
- Full feature support
- Best performance

### Edge
- Version 88+ required
- Full feature support
- Good performance

### Brave
- May require additional permissions
- Privacy shields might interfere
- Test with shields down

### Opera
- Chromium-based, should work
- Test all features
- Check for compatibility

## 🎓 Demo Preparation

### For Hackathon Presentation

1. **Prepare Test Pages**:
   - Open 3-4 different websites
   - Pre-load with interesting whispers
   - Have transcripts ready

2. **Demo Script**:
   - Show voice recording (15 seconds)
   - Demonstrate text-to-speech (15 seconds)
   - Show search functionality (10 seconds)
   - Highlight AI features (10 seconds)
   - Show export (10 seconds)

3. **Backup Plan**:
   - Record a video demo
   - Have screenshots ready
   - Export sample JSON file
   - Prepare offline demo

4. **Talking Points**:
   - "AI-powered voice notes on any webpage"
   - "ElevenLabs integration for premium features"
   - "Perfect for accessibility and productivity"
   - "Future: Ray-Ban Meta Glasses integration"

## 📈 Analytics to Track

- Number of whispers created
- Most used features
- Average recording length
- Search usage
- Export frequency
- Character usage trends

## 🎉 Success Criteria

Your installation is successful if:
- ✅ All 6 tests pass
- ✅ No console errors
- ✅ Smooth animations
- ✅ Fast response times
- ✅ Data persists
- ✅ Search works accurately
- ✅ Export generates valid JSON

## 🆘 Getting Help

If you encounter issues:
1. Check the troubleshooting section
2. Review browser console errors
3. Verify API key and quota
4. Test on a fresh browser profile
5. Check ElevenLabs API status

## 🎊 Ready to Present!

Once all tests pass, you're ready to demo at SheHacks+!

**Pro Tips**:
- Practice your demo 3 times
- Have backup internet connection
- Test on presentation laptop
- Prepare for questions about AI integration
- Highlight the Meta Glasses connection
- Emphasize accessibility features

Good luck! 🍀

