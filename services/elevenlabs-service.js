// ElevenLabs API Service for Sticky Whispers
// This module handles all ElevenLabs API interactions

class ElevenLabsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  /**
   * Convert text to speech using ElevenLabs
   * @param {string} text - The text to convert
   * @param {string} voiceId - Voice ID (default: Rachel)
   * @returns {Promise<{audio: Blob, charCount: number, requestId: string}>}
   */
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

      // Get metadata from headers
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

  /**
   * Enhance audio quality using Audio Isolation
   * @param {Blob} audioBlob - The audio to enhance
   * @returns {Promise<{audio: Blob, requestId: string}>}
   */
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
      // Return original audio if enhancement fails
      return { audio: audioBlob, requestId: null };
    }
  }

  /**
   * Get available voices
   * @returns {Promise<Array>}
   */
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

  /**
   * Convert speech to text using Web Speech API (free alternative)
   * Note: ElevenLabs doesn't have STT, so we use browser's built-in
   * @param {Blob} audioBlob
   * @returns {Promise<string>}
   */
  async speechToText(audioBlob) {
    return new Promise((resolve, reject) => {
      // Check if browser supports Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      // Create audio element to play the blob
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
        URL.revokeObjectURL(audioUrl);
      };

      recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
        URL.revokeObjectURL(audioUrl);
      };

      // Start recognition when audio plays
      audio.onplay = () => {
        recognition.start();
      };

      audio.play();
    });
  }

  /**
   * Validate API key
   * @returns {Promise<boolean>}
   */
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

  /**
   * Get user subscription info
   * @returns {Promise<Object>}
   */
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

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ElevenLabsService;
}

