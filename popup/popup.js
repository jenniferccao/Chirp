// Popup script for Sticky Whispers with ElevenLabs integration

let mediaRecorder;
let audioChunks = [];
let recording = false;
let timerInterval;
let seconds = 0;
let selectedColor = 'pink';
let currentAudioData = null;
let currentTranscript = null;
let recognition = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeApiKey();
  await checkApiKey();
  setupEventListeners();
});

// Auto-initialize API key from config
async function initializeApiKey() {
  // Check if API key already exists
  const result = await chrome.storage.local.get(['elevenLabsApiKey']);
  
  if (!result.elevenLabsApiKey && typeof CONFIG !== 'undefined') {
    // Store the hardcoded API key
    await chrome.storage.local.set({ elevenLabsApiKey: CONFIG.ELEVENLABS_API_KEY });
    console.log('API key auto-initialized from config');
  }
}

// Check for API key and validate it
async function checkApiKey() {
  const result = await chrome.storage.local.get(['elevenLabsApiKey']);
  
  if (result.elevenLabsApiKey) {
    // Key exists, show main section
    showMainSection();
    loadNotes();
    loadUserInfo();
  } else {
    showApiKeySection();
  }
}

function showApiKeySection() {
  document.getElementById('apiKeySection').style.display = 'block';
  document.getElementById('mainSection').style.display = 'none';
}

function showMainSection() {
  document.getElementById('apiKeySection').style.display = 'none';
  document.getElementById('mainSection').style.display = 'block';
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('apiKeyStatus');
  statusDiv.textContent = message;
  statusDiv.className = `api-status ${type}`;
  statusDiv.style.display = 'block';
}

// Setup all event listeners
function setupEventListeners() {
  // API Key
  document.getElementById('saveApiKey').addEventListener('click', saveApiKey);
  
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // Color picker
  document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      selectedColor = option.dataset.color;
    });
  });
  
  // Recording
  document.getElementById('recordBtn').addEventListener('click', toggleRecording);
  document.getElementById('cancelBtn').addEventListener('click', cancelRecording);
  
  // Text-to-Speech
  document.getElementById('textInput').addEventListener('input', updateCharCount);
  document.getElementById('generateSpeechBtn').addEventListener('click', generateSpeech);
  document.getElementById('cancelTtsBtn').addEventListener('click', cancelTts);
  document.getElementById('refreshVoices').addEventListener('click', loadVoices);
  
  // Search
  document.getElementById('searchInput').addEventListener('input', debounce(searchWhispers, 300));
  
  // Export
  document.getElementById('exportBtn').addEventListener('click', exportNotes);
}

// API Key Management
async function saveApiKey() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }
  
  showStatus('Saving...', 'success');
  
  try {
    // Save the key
    await chrome.storage.local.set({ elevenLabsApiKey: apiKey });
    
    // Try to validate (but don't block if it fails)
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'validateApiKey'
      });
      
      if (response && response.success && response.valid) {
        showStatus('✓ API key validated successfully!', 'success');
      } else {
        showStatus('✓ API key saved! (Validation skipped)', 'success');
      }
    } catch (validationError) {
      console.log('Validation skipped:', validationError);
      showStatus('✓ API key saved!', 'success');
    }
    
    // Show main section after a short delay
    setTimeout(() => {
      showMainSection();
      loadNotes();
      loadUserInfo();
    }, 1000);
    
  } catch (error) {
    console.error('Error saving API key:', error);
    showStatus('Error saving key. Please try again.', 'error');
  }
}

// Tab Management
function switchTab(tabName) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Recording Functions
async function toggleRecording() {
  if (!recording) {
    await startRecording();
  } else {
    await stopRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    recording = true;
    currentTranscript = '';

    document.getElementById('recordBtnText').textContent = 'Stop Recording';
    document.getElementById('recordBtn').classList.add('recording');
    document.getElementById('recordVisual').classList.add('recording');

    // Start live transcription
    startLiveTranscription();

    // Start timer
    seconds = 0;
    timerInterval = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      document.getElementById('timer').textContent = 
        `${mins}:${secs.toString().padStart(2, '0')}`;
      
      // Auto-stop at 30 seconds
      if (seconds >= 30) {
        stopRecording();
      }
    }, 1000);

    mediaRecorder.addEventListener('dataavailable', (event) => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener('stop', async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      await processAudio(audioBlob);
    });

    mediaRecorder.start();
  } catch (error) {
    console.error('Error accessing microphone:', error);
    alert('Could not access microphone. Please check permissions.');
  }
}

