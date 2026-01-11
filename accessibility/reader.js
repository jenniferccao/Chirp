// Article Reader for Accessibility
// Detects and reads articles on the page

class ArticleReader {
  constructor() {
    this.currentUtterance = null;
    this.isPaused = false;
    this.isReading = false;
    this.elevenLabsVoices = [];
    this.currentAudio = null;
    this.useElevenLabs = true; // Use ElevenLabs by default
    this.loadElevenLabsVoices();
  }

  // Load ElevenLabs voices
  async loadElevenLabsVoices() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getVoices' });
      if (response.success && response.voices) {
        this.elevenLabsVoices = response.voices;
        console.log('Loaded ElevenLabs voices:', this.elevenLabsVoices.length);
      }
    } catch (error) {
      console.error('Failed to load ElevenLabs voices:', error);
      this.useElevenLabs = false; // Fallback to browser voices
    }
  }

  // Detect main article content on page
  detectArticle() {
    // Try common article selectors
    const selectors = [
      'article',
      '[role="article"]',
      'main article',
      '.article-content',
      '.post-content',
      '.entry-content',
      '#article',
      '#content article',
      'main',
      '[role="main"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 100) {
        return element;
      }
    }

    // Fallback: find largest text block
    const allElements = document.querySelectorAll('div, section, article');
    let largestElement = null;
    let maxLength = 0;

    allElements.forEach(el => {
      const text = el.textContent.trim();
      if (text.length > maxLength && text.length > 200) {
        maxLength = text.length;
        largestElement = el;
      }
    });

    return largestElement;
  }

  // Extract clean text from element
  extractText(element) {
    if (!element) return '';

    // Clone element to avoid modifying original
    const clone = element.cloneNode(true);

    // Remove script, style, and other non-content elements
    const unwanted = clone.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement');
    unwanted.forEach(el => el.remove());

    // Get text content
    let text = clone.textContent || '';

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  // Read article aloud
  async readArticle() {
    if (this.isReading) {
      this.stop();
      return;
    }

    const article = this.detectArticle();
    if (!article) {
      await this.speak('No article content detected on this page.');
      return;
    }

    const text = this.extractText(article);
    if (!text) {
      await this.speak('Could not extract text from article.');
      return;
    }

    await this.speak(text, true);
    this.isReading = true;
  }

  // Read selected text
  async readSelection() {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (!text) {
      await this.speak('No text selected. Please select some text first.');
      return;
    }

    await this.speak(text, true);
  }

  // Speak text using ElevenLabs or Web Speech API
  async speak(text, isLongText = false) {
    // Stop any current speech
    this.stop();

    if (!text) return;

    // Use ElevenLabs if available
    if (this.useElevenLabs && this.elevenLabsVoices.length > 0) {
      await this.speakWithElevenLabs(text, isLongText);
    } else {
      // Fallback to Web Speech API
      this.speakWithBrowser(text, isLongText);
    }
  }

  // Speak using ElevenLabs API
  async speakWithElevenLabs(text, isLongText = false) {
    try {
      // Get selected voice
      const savedVoiceId = localStorage.getItem('chirp-preferred-elevenlabs-voice');
      const voiceId = savedVoiceId || this.elevenLabsVoices[0]?.voice_id;

      if (!voiceId) {
        console.error('No ElevenLabs voice available');
        this.speakWithBrowser(text, isLongText);
        return;
      }

      // Show reading indicator
      this.isReading = true;
      this.showReadingIndicator(true);

      // Split long text into chunks (ElevenLabs has character limits)
      const chunks = this.splitTextIntoChunks(text, 2500);
      
      for (let i = 0; i < chunks.length; i++) {
        if (!this.isReading) break; // Stop if user stopped reading

        const chunk = chunks[i];
        
        // Request TTS from background script
        const response = await chrome.runtime.sendMessage({
          action: 'textToSpeech',
          text: chunk,
          voiceId: voiceId
        });

        if (response.success && response.audioData) {
          // Play audio
          await this.playAudio(response.audioData);
        } else {
          console.error('TTS failed:', response.error);
          // Fallback to browser speech for this chunk
          this.speakWithBrowser(chunk, false);
        }
      }

      this.isReading = false;
      this.showReadingIndicator(false);
    } catch (error) {
      console.error('ElevenLabs speech error:', error);
      this.isReading = false;
      this.showReadingIndicator(false);
      // Fallback to browser speech
      this.speakWithBrowser(text, isLongText);
    }
  }

  // Speak using browser's Web Speech API (fallback)
  speakWithBrowser(text, isLongText = false) {
    // Stop any current speech
    window.speechSynthesis.cancel();

    if (!text) return;

    // Create utterance
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice for better quality
    this.currentUtterance.rate = 0.9;
    this.currentUtterance.pitch = 1.0;
    this.currentUtterance.volume = 1.0;

    // Get best quality voice
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = this.getBestVoice(voices);
    
    if (selectedVoice) {
      this.currentUtterance.voice = selectedVoice;
      console.log('Using browser voice:', selectedVoice.name);
    }

    // Event handlers
    this.currentUtterance.onstart = () => {
      this.isReading = true;
      this.showReadingIndicator(true);
    };

    this.currentUtterance.onend = () => {
      this.isReading = false;
      this.showReadingIndicator(false);
    };

    this.currentUtterance.onerror = (event) => {
      console.error('Speech error:', event);
      this.isReading = false;
      this.showReadingIndicator(false);
    };

    // Start speaking
    window.speechSynthesis.speak(this.currentUtterance);
  }

  // Split text into chunks for ElevenLabs
  splitTextIntoChunks(text, maxLength = 2500) {
    const chunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // If single sentence is too long, split it
        if (sentence.length > maxLength) {
          const words = sentence.split(' ');
          for (const word of words) {
            if ((currentChunk + ' ' + word).length > maxLength) {
              chunks.push(currentChunk.trim());
              currentChunk = word;
            } else {
              currentChunk += ' ' + word;
            }
          }
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  // Play audio from base64 data
  playAudio(base64Data) {
    return new Promise((resolve, reject) => {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      this.currentAudio = new Audio(base64Data);
      
      this.currentAudio.onended = () => {
        resolve();
      };
      
      this.currentAudio.onerror = (error) => {
        console.error('Audio playback error:', error);
        reject(error);
      };
      
      this.currentAudio.play().catch(reject);
    });
  }

  // Pause reading
  pause() {
    if (this.isReading && !this.isPaused) {
      if (this.currentAudio) {
        this.currentAudio.pause();
      } else {
        window.speechSynthesis.pause();
      }
      this.isPaused = true;
      this.showReadingIndicator(true, 'paused');
    }
  }

  // Resume reading
  resume() {
    if (this.isReading && this.isPaused) {
      if (this.currentAudio) {
        this.currentAudio.play();
      } else {
        window.speechSynthesis.resume();
      }
      this.isPaused = false;
      this.showReadingIndicator(true);
    }
  }

  // Stop reading
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    window.speechSynthesis.cancel();
    this.isReading = false;
    this.isPaused = false;
    this.showReadingIndicator(false);
  }

  // Get best quality voice
  getBestVoice(voices) {
    // Try to get user's preferred voice from storage
    const savedVoice = localStorage.getItem('chirp-preferred-voice');
    if (savedVoice) {
      const voice = voices.find(v => v.name === savedVoice);
      if (voice) return voice;
    }

    // Priority list of high-quality voices
    const preferredVoices = [
      // Mac voices (high quality)
      'Samantha',
      'Alex',
      'Victoria',
      'Karen',
      'Daniel',
      'Fiona',
      
      // Google voices (good quality)
      'Google US English',
      'Google UK English Female',
      'Google UK English Male',
      
      // Microsoft voices (good quality)
      'Microsoft Zira',
      'Microsoft David',
      'Microsoft Mark',
      
      // Any English voice
      'en-US',
      'en-GB',
      'en'
    ];

    // Try to find a preferred voice
    for (const preferred of preferredVoices) {
      const voice = voices.find(v => 
        v.name.includes(preferred) || 
        v.lang.startsWith(preferred)
      );
      if (voice) return voice;
    }

    // Fallback: first English voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  }

  // Get all available voices (ElevenLabs + Browser)
  getAvailableVoices() {
    if (this.useElevenLabs && this.elevenLabsVoices.length > 0) {
      return this.elevenLabsVoices;
    }
    return window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  }

  // Set preferred voice
  setVoice(voiceId, isElevenLabs = true) {
    if (isElevenLabs) {
      localStorage.setItem('chirp-preferred-elevenlabs-voice', voiceId);
    } else {
      localStorage.setItem('chirp-preferred-voice', voiceId);
    }
  }

  // Show visual indicator that article is being read
  showReadingIndicator(show, status = 'reading') {
    let indicator = document.getElementById('chirp-reading-indicator');
    
    if (show) {
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'chirp-reading-indicator';
        indicator.className = 'chirp-reading-indicator';
        document.body.appendChild(indicator);
      }

      const icon = status === 'paused' ? '⏸️' : '🔊';
      const text = status === 'paused' ? 'Reading Paused' : 'Reading Article';
      
      // Get available voices
      const voices = this.getAvailableVoices();
      const isElevenLabs = this.useElevenLabs && this.elevenLabsVoices.length > 0;
      const currentVoiceId = isElevenLabs 
        ? localStorage.getItem('chirp-preferred-elevenlabs-voice') 
        : localStorage.getItem('chirp-preferred-voice');
      
      // Build voice options
      let voiceOptions = '<option value="">Auto (Best Quality)</option>';
      
      if (isElevenLabs) {
        // ElevenLabs voices
        voiceOptions += voices.map(v => `
          <option value="${v.voice_id}" ${v.voice_id === currentVoiceId ? 'selected' : ''}>
            ${v.name} ${v.labels?.accent ? `(${v.labels.accent})` : ''}
          </option>
        `).join('');
      } else {
        // Browser voices
        voiceOptions += voices.map(v => `
          <option value="${v.name}" ${v.name === currentVoiceId ? 'selected' : ''}>
            ${v.name}
          </option>
        `).join('');
      }
      
      indicator.innerHTML = `
        <div class="reading-indicator-content">
          <span class="reading-icon">${icon}</span>
          <div class="reading-info">
            <span class="reading-text">${text}</span>
            <span class="voice-provider">${isElevenLabs ? '🎙️ ElevenLabs' : '🔊 Browser'}</span>
            <select class="voice-selector-mini" aria-label="Select voice">
              ${voiceOptions}
            </select>
          </div>
          <button class="reading-stop-btn" aria-label="Stop reading">×</button>
        </div>
      `;

      // Add stop button handler
      const stopBtn = indicator.querySelector('.reading-stop-btn');
      stopBtn.addEventListener('click', () => this.stop());
      
      // Add voice selector handler
      const voiceSelector = indicator.querySelector('.voice-selector-mini');
      voiceSelector.addEventListener('change', (e) => {
        const voiceId = e.target.value;
        if (voiceId) {
          this.setVoice(voiceId, isElevenLabs);
        } else {
          if (isElevenLabs) {
            localStorage.removeItem('chirp-preferred-elevenlabs-voice');
          } else {
            localStorage.removeItem('chirp-preferred-voice');
          }
        }
        // Restart reading with new voice
        if (this.isReading) {
          const wasPlaying = !this.isPaused;
          this.stop();
          if (wasPlaying) {
            setTimeout(() => this.readArticle(), 100);
          }
        }
      });

    } else {
      if (indicator) {
        indicator.remove();
      }
    }
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.ArticleReader = ArticleReader;
}

