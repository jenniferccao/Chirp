// Background service worker for Sticky Whispers
// Handles ElevenLabs API calls and background processing

// ElevenLabs Service (inline to avoid importScripts issue)
class ElevenLabsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  async textToSpeech(text, voiceId = '21m00Tcm4TlvDq8ikWAM') {
    try {
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Text-to-speech failed');
      }

      const charCount = response.headers.get('x-character-count');
      const requestId = response.headers.get('request-id');
      const audioBlob = await response.blob();
      
      return {
        audio: audioBlob,
        charCount: parseInt(charCount) || 0,
        requestId: requestId
      };
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  async enhanceAudio(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch(`${this.baseUrl}/audio-isolation`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Audio enhancement failed');
      }

      const requestId = response.headers.get('request-id');
      const enhancedAudio = await response.blob();

      return {
        audio: enhancedAudio,
        requestId: requestId
      };
    } catch (error) {
      console.error('ElevenLabs audio enhancement error:', error);
      return { audio: audioBlob, requestId: null };
    }
  }

  async getVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  async validateApiKey() {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.ok;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }

  async getUserInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/user/subscription`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Sticky Whispers installed! 🫧');
  
  // Auto-initialize API key
  const HARDCODED_API_KEY = 'sk_371dd1ebfd6b3123e8674dee136c2792744760be31db90db';
  const { elevenLabsApiKey } = await chrome.storage.local.get(['elevenLabsApiKey']);
  
  if (!elevenLabsApiKey) {
    await chrome.storage.local.set({ elevenLabsApiKey: HARDCODED_API_KEY });
    console.log('API key auto-initialized');
  }
  
  // Create context menu for "Read Aloud"
  chrome.contextMenus.create({
    id: 'readAloud',
    title: 'Read Aloud with Sticky Whispers',
    contexts: ['selection']
  });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle async operations
  (async () => {
    try {
      // Get API key from storage
      const { elevenLabsApiKey } = await chrome.storage.local.get(['elevenLabsApiKey']);
      
      if (!elevenLabsApiKey && request.action !== 'validateApiKey') {
        sendResponse({ success: false, error: 'API key not found' });
        return;
      }

      const elevenlabs = new ElevenLabsService(elevenLabsApiKey);

      switch (request.action) {
        case 'validateApiKey':
          const isValid = await elevenlabs.validateApiKey();
          sendResponse({ success: true, valid: isValid });
          break;

        case 'enhanceAudio':
          // Convert base64 to blob
          const audioBlob = await base64ToBlob(request.audioData);
          const enhanced = await elevenlabs.enhanceAudio(audioBlob);
          const enhancedBase64 = await blobToBase64(enhanced.audio);
          sendResponse({ 
            success: true, 
            audioData: enhancedBase64,
            requestId: enhanced.requestId 
          });
          break;

        case 'textToSpeech':
          const ttsResult = await elevenlabs.textToSpeech(request.text, request.voiceId);
          const ttsBase64 = await blobToBase64(ttsResult.audio);
          sendResponse({ 
            success: true, 
            audioData: ttsBase64,
            charCount: ttsResult.charCount,
            requestId: ttsResult.requestId
          });
          break;

        case 'getVoices':
          const voices = await elevenlabs.getVoices();
          sendResponse({ success: true, voices: voices });
          break;

        case 'getUserInfo':
          const userInfo = await elevenlabs.getUserInfo();
          sendResponse({ success: true, userInfo: userInfo });
          break;

        case 'transcribeAudio':
          // Use Web Speech API for transcription
          const transcriptBlob = await base64ToBlob(request.audioData);
          const transcript = await elevenlabs.speechToText(transcriptBlob);
          sendResponse({ success: true, transcript: transcript });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background service error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Return true to indicate async response
  return true;
});

// Helper function to convert base64 to Blob
async function base64ToBlob(base64Data) {
  const response = await fetch(base64Data);
  return await response.blob();
}

// Helper function to convert Blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Handle extension icon click analytics
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension clicked on:', tab.url);
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'readAloud') {
    const selectedText = info.selectionText;
    
    // Get API key
    const { elevenLabsApiKey } = await chrome.storage.local.get(['elevenLabsApiKey']);
    
    if (!elevenLabsApiKey) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: 'Please set up your ElevenLabs API key first!'
      });
      return;
    }
    
    // Generate speech from selected text
    const elevenlabs = new ElevenLabsService(elevenLabsApiKey);
    
    try {
      const ttsResult = await elevenlabs.textToSpeech(selectedText);
      const audioBase64 = await blobToBase64(ttsResult.audio);
      
      // Send to content script to play
      chrome.tabs.sendMessage(tab.id, {
        action: 'playReadAloud',
        audioData: audioBase64,
        text: selectedText
      });
    } catch (error) {
      console.error('Read aloud error:', error);
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: 'Failed to read text. Please try again.'
      });
    }
  }
});