async function stopRecording() {
  if (mediaRecorder && recording) {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    recording = false;
    clearInterval(timerInterval);

    // Stop transcription
    stopLiveTranscription();

    document.getElementById('recordBtnText').textContent = 'Start Recording';
    document.getElementById('recordBtn').classList.remove('recording');
    document.getElementById('recordVisual').classList.remove('recording');
    document.getElementById('timer').textContent = '0:00';
  }
}

// Start live transcription during recording
function startLiveTranscription() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.log('Speech recognition not supported');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    currentTranscript = (currentTranscript + finalTranscript).trim();
    
    // Show live transcript
    const display = currentTranscript + (interimTranscript ? ' ' + interimTranscript : '');
    if (display) {
      document.getElementById('timer').textContent = `"${display.substring(0, 30)}${display.length > 30 ? '...' : ''}"`;
    }
  };

  recognition.onerror = (event) => {
    console.log('Recognition error:', event.error);
  };

  recognition.onend = () => {
    // Recognition ended
    console.log('Recognition ended');
  };

  try {
    recognition.start();
    console.log('Live transcription started');
  } catch (error) {
    console.error('Error starting recognition:', error);
  }
}

// Stop live transcription
function stopLiveTranscription() {
  if (recognition) {
    try {
      recognition.stop();
      console.log('Live transcription stopped. Final transcript:', currentTranscript);
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }
}

async function processAudio(audioBlob) {
  // Convert blob to base64
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  
  reader.onloadend = async () => {
    let audioData = reader.result;
    
    // Audio enhancement disabled (requires ElevenLabs API permission)
    
    // Show transcript if we got one from live transcription
    if (currentTranscript && currentTranscript.trim()) {
      document.getElementById('transcriptPreview').textContent = 
        `"${currentTranscript}"`;
      document.getElementById('transcriptPreview').style.display = 'block';
      console.log('Transcript captured:', currentTranscript);
    } else {
      currentTranscript = null;
      document.getElementById('transcriptPreview').style.display = 'none';
    }
    
    currentAudioData = audioData;
    
    // Show preview section
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('recordBtn').disabled = true;
    
    // Send message to content script to enable placement mode
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        console.error('No active tab found');
        alert('Please make sure you are on a webpage to place whispers.');
        return;
      }
      
      console.log('Sending enablePlacement message to tab:', tab.id);
      
      chrome.tabs.sendMessage(tab.id, {
        action: 'enablePlacement',
        audioData: audioData,
        color: selectedColor,
        transcript: currentTranscript
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          // Don't show alert, just log the error
          // User can refresh if needed
        } else {
          console.log('Placement mode enabled successfully');
        }
      });
    } catch (error) {
      console.error('Error enabling placement mode:', error);
      alert('Error: ' + error.message);
    }
  };
}

// Transcription using Web Speech API
function transcribeAudio(audioBlob) {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported in this browser');
      resolve(null);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let resolved = false;

    recognition.onresult = (event) => {
      if (!resolved) {
        resolved = true;
        const transcript = event.results[0][0].transcript;
        console.log('Transcription successful:', transcript);
        resolve(transcript);
      }
    };

    recognition.onerror = (event) => {
      if (!resolved) {
        resolved = true;
        console.log('Speech recognition error:', event.error);
        resolve(null);
      }
    };

    recognition.onend = () => {
      if (!resolved) {
        resolved = true;
        console.log('Speech recognition ended without result');
        resolve(null);
      }
    };

    // Start recognition - it will use the microphone directly
    try {
      console.log('Starting speech recognition...');
      recognition.start();
      
      // Play the audio for the user to hear (optional)
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play().then(() => {
        console.log('Playing recorded audio');
      }).catch((err) => {
        console.log('Could not play audio:', err);
      });
      
      // Clean up audio URL after a delay
      setTimeout(() => URL.revokeObjectURL(audioUrl), 5000);
    } catch (error) {
      console.error('Error starting recognition:', error);
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }
  });
}

function cancelRecording() {
  audioChunks = [];
  currentAudioData = null;
  currentTranscript = null;
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('transcriptPreview').style.display = 'none';
  document.getElementById('recordBtn').disabled = false;
}

