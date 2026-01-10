# 🎵 ElevenLabs Integration Guide

## Overview

Sticky Whispers uses **ElevenLabs API** to provide premium AI-powered audio features. This document explains how the integration works and how to maximize its potential.

## 🔑 API Key Setup

### Getting Your API Key

1. Visit [elevenlabs.io](https://elevenlabs.io)
2. Create a free account (no credit card required)
3. Navigate to Profile → Settings → API Keys
4. Copy your API key
5. Paste it in the Sticky Whispers extension

### Free Tier Benefits

- **10,000 characters/month** free
- Access to all premium voices
- Audio isolation API
- Commercial use allowed
- No expiration

### Paid Tiers (Optional)

- **Starter**: $5/month - 30,000 characters
- **Creator**: $22/month - 100,000 characters
- **Pro**: $99/month - 500,000 characters
- **Scale**: Custom pricing

## 🎯 Features Using ElevenLabs

### 1. Text-to-Speech (Primary Feature)

**Endpoint**: `/v1/text-to-speech/{voice_id}`

**What it does**: Converts text into natural-sounding speech

**How we use it**:
```javascript
// In services/elevenlabs-service.js
async textToSpeech(text, voiceId) {
  const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': this.apiKey
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      }
    })
  });
  
  return await response.blob();
}
```

**Character Cost**: 1 character per text character

**Response Headers**:
- `x-character-count`: Number of characters used
- `request-id`: Unique request identifier

**Use Cases**:
- Create whispers from text
- Accessibility (text-to-voice)
- Quick notes without recording
- Multi-language support (future)

### 2. Audio Isolation (Enhancement)

**Endpoint**: `/v1/audio-isolation`

**What it does**: Removes background noise and enhances voice clarity

**How we use it**:
```javascript
// In services/elevenlabs-service.js
async enhanceAudio(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob);

  const response = await fetch(`${this.baseUrl}/audio-isolation`, {
    method: 'POST',
    headers: {
      'xi-api-key': this.apiKey
    },
    body: formData
  });
  
  return await response.blob();
}
```

**Character Cost**: FREE (no character deduction)

**Benefits**:
- Cleaner recordings
- Better transcription accuracy
- Professional quality
- Automatic processing

**Use Cases**:
- Noisy environments
- Low-quality microphones
- Outdoor recordings
- Background music/TV

### 3. Voice Library

**Endpoint**: `/v1/voices`

**What it does**: Lists all available voices

**How we use it**:
```javascript
// In services/elevenlabs-service.js
async getVoices() {
  const response = await fetch(`${this.baseUrl}/voices`, {
    method: 'GET',
    headers: {
      'xi-api-key': this.apiKey
    }
  });
  
  const data = await response.json();
  return data.voices;
}
```

**Character Cost**: FREE

**Available Voices** (Default):
1. **Rachel** - Calm, clear female voice
2. **Domi** - Strong, confident female voice
3. **Bella** - Soft, friendly female voice
4. **Antoni** - Well-rounded male voice
5. **Elli** - Young, energetic female voice
6. **Josh** - Deep, professional male voice
7. **Arnold** - Crisp, authoritative male voice
8. **Adam** - Casual, conversational male voice

**Custom Voices**: Users can load their own cloned voices

### 4. User Subscription Info

**Endpoint**: `/v1/user/subscription`

**What it does**: Gets user's character quota and usage

**How we use it**:
```javascript
// In services/elevenlabs-service.js
async getUserInfo() {
  const response = await fetch(`${this.baseUrl}/user/subscription`, {
    method: 'GET',
    headers: {
      'xi-api-key': this.apiKey
    }
  });
  
  return await response.json();
}
```

**Character Cost**: FREE

**Displayed Info**:
- Characters used this month
- Total character limit
- Subscription tier
- Renewal date

## 📊 Character Usage Tracking

### How We Track

Every TTS request returns headers:
```javascript
const charCount = response.headers.get('x-character-count');
const requestId = response.headers.get('request-id');
```

### Display to User

In popup footer:
```
"1,234 / 10,000 characters used"
```

### Cost Estimation

| Feature | Character Cost | Example |
|---------|---------------|---------|
| Text-to-Speech | 1 char/char | "Hello" = 5 chars |
| Audio Enhancement | FREE | Any length |
| Voice Library | FREE | N/A |
| User Info | FREE | N/A |

### Optimization Tips

1. **Keep texts concise**: "Buy milk" vs "Remember to buy milk from the store"
2. **Use voice recording**: For long notes, record instead of TTS
3. **Batch similar notes**: Create one TTS note and duplicate
4. **Monitor usage**: Check footer regularly

## 🔒 Security Best Practices

### API Key Storage

```javascript
// Stored securely in Chrome storage
chrome.storage.local.set({ elevenLabsApiKey: apiKey });

// Never exposed in page context
// Only accessible by extension background script
```

### Validation

```javascript
// Validate before saving
async validateApiKey() {
  const response = await fetch(`${this.baseUrl}/user`, {
    method: 'GET',
    headers: { 'xi-api-key': this.apiKey }
  });
  return response.ok;
}
```

### Error Handling

```javascript
// Graceful fallback
try {
  const enhanced = await elevenlabs.enhanceAudio(audioBlob);
  return enhanced.audio;
} catch (error) {
  console.error('Enhancement failed:', error);
  return audioBlob; // Return original
}
```

## 🚀 Advanced Features (Future)

### 1. Voice Cloning

**Endpoint**: `/v1/voice-generation/create-voice`

**Use Case**: Clone user's voice for personalized whispers

**Implementation**:
```javascript
async cloneVoice(audioSamples, voiceName) {
  const formData = new FormData();
  audioSamples.forEach(sample => {
    formData.append('files', sample);
  });
  formData.append('name', voiceName);
  
  const response = await fetch(`${this.baseUrl}/voice-generation/create-voice`, {
    method: 'POST',
    headers: { 'xi-api-key': this.apiKey },
    body: formData
  });
  
  return await response.json();
}
```

### 2. Speech-to-Speech

**Endpoint**: `/v1/speech-to-speech/{voice_id}`

**Use Case**: Convert recorded whisper to different voice

**Implementation**:
```javascript
async speechToSpeech(audioBlob, voiceId) {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  
  const response = await fetch(`${this.baseUrl}/speech-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': this.apiKey },
    body: formData
  });
  
  return await response.blob();
}
```

### 3. Sound Effects

**Endpoint**: `/v1/sound-generation`

**Use Case**: Add sound effects to whispers

**Implementation**:
```javascript
async generateSound(description) {
  const response = await fetch(`${this.baseUrl}/sound-generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': this.apiKey
    },
    body: JSON.stringify({
      text: description,
      duration_seconds: 2
    })
  });
  
  return await response.blob();
}
```

## 📈 Performance Optimization

### Caching Voices

```javascript
// Cache voice list for 1 hour
let voiceCache = null;
let cacheTime = null;

async getVoices() {
  if (voiceCache && Date.now() - cacheTime < 3600000) {
    return voiceCache;
  }
  
  voiceCache = await this.fetchVoices();
  cacheTime = Date.now();
  return voiceCache;
}
```

### Batch Requests

```javascript
// Generate multiple whispers at once
async batchTextToSpeech(texts, voiceId) {
  return Promise.all(
    texts.map(text => this.textToSpeech(text, voiceId))
  );
}
```

### Compression

```javascript
// Compress audio before storage
async compressAudio(audioBlob) {
  // Use Web Audio API to reduce bitrate
  const audioContext = new AudioContext();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Re-encode at lower bitrate
  // ... compression logic
}
```

## 🐛 Troubleshooting

### Error: "Invalid API Key"

**Solution**:
1. Check for extra spaces
2. Verify key at elevenlabs.io
3. Ensure account is active
4. Try regenerating key

### Error: "Character Limit Exceeded"

**Solution**:
1. Check usage at elevenlabs.io
2. Wait for monthly reset
3. Upgrade plan
4. Use shorter texts

### Error: "Rate Limit Exceeded"

**Solution**:
1. Slow down requests
2. Implement request queue
3. Add delays between calls
4. Upgrade to higher tier

### Error: "Audio Enhancement Failed"

**Solution**:
1. Check audio format (should be WebM/MP3)
2. Verify file size (< 10MB)
3. Try without enhancement
4. Check API status

## 📚 Resources

### Official Documentation
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [Voice Library](https://elevenlabs.io/voice-library)
- [Pricing](https://elevenlabs.io/pricing)
- [API Status](https://status.elevenlabs.io)

### Support
- [Discord Community](https://discord.gg/elevenlabs)
- [Email Support](mailto:support@elevenlabs.io)
- [FAQ](https://elevenlabs.io/faq)

### Code Examples
- [Official Node.js SDK](https://github.com/elevenlabs/elevenlabs-js)
- [Python SDK](https://github.com/elevenlabs/elevenlabs-python)
- [Community Examples](https://github.com/elevenlabs/elevenlabs-examples)

## 🎯 Integration Checklist

- [x] API key storage
- [x] Key validation
- [x] Text-to-speech implementation
- [x] Audio enhancement
- [x] Voice library loading
- [x] User info display
- [x] Character tracking
- [x] Error handling
- [x] Graceful fallbacks
- [ ] Voice cloning (future)
- [ ] Speech-to-speech (future)
- [ ] Sound effects (future)

## 💡 Tips for Demo

1. **Show character tracking**: Point out the footer display
2. **Demonstrate TTS**: Use different voices
3. **Highlight enhancement**: Record in noisy environment
4. **Mention free tier**: 10,000 chars/month
5. **Discuss future**: Voice cloning, multi-language

## 🏆 Why ElevenLabs?

1. **Best-in-class TTS**: Most natural-sounding voices
2. **Free tier**: Generous 10,000 chars/month
3. **Audio isolation**: Unique feature for voice notes
4. **Easy API**: Simple REST endpoints
5. **Great docs**: Well-documented and supported
6. **Future-proof**: Constantly adding new features

---

**Integration Status**: ✅ Complete
**Features Implemented**: 4/7 planned
**Character Usage**: Tracked and displayed
**Error Handling**: Comprehensive
**Documentation**: Complete

