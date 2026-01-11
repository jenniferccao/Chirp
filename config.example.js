// Configuration file for Sticky Chirps
// Copy this file to config.js and add your ElevenLabs API key

const CONFIG = {
  ELEVENLABS_API_KEY: 'your_api_key_here'
};

// Make CONFIG available globally
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