// Text-to-Speech Functions
function updateCharCount() {
  const text = document.getElementById('textInput').value;
  document.getElementById('charCount').textContent = text.length;
}

async function generateSpeech() {
  const text = document.getElementById('textInput').value.trim();
  
  if (!text) {
    alert('Please enter some text first!');
    return;
  }
  
  const voiceId = document.getElementById('voiceSelect').value;
  const btn = document.getElementById('generateSpeechBtn');
  
  btn.disabled = true;
  btn.textContent = 'Generating...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'textToSpeech',
      text: text,
      voiceId: voiceId
    });
    
    if (response.success) {
      currentAudioData = response.audioData;
      currentTranscript = text;
      
      // Show preview
      document.getElementById('ttsPreview').style.display = 'block';
      btn.disabled = true;
      
      // Enable placement mode
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, {
        action: 'enablePlacement',
        audioData: response.audioData,
        color: selectedColor,
        transcript: text
      });
      
      console.log(`Generated speech: ${response.charCount} characters`);
    } else {
      alert('Failed to generate speech: ' + response.error);
    }
  } catch (error) {
    console.error('TTS error:', error);
    alert('Failed to generate speech. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Voice Whisper';
  }
}

function cancelTts() {
  document.getElementById('textInput').value = '';
  document.getElementById('charCount').textContent = '0';
  document.getElementById('ttsPreview').style.display = 'none';
  document.getElementById('generateSpeechBtn').disabled = false;
  currentAudioData = null;
  currentTranscript = null;
}

async function loadVoices() {
  const btn = document.getElementById('refreshVoices');
  btn.disabled = true;
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getVoices'
    });
    
    if (response.success && response.voices) {
      const select = document.getElementById('voiceSelect');
      select.innerHTML = '';
      
      response.voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.voice_id;
        option.textContent = `${voice.name} (${voice.category || 'Custom'})`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading voices:', error);
  } finally {
    btn.disabled = false;
  }
}

// Search Functions
async function searchWhispers() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const resultsContainer = document.getElementById('searchResults');
  
  if (!query) {
    resultsContainer.innerHTML = '<p class="help-text">Search through all your transcribed whispers</p>';
    return;
  }
  
  resultsContainer.innerHTML = '<div class="loading"></div>';
  
  try {
    // Get all storage data
    const allData = await chrome.storage.local.get(null);
    const results = [];
    
    // Search through all URLs
    for (const [url, notes] of Object.entries(allData)) {
      if (url === 'elevenLabsApiKey') continue;
      
      notes.forEach((note, index) => {
        if (note.transcript) {
          const transcript = note.transcript.toLowerCase();
          if (transcript.includes(query) || url.includes(query)) {
            results.push({
              url: url,
              note: note,
              index: index
            });
          }
        }
      });
    }
    
    displaySearchResults(results, query);
  } catch (error) {
    console.error('Search error:', error);
    resultsContainer.innerHTML = '<p class="help-text">Error searching whispers</p>';
  }
}

function displaySearchResults(results, query) {
  const container = document.getElementById('searchResults');
  
  if (results.length === 0) {
    container.innerHTML = '<p class="help-text">No results found</p>';
    return;
  }
  
  container.innerHTML = results.map((result, index) => {
    const transcript = result.note.transcript || result.note.selectedText || 'No text';
    const highlightedText = highlightText(transcript, query);
    const isCurrentPage = window.location.hostname + window.location.pathname === result.url;
    
    return `
      <div class="search-result-item" data-index="${index}">
        <div class="search-result-url">📍 ${result.url}</div>
        <div class="search-result-transcript">${highlightedText}</div>
        ${isCurrentPage ? 
          `<button class="btn-scroll-to" data-index="${index}">📍 Scroll to Whisper</button>` : 
          `<button class="btn-open-page" data-index="${index}">🔗 Open Page</button>`
        }
      </div>
    `;
  }).join('');
  
  // Add click handlers for scroll buttons
  container.querySelectorAll('.btn-scroll-to').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      const result = results[index];
      
      // Send message to content script to scroll to whisper
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, {
        action: 'scrollToWhisper',
        searchText: query
      });
      
      // Close popup (optional)
      // window.close();
    });
  });
  
  // Add click handlers for open page buttons
  container.querySelectorAll('.btn-open-page').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      const url = results[index].url;
      
      // Open the URL and send scroll message after page loads
      chrome.tabs.create({ url: `https://${url}` }, (tab) => {
        // Wait for page to load, then scroll to whisper
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.sendMessage(tab.id, {
              action: 'scrollToWhisper',
              searchText: query
            });
            chrome.tabs.onUpdated.removeListener(listener);
          }
        });
      });
    });
  });
}

