// Background service worker for Sticky Whispers

chrome.runtime.onInstalled.addListener(() => {
    console.log('Sticky Whispers installed! 🫧');
  });
  
  // Optional: Add ElevenLabs voice enhancement here
  // This would be called from popup.js after recording
  
  async function enhanceAudioWithElevenLabs(audioBlob, apiKey) {
    try {
      // Convert blob to the format ElevenLabs expects
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      // Use ElevenLabs Audio Isolation API to clean up the recording
      const response = await fetch('https://api.elevenlabs.io/v1/audio-isolation', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('ElevenLabs API error');
      }
      
      const enhancedAudio = await response.blob();
      return enhancedAudio;
    } catch (error) {
      console.error('Error enhancing audio:', error);
      return audioBlob; // Return original if enhancement fails
    }
  }
  
  // Alternative: Use ElevenLabs Text-to-Speech to convert transcribed notes
  async function textToSpeech(text, apiKey) {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('ElevenLabs TTS error');
      }
      
      const audioBlob = await response.blob();
      return audioBlob;
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      return null;
    }
  }
  
  // Listen for messages from popup or content scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'enhanceAudio') {
      enhanceAudioWithElevenLabs(request.audioBlob, request.apiKey)
        .then(enhanced => sendResponse({ success: true, audio: enhanced }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response
    }
    
    if (request.action === 'textToSpeech') {
      textToSpeech(request.text, request.apiKey)
        .then(audio => sendResponse({ success: true, audio: audio }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
  });