function highlightText(text, query) {
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<span class="search-result-highlight">$1</span>');
}

// Notes Management
async function loadNotes() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url).hostname + new URL(tab.url).pathname;
  
  const result = await chrome.storage.local.get([url]);
  const notes = result[url] || [];
  displayNotes(notes);
}

function displayNotes(notes) {
  const container = document.getElementById('notesContainer');
  
  if (notes.length === 0) {
    container.innerHTML = '<p style="color: #888; font-size: 12px;">No whispers yet on this page</p>';
    return;
  }
  
  container.innerHTML = notes.map((note, index) => `
    <div class="note-item scroll-to-whisper" data-note-id="${note.id}" data-index="${index}">
      <div class="note-info">
        <div style="color: ${getColorValue(note.color)};">● Whisper #${index + 1}</div>
        ${note.transcript ? `<div style="font-size: 10px; color: #666; font-style: italic;">"${note.transcript.substring(0, 50)}${note.transcript.length > 50 ? '...' : ''}"</div>` : ''}
        <div style="font-size: 10px; color: #aaa;">${new Date(note.timestamp).toLocaleString()}</div>
      </div>
      <div class="note-actions">
        <button class="note-btn play-note-btn" data-index="${index}" title="Play">▶️</button>
        <button class="note-btn delete-note-btn" data-index="${index}" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners after creating HTML
  container.querySelectorAll('.play-note-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      playNote(index);
    });
  });
  
  container.querySelectorAll('.delete-note-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      deleteNote(index);
    });
  });
  
  // Add click handler to scroll to whisper on page
  container.querySelectorAll('.scroll-to-whisper').forEach(item => {
    item.addEventListener('click', async (e) => {
      // Don't trigger if clicking buttons
      if (e.target.closest('.note-btn')) return;
      
      const noteId = item.dataset.noteId;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(tab.id, {
        action: 'scrollToWhisperById',
        noteId: noteId
      });
    });
  });
}

function getColorValue(color) {
  const colors = {
    pink: '#FFB5C5',
    lavender: '#E6E6FA',
    mint: '#B5EAD7',
    peach: '#FFDAB9',
    sky: '#B5D8EB'
  };
  return colors[color] || colors.pink;
}

async function playNote(index) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {
    action: 'playNote',
    index: index
  });
}

async function deleteNote(index) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url).hostname + new URL(tab.url).pathname;
  
  const result = await chrome.storage.local.get([url]);
  const notes = result[url] || [];
  notes.splice(index, 1);
  
  await chrome.storage.local.set({ [url]: notes });
  loadNotes();
  chrome.tabs.sendMessage(tab.id, { action: 'refreshBubbles' });
}

// Export Notes
async function exportNotes() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url).hostname + new URL(tab.url).pathname;
  
  const result = await chrome.storage.local.get([url]);
  const notes = result[url] || [];
  
  if (notes.length === 0) {
    alert('No notes to export on this page!');
    return;
  }
  
  // Create export data
  const exportData = {
    url: url,
    exportDate: new Date().toISOString(),
    notes: notes.map((note, index) => ({
      index: index + 1,
      transcript: note.transcript || 'No transcript',
      color: note.color,
      timestamp: note.timestamp,
      position: note.position
    }))
  };
  
  // Download as JSON
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: downloadUrl,
    filename: `sticky-whispers-${url.replace(/[^a-z0-9]/gi, '-')}.json`,
    saveAs: true
  });
}

// Load User Info
async function loadUserInfo() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getUserInfo'
    });
    
    if (response.success && response.userInfo) {
      const info = response.userInfo;
      document.getElementById('userInfoText').textContent = 
        `${info.character_count || 0} / ${info.character_limit || 0} characters used`;
    }
  } catch (error) {
    console.error('Error loading user info:', error);
  }
}

// Utility Functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
