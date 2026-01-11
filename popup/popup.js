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
let audioMotion = null;

// Audio cropping variables
let currentAudioBlob;
let audioBuffer;
let audioContext;
let cropStartTime = 0;
let cropEndTime = 0;
let audioDuration = 0;
let isDragging = false;
let dragHandle = null;
let currentAudioSource = null;
let isPlaying = false;
let playbackStartTime = 0;
let playbackAnimationId = null;

// Team and heatmap variables
let teamService = new TeamService();
let currentTeamCode = null;
let heatmapEnabled = false;
let heatmapMode = 'community';

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeApiKey();
  await checkApiKey();
  setupEventListeners();
  await loadUserProfile();
  await loadTeams();
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
  // Wait a moment for background script to initialize the hardcoded key
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const result = await chrome.storage.local.get(['elevenLabsApiKey']);
  
  if (result.elevenLabsApiKey) {
    // Key exists, show main section
    showMainSection();
    loadNotes();
    loadUserInfo();
  } else {
    // If still no key after waiting, initialize it here
    const HARDCODED_API_KEY = 'sk_371dd1ebfd6b3123e8674dee136c2792744760be31db90db';
    await chrome.storage.local.set({ elevenLabsApiKey: HARDCODED_API_KEY });
    console.log('✅ API key initialized from popup');
    showMainSection();
    loadNotes();
    loadUserInfo();
  }
}

function showApiKeySection() {
  document.getElementById('apiKeySection').style.display = 'block';
  document.getElementById('mainSection').style.display = 'none';
}

function showMainSection() {
      document.getElementById('apiKeySection').style.display = 'none';
      document.getElementById('mainSection').style.display = 'block';
      initializeVisualizer();
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
    btn.addEventListener('click', async () => await switchTab(btn.dataset.tab));
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
  document.getElementById('saveAudioBtn').addEventListener('click', saveAudio);
  document.getElementById('resetCropBtn').addEventListener('click', resetCrop);
  
  // Text-to-Speech
  document.getElementById('generateSpeechBtn').addEventListener('click', generateSpeech);
  document.getElementById('cancelTtsBtn').addEventListener('click', cancelTts);
  document.getElementById('refreshVoices').addEventListener('click', loadVoices);
  
  // Search
  document.getElementById('searchInput').addEventListener('input', debounce(searchWhispers, 300));
  
  // Export
  document.getElementById('exportBtn').addEventListener('click', exportNotes);
  
  // Team Management
  document.getElementById('createTeamBtn').addEventListener('click', showCreateTeamForm);
  document.getElementById('joinTeamBtn').addEventListener('click', showJoinTeamForm);
  document.getElementById('confirmCreateTeam').addEventListener('click', createTeam);
  document.getElementById('confirmJoinTeam').addEventListener('click', joinTeam);
  
  // Load Demo Data Button
  document.getElementById('loadDemoDataBtn').addEventListener('click', loadDemoBubblesForCarnegie);
  
  // Heatmap
  document.getElementById('heatmapToggle').addEventListener('change', toggleHeatmap);
  document.querySelectorAll('.heatmap-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => switchHeatmapMode(btn.dataset.mode));
  });
  
  // Tips close button
  const closeTipsBtn = document.getElementById('closeTips');
  if (closeTipsBtn) {
    closeTipsBtn.addEventListener('click', () => {
      const tipsSection = document.getElementById('tipsSection');
      if (tipsSection) {
        tipsSection.classList.add('hidden');
        // Save preference
        localStorage.setItem('whisper-tips-hidden', 'true');
      }
    });
  }
  
  // Check if tips should be hidden
  if (localStorage.getItem('whisper-tips-hidden') === 'true') {
    const tipsSection = document.getElementById('tipsSection');
    if (tipsSection) {
      tipsSection.classList.add('hidden');
    }
  }
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
async function switchTab(tabName) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}Tab`).classList.add('active');
  
  // Load team whispers when switching to teams tab
  if (tabName === 'teams') {
    await loadTeamWhispersForCurrentPage();
  }
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
    currentAudioBlob = audioBlob;
    
    // Setup audio cropping
    await setupAudioCropping(audioBlob);
    
    // Show preview section (user will click Save to place the whisper)
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('recordBtn').disabled = true;
    
    // Don't send placement message here - wait for user to click Save button
    // This prevents double placement bug
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
  stopAudio();
  audioChunks = [];
  currentAudioData = null;
  currentTranscript = null;
  currentAudioBlob = null;
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('transcriptPreview').style.display = 'none';
  document.getElementById('audioCropSection').style.display = 'none';
  document.getElementById('recordBtn').disabled = false;
}

// Save audio with cropping and naming
async function saveAudio() {
  try {
    // Get chirp name
    const chirpName = document.getElementById('chirpName').value.trim() || 'Chirp ' + Date.now();
    
    // Get cropped audio
    const finalAudioBlob = await getCroppedAudioBlob();
    
    // Convert to base64
    const reader = new FileReader();
    reader.readAsDataURL(finalAudioBlob);
    
    reader.onloadend = async () => {
      const audioData = reader.result;
      
      // Send to content script to enable placement
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        console.error('No active tab found');
        alert('Please make sure you are on a webpage to place whispers.');
        return;
      }
      
    chrome.tabs.sendMessage(tab.id, {
      action: 'enablePlacement',
        audioData: audioData,
        transcript: currentTranscript || '',
        color: selectedColor,
        name: chirpName
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
        } else {
          console.log('Placement enabled:', response);
        }
      });
      
      // Close popup after sending
      window.close();
    };
  } catch (error) {
    console.error('Error saving audio:', error);
    alert('Error saving audio. Please try again.');
  }
}

// Text-to-Speech Functions
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
      // Skip non-whisper data
      if (url === 'elevenLabsApiKey' || url === 'userProfile' || url === 'teams' || url === 'currentTeamCode') continue;
      
      // Ensure notes is an array
      if (!Array.isArray(notes)) continue;
      
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
      const used = info.character_count || 0;
      const limit = info.character_limit || 0;
      const remaining = limit - used;
      
      let displayText = `${used.toLocaleString()} / ${limit.toLocaleString()} characters used`;
      
      // Add warning if low on credits
      if (remaining < 1000) {
        displayText += ' ⚠️ LOW CREDITS!';
        document.getElementById('userInfoText').style.color = '#ff4444';
      } else if (remaining < 5000) {
        displayText += ' ⚠️';
        document.getElementById('userInfoText').style.color = '#ff9900';
      } else {
        document.getElementById('userInfoText').style.color = '#666';
      }
      
      document.getElementById('userInfoText').textContent = displayText;
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
// Audio Visualization and Cropping Features
// These functions are extracted from the team's audio cropping feature

// Initialize audio visualizer
function initializeVisualizer() {
  const canvas = document.getElementById('audioCanvas');
  if (!canvas || audioMotion) return; // Already initialized or canvas not found
  
  // Check if AudioMotionAnalyzer is available
  if (typeof AudioMotionAnalyzer === 'undefined') {
    console.warn('AudioMotionAnalyzer library not loaded yet, retrying...');
    setTimeout(initializeVisualizer, 100);
    return;
  }
  
  try {
    // Create audio context
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    audioMotion = new AudioMotionAnalyzer(canvas, {
      audioCtx: audioCtx,
      height: 100,
      width: 100,
      barSpace: 0.1,
      gradient: 'rainbow',
      mode: 3,
      radial: true,
      showBgColor: false,
      showLeds: false,
      showScaleX: false,
      showScaleY: false,
      showPeaks: false,
      showFPS: false,
      spinSpeed: 2,
      start: false // Don't start automatically
    });
    
    console.log('Audio visualizer initialized successfully');
  } catch (error) {
    console.error('Error initializing visualizer:', error);
  }
}

// Draw waveform on canvas
function drawWaveform() {
  const canvas = document.getElementById('waveformCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 300;
  const height = canvas.height = 60;
  
  ctx.clearRect(0, 0, width, height);
  
  if (!audioBuffer) return;
  
  const data = audioBuffer.getChannelData(0);
  const step = Math.ceil(data.length / width);
  const amp = height / 2;
  
  ctx.fillStyle = '#d8769e';
  ctx.beginPath();
  
  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;
    
    for (let j = 0; j < step; j++) {
      const datum = data[(i * step) + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    
    const yMin = (1 + min) * amp;
    const yMax = (1 + max) * amp;
    
    ctx.fillRect(i, yMin, 1, yMax - yMin);
  }
}

// Setup crop handlers
function setupCropHandlers() {
  const canvas = document.getElementById('waveformCanvas');
  const startHandle = document.getElementById('cropStart');
  const endHandle = document.getElementById('cropEnd');
  
  if (!canvas || !startHandle || !endHandle) return;
  
  // Canvas click to set crop points or play audio
  canvas.addEventListener('click', (e) => {
    if (isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const time = ratio * audioDuration;
    
    // If clicking within crop region, play cropped audio
    if (time >= cropStartTime && time <= cropEndTime) {
      playCroppedAudio();
      return;
    }
    
    // Otherwise, set crop points
    const distToStart = Math.abs(time - cropStartTime);
    const distToEnd = Math.abs(time - cropEndTime);
    
    if (distToStart < distToEnd) {
      cropStartTime = Math.max(0, time);
    } else {
      cropEndTime = Math.min(audioDuration, time);
    }
    
    // Ensure start is before end
    if (cropStartTime >= cropEndTime) {
      if (distToStart < distToEnd) {
        cropEndTime = Math.min(audioDuration, cropStartTime + 0.1);
      } else {
        cropStartTime = Math.max(0, cropEndTime - 0.1);
      }
    }
    
    updateCropRegion();
    updateCropInfo();
  });
  
  // Handle dragging
  [startHandle, endHandle].forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragHandle = handle;
      e.preventDefault();
    });
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !dragHandle) return;
    
    const canvas = document.getElementById('waveformCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const time = ratio * audioDuration;
    
    if (dragHandle.id === 'cropStart') {
      cropStartTime = Math.max(0, Math.min(cropEndTime - 0.1, time));
    } else {
      cropEndTime = Math.max(cropStartTime + 0.1, Math.min(audioDuration, time));
    }
    
    updateCropRegion();
    updateCropInfo();
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    dragHandle = null;
  });
}

// Update crop region visual
function updateCropRegion() {
  const container = document.querySelector('.waveform-container');
  const region = document.getElementById('cropRegion');
  const startHandle = document.getElementById('cropStart');
  const endHandle = document.getElementById('cropEnd');
  
  if (!container || !region || !startHandle || !endHandle) return;
  
  const startPercent = (cropStartTime / audioDuration) * 100;
  const endPercent = (cropEndTime / audioDuration) * 100;
  
  startHandle.style.left = startPercent + '%';
  endHandle.style.left = endPercent + '%';
  
  region.style.left = startPercent + '%';
  region.style.width = (endPercent - startPercent) + '%';
}

// Update crop info display
function updateCropInfo() {
  const duration = cropEndTime - cropStartTime;
  const elem = document.getElementById('cropDuration');
  if (elem) {
    elem.textContent = `Duration: ${duration.toFixed(1)}s`;
  }
}

// Play cropped audio
async function playCroppedAudio() {
  if (!audioBuffer) return;
  
  stopAudio();
  
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    currentAudioSource = audioContext.createBufferSource();
    currentAudioSource.buffer = audioBuffer;
    currentAudioSource.connect(audioContext.destination);
    
    const duration = cropEndTime - cropStartTime;
    
    currentAudioSource.onended = () => {
      stopAudio();
    };
    
    currentAudioSource.start(0, cropStartTime, duration);
    isPlaying = true;
  } catch (error) {
    console.error('Error playing cropped audio:', error);
  }
}

// Stop audio playback
function stopAudio() {
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
    } catch (e) {
      // Already stopped
    }
    currentAudioSource = null;
  }
  isPlaying = false;
  
  if (playbackAnimationId) {
    cancelAnimationFrame(playbackAnimationId);
    playbackAnimationId = null;
  }
}

// Reset crop to full audio
function resetCrop() {
  cropStartTime = 0;
  cropEndTime = audioDuration;
  updateCropRegion();
  updateCropInfo();
}

// Setup audio for cropping
async function setupAudioCropping(audioBlob) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const arrayBuffer = await audioBlob.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioDuration = audioBuffer.duration;
    
    // Initialize crop to full duration
    cropStartTime = 0;
    cropEndTime = audioDuration;
    
    // Draw waveform
    drawWaveform();
    
    // Setup handlers
    setupCropHandlers();
    
    // Update UI
    updateCropRegion();
    updateCropInfo();
    
    // Show crop section
    const cropSection = document.getElementById('audioCropSection');
    if (cropSection) {
      cropSection.style.display = 'block';
    }
  } catch (error) {
    console.error('Error setting up audio cropping:', error);
  }
}

// Get cropped audio blob
async function getCroppedAudioBlob() {
  if (!audioBuffer) return currentAudioBlob;
  
  try {
    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      Math.ceil((cropEndTime - cropStartTime) * audioBuffer.sampleRate),
      audioBuffer.sampleRate
    );
    
    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    
    // Start at crop start time
    source.start(0, cropStartTime, cropEndTime - cropStartTime);
    
    // Render
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert to WAV blob
    const wav = audioBufferToWav(renderedBuffer);
    return new Blob([wav], { type: 'audio/wav' });
  } catch (error) {
    console.error('Error cropping audio:', error);
    return currentAudioBlob;
  }
}

// Convert AudioBuffer to WAV
function audioBufferToWav(buffer) {
  const length = buffer.length * buffer.numberOfChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  const channels = [];
  let offset = 0;
  let pos = 0;
  
  // Write WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(buffer.numberOfChannels);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // avg. bytes/sec
  setUint16(buffer.numberOfChannels * 2); // block-align
  setUint16(16); // 16-bit
  
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length
  
  // Write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  while (pos < length) {
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const sample = Math.max(-1, Math.min(1, channels[i][offset]));
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      pos += 2;
    }
    offset++;
  }
  
  return arrayBuffer;
  
  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  
  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

// Team and Heatmap Functions for Popup

// Load user profile and stats
async function loadUserProfile() {
  try {
    // Check if we should load demo data
    const result = await chrome.storage.local.get(['userProfile', 'demoDataLoaded']);
    
    // Auto-load demo data on first run
    if (!result.userProfile && !result.demoDataLoaded) {
      console.log('🎭 Loading demo data for first time...');
      await loadDemoData();
    }
    
    const profile = await teamService.getUserProfile();
    
    // Update UI
    document.getElementById('profileUsername').textContent = profile.username;
    document.getElementById('profileId').textContent = `ID: ${profile.id.substring(0, 12)}...`;
    document.getElementById('profileAvatar').textContent = profile.username.charAt(0).toUpperCase();
    
    // Update stats
    document.getElementById('statWhispers').textContent = profile.stats.totalWhispers;
    document.getElementById('statShared').textContent = profile.stats.sharedWhispers;
    document.getElementById('statArticles').textContent = profile.stats.articlesRead;
    document.getElementById('statTeamContrib').textContent = profile.stats.teamContributions;
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Load demo data automatically
async function loadDemoData() {
  try {
    console.log('🎭 Generating demo data...');
    
    // 1. Create user profile with stats
    const userProfile = {
      id: 'user_demo_12345',
      username: 'Sarah Chen',
      createdAt: new Date('2024-01-01').toISOString(),
      stats: {
        totalWhispers: 47,
        sharedWhispers: 23,
        articlesRead: 15,
        teamContributions: 31
      },
      teams: ['ECON42', 'STUDY1']
    };
    
    await chrome.storage.local.set({ userProfile });
    console.log('✅ User profile created:', userProfile.username);
    
    // 2. Create demo teams
    const teams = {
      'ECON42': {
        code: 'ECON42',
        name: 'Economics Study Group',
        createdBy: 'user_demo_12345',
        createdAt: new Date('2024-01-05').toISOString(),
        members: ['user_demo_12345', 'user_alex_789', 'user_maria_456', 'user_james_321'],
        whispers: []
      },
      'STUDY1': {
        code: 'STUDY1',
        name: 'Accessibility Research Team',
        createdBy: 'user_maria_456',
        createdAt: new Date('2024-01-10').toISOString(),
        members: ['user_demo_12345', 'user_maria_456', 'user_priya_654'],
        whispers: []
      }
    };
    
    // 3. Create demo whispers for the Carnegie article
    const articleUrl = 'https://carnegieendowment.org/china-financial-markets/2023/12/what-will-it-take-for-chinas-gdp-to-grow-at-4-5-percent-over-the-next-decade?lang=en';
    
    const demoWhispers = [
      {
        id: 'whisper_1',
        audioData: null,
        transcript: "This is a key point about China's investment share of GDP",
        selectedText: "China, however, is a huge outlier. It currently invests 42–44 percent of its GDP.",
        color: 'pink',
        position: { x: 300, y: 500 },
        timestamp: new Date('2024-01-15T10:30:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_alex_789',
        sharedByUsername: 'Alex Kumar',
        sharedAt: new Date('2024-01-15T10:30:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_2',
        audioData: null,
        transcript: "Wait, this seems confusing. Need to review this section again.",
        selectedText: "if China maintained annual GDP growth rates of 4–5 percent",
        color: 'lavender',
        position: { x: 320, y: 800 },
        timestamp: new Date('2024-01-15T11:00:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_maria_456',
        sharedByUsername: 'Maria Rodriguez',
        sharedAt: new Date('2024-01-15T11:00:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_3',
        audioData: null,
        transcript: "Important statistic for our presentation!",
        selectedText: "China comprises only 13 percent of global consumption and an astonishing 32 percent of global investment",
        color: 'mint',
        position: { x: 310, y: 650 },
        timestamp: new Date('2024-01-15T11:15:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_james_321',
        sharedByUsername: 'James Wilson',
        sharedAt: new Date('2024-01-15T11:15:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_4',
        audioData: null,
        transcript: "This contradicts what we learned in class",
        selectedText: "if China maintained annual GDP growth rates of 4–5 percent",
        color: 'peach',
        position: { x: 315, y: 800 },
        timestamp: new Date('2024-01-15T12:00:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_priya_654',
        sharedByUsername: 'Priya Patel',
        sharedAt: new Date('2024-01-15T12:00:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_5',
        audioData: null,
        transcript: "Great explanation here",
        selectedText: "The Arithmetic of Investment-Driven GDP Growth",
        color: 'sky',
        position: { x: 300, y: 400 },
        timestamp: new Date('2024-01-15T12:30:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_demo_12345',
        sharedByUsername: 'Sarah Chen',
        sharedAt: new Date('2024-01-15T12:30:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_6',
        audioData: null,
        transcript: "Most confusing part",
        selectedText: "if China maintained annual GDP growth rates of 4–5 percent",
        color: 'pink',
        position: { x: 325, y: 800 },
        timestamp: new Date('2024-01-15T13:00:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_alex_789',
        sharedByUsername: 'Alex Kumar',
        sharedAt: new Date('2024-01-15T13:00:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_7',
        audioData: null,
        transcript: "Compare with World Bank data",
        selectedText: "Globally, according to the World Bank, investment represents on average 25 percent",
        color: 'lavender',
        position: { x: 305, y: 550 },
        timestamp: new Date('2024-01-15T13:30:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_maria_456',
        sharedByUsername: 'Maria Rodriguez',
        sharedAt: new Date('2024-01-15T13:30:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_8',
        audioData: null,
        transcript: "This explains why China is different",
        selectedText: "China, however, is a huge outlier. It currently invests 42–44 percent of its GDP.",
        color: 'mint',
        position: { x: 295, y: 500 },
        timestamp: new Date('2024-01-15T14:00:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_james_321',
        sharedByUsername: 'James Wilson',
        sharedAt: new Date('2024-01-15T14:00:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_9',
        audioData: null,
        transcript: "Key takeaway for exam",
        selectedText: "China comprises only 13 percent of global consumption and an astonishing 32 percent of global investment",
        color: 'peach',
        position: { x: 315, y: 650 },
        timestamp: new Date('2024-01-15T14:30:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_priya_654',
        sharedByUsername: 'Priya Patel',
        sharedAt: new Date('2024-01-15T14:30:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_10',
        audioData: null,
        transcript: "Really struggling here",
        selectedText: "if China maintained annual GDP growth rates of 4–5 percent",
        color: 'sky',
        position: { x: 330, y: 800 },
        timestamp: new Date('2024-01-15T15:00:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_alex_789',
        sharedByUsername: 'Alex Kumar',
        sharedAt: new Date('2024-01-15T15:00:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_11',
        audioData: null,
        transcript: "Most important statistic",
        selectedText: "China comprises only 13 percent of global consumption and an astonishing 32 percent of global investment",
        color: 'pink',
        position: { x: 308, y: 650 },
        timestamp: new Date('2024-01-15T15:30:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_maria_456',
        sharedByUsername: 'Maria Rodriguez',
        sharedAt: new Date('2024-01-15T15:30:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_12',
        audioData: null,
        transcript: "Professor mentioned this",
        selectedText: "China, however, is a huge outlier. It currently invests 42–44 percent of its GDP.",
        color: 'lavender',
        position: { x: 305, y: 500 },
        timestamp: new Date('2024-01-15T16:00:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_james_321',
        sharedByUsername: 'James Wilson',
        sharedAt: new Date('2024-01-15T16:00:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_13',
        audioData: null,
        transcript: "Need help understanding",
        selectedText: "if China maintained annual GDP growth rates of 4–5 percent",
        color: 'mint',
        position: { x: 318, y: 800 },
        timestamp: new Date('2024-01-15T16:30:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_priya_654',
        sharedByUsername: 'Priya Patel',
        sharedAt: new Date('2024-01-15T16:30:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_14',
        audioData: null,
        transcript: "Critical section",
        selectedText: "if China maintained annual GDP growth rates of 4–5 percent",
        color: 'peach',
        position: { x: 312, y: 800 },
        timestamp: new Date('2024-01-15T17:00:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_demo_12345',
        sharedByUsername: 'Sarah Chen',
        sharedAt: new Date('2024-01-15T17:00:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'whisper_15',
        audioData: null,
        transcript: "Compare with Japan's history",
        selectedText: "China comprises only 13 percent of global consumption and an astonishing 32 percent of global investment",
        color: 'sky',
        position: { x: 318, y: 650 },
        timestamp: new Date('2024-01-15T17:30:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_alex_789',
        sharedByUsername: 'Alex Kumar',
        sharedAt: new Date('2024-01-15T17:30:00').toISOString(),
        teamCode: 'ECON42'
      }
    ];
    
    // Add whispers to teams
    teams['ECON42'].whispers = demoWhispers;
    await chrome.storage.local.set({ teams });
    await chrome.storage.local.set({ currentTeamCode: 'ECON42' });
    
    // Also save as regular whispers for community heatmap
    await chrome.storage.local.set({ [articleUrl]: demoWhispers });
    
    // Mark demo data as loaded
    await chrome.storage.local.set({ demoDataLoaded: true });
    
    console.log('✅ Demo data loaded successfully!');
    console.log('📊 15 annotations created on Carnegie article');
    console.log('👥 Teams: ECON42 (4 members), STUDY1 (3 members)');
    console.log('📈 Stats: 47 whispers, 23 shared, 15 articles, 31 contributions');
  } catch (error) {
    console.error('Error loading demo data:', error);
  }
}

// Load teams
async function loadTeams() {
  try {
    const teams = await teamService.getUserTeams();
    const teamList = document.getElementById('teamList');
    
    if (teams.length === 0) {
      teamList.innerHTML = '<p class="help-text">No teams yet. Create or join a team to collaborate!</p>';
      return;
    }
    
    const currentTeam = await teamService.getCurrentTeam();
    
    teamList.innerHTML = teams.map(team => `
      <div class="team-card ${currentTeam && currentTeam.code === team.code ? 'active' : ''}" data-code="${team.code}">
        <div class="team-card-header">
          <div class="team-card-info">
            <span class="team-name">${team.name}</span>
            <span class="team-code">${team.code}</span>
          </div>
          <button class="team-delete-btn" data-code="${team.code}" title="Leave team" aria-label="Leave team ${team.name}">
            🗑️
          </button>
        </div>
        <div class="team-meta">
          ${team.members.length} member${team.members.length > 1 ? 's' : ''} • ${team.whispers.length} whisper${team.whispers.length > 1 ? 's' : ''}
        </div>
      </div>
    `).join('');
    
    // Add click handlers for team cards
    document.querySelectorAll('.team-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't activate team if clicking delete button
        if (!e.target.classList.contains('team-delete-btn')) {
          setActiveTeam(card.dataset.code);
        }
      });
    });
    
    // Add delete button handlers
    document.querySelectorAll('.team-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent team activation
        const teamCode = btn.dataset.code;
        const team = teams.find(t => t.code === teamCode);
        
        if (confirm(`Leave team "${team.name}"? You can rejoin later with the code ${teamCode}.`)) {
          await leaveTeam(teamCode);
        }
      });
    });
  } catch (error) {
    console.error('Error loading teams:', error);
  }
}

// Show create team form
function showCreateTeamForm() {
  const createForm = document.getElementById('createTeamForm');
  const joinForm = document.getElementById('joinTeamForm');
  
  if (createForm.style.display === 'none') {
    createForm.style.display = 'flex';
    joinForm.style.display = 'none';
    document.getElementById('teamNameInput').focus();
  } else {
    createForm.style.display = 'none';
  }
}

// Show join team form
function showJoinTeamForm() {
  const createForm = document.getElementById('createTeamForm');
  const joinForm = document.getElementById('joinTeamForm');
  
  if (joinForm.style.display === 'none') {
    joinForm.style.display = 'flex';
    createForm.style.display = 'none';
    document.getElementById('teamCodeInput').focus();
  } else {
    joinForm.style.display = 'none';
  }
}

// Create team
async function createTeam() {
  const teamName = document.getElementById('teamNameInput').value.trim();
  
  if (!teamName) {
    alert('Please enter a team name');
    return;
  }
  
  try {
    const team = await teamService.createTeam(teamName);
    
    // Show success message
    alert(`Team created! Share this code with your team: ${team.code}`);
    
    // Reset form
    document.getElementById('teamNameInput').value = '';
    document.getElementById('createTeamForm').style.display = 'none';
    
    // Reload teams
    await loadTeams();
    await loadUserProfile();
  } catch (error) {
    console.error('Error creating team:', error);
    alert('Error creating team. Please try again.');
  }
}

// Join team
async function joinTeam() {
  const teamCode = document.getElementById('teamCodeInput').value.trim().toUpperCase();
  
  if (!teamCode || teamCode.length !== 6) {
    alert('Please enter a valid 6-character team code');
    return;
  }
  
  try {
    const team = await teamService.joinTeam(teamCode);
    
    // Show success message
    alert(`Successfully joined team: ${team.name}`);
    
    // Reset form
    document.getElementById('teamCodeInput').value = '';
    document.getElementById('joinTeamForm').style.display = 'none';
    
    // Reload teams
    await loadTeams();
    await loadUserProfile();
  } catch (error) {
    console.error('Error joining team:', error);
    alert('Team not found. Please check the code and try again.');
  }
}

// Leave team
async function leaveTeam(teamCode) {
  try {
    await teamService.leaveTeam(teamCode);
    
    // Reload teams and profile
    await loadTeams();
    await loadUserProfile();
    
    // Show success message
    console.log('Successfully left team');
  } catch (error) {
    console.error('Error leaving team:', error);
    alert('Failed to leave team. Please try again.');
  }
}

// Set active team
async function setActiveTeam(teamCode) {
  try {
    await teamService.setActiveTeam(teamCode);
    currentTeamCode = teamCode;
    
    // Update UI
    await loadTeams();
    await loadTeamWhispersForCurrentPage();
    
    // If heatmap is enabled and in team mode, refresh it
    if (heatmapEnabled && heatmapMode === 'team') {
      await toggleHeatmap();
      await toggleHeatmap();
    }
  } catch (error) {
    console.error('Error setting active team:', error);
  }
}

// Load team whispers for the current page
async function loadTeamWhispersForCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    
    const currentTeam = await teamService.getCurrentTeam();
    if (!currentTeam) {
      document.getElementById('teamWhispersSection').style.display = 'none';
      return;
    }
    
    // Get team whispers for this page
    const teamWhispers = await teamService.getTeamWhispersForPage(tab.url, currentTeam.code);
    
    const section = document.getElementById('teamWhispersSection');
    const list = document.getElementById('teamWhispersList');
    const count = document.getElementById('teamWhispersCount');
    
    if (teamWhispers.length === 0) {
      section.style.display = 'block';
      list.innerHTML = '<p class="help-text">No team annotations on this page yet.</p>';
      count.textContent = '0 annotations';
      return;
    }
    
    section.style.display = 'block';
    count.textContent = `${teamWhispers.length} annotation${teamWhispers.length > 1 ? 's' : ''}`;
    
    list.innerHTML = teamWhispers.map(whisper => {
      const date = new Date(whisper.sharedAt || whisper.timestamp);
      const timeAgo = getTimeAgo(date);
      
      return `
        <div class="team-whisper-item" data-whisper-id="${whisper.id}">
          <div class="team-whisper-header">
            <span class="team-whisper-user">👤 ${whisper.sharedByUsername || 'Team Member'}</span>
            <span class="team-whisper-time">${timeAgo}</span>
          </div>
          <div class="team-whisper-transcript">
            "${whisper.transcript || 'No transcription available'}"
          </div>
          <div class="team-whisper-actions">
            <button class="btn-jump-to" data-whisper-id="${whisper.id}">
              📍 Jump to Annotation
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    list.querySelectorAll('.btn-jump-to').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const whisperId = btn.dataset.whisperId;
        
        // Send message to content script to scroll to whisper
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, {
          action: 'scrollToWhisperById',
          whisperId: whisperId
        });
        
        // Close popup
        window.close();
      });
    });
    
    // Make whole item clickable to show transcript
    list.querySelectorAll('.team-whisper-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-jump-to')) {
          const whisperId = item.dataset.whisperId;
          const whisper = teamWhispers.find(w => w.id === whisperId);
          if (whisper && whisper.audioUrl) {
            playNote(whisper);
          }
        }
      });
    });
    
  } catch (error) {
    console.error('Error loading team whispers:', error);
  }
}

// Helper function to get time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Load demo bubbles for Carnegie article
async function loadDemoBubblesForCarnegie() {
  const btn = document.getElementById('loadDemoDataBtn');
  btn.textContent = '⏳ Loading...';
  btn.disabled = true;
  
  try {
    const articleUrl = 'https://carnegieendowment.org/china-financial-markets/2023/12/what-will-it-take-for-chinas-gdp-to-grow-at-4-5-percent-over-the-next-decade?lang=en';
    
    const demoWhispers = [
      {
        id: 'demo_whisper_1',
        audioUrl: null,
        transcript: "This is a key point about China's investment share of GDP",
        color: 'pink',
        position: { x: 300, y: 500 },
        timestamp: new Date('2024-01-15T10:30:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_alex_789',
        sharedByUsername: 'Alex Kumar',
        sharedAt: new Date('2024-01-15T10:30:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'demo_whisper_2',
        audioUrl: null,
        transcript: "Wait, this seems confusing. Need to review this section again.",
        color: 'lavender',
        position: { x: 320, y: 800 },
        timestamp: new Date('2024-01-15T11:00:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_maria_456',
        sharedByUsername: 'Maria Rodriguez',
        sharedAt: new Date('2024-01-15T11:00:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'demo_whisper_3',
        audioUrl: null,
        transcript: "Important statistic for our presentation!",
        color: 'mint',
        position: { x: 310, y: 650 },
        timestamp: new Date('2024-01-15T11:15:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_james_321',
        sharedByUsername: 'James Wilson',
        sharedAt: new Date('2024-01-15T11:15:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'demo_whisper_4',
        audioUrl: null,
        transcript: "This contradicts what we learned in class. Need to ask professor.",
        color: 'peach',
        position: { x: 315, y: 900 },
        timestamp: new Date('2024-01-15T12:00:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_priya_654',
        sharedByUsername: 'Priya Patel',
        sharedAt: new Date('2024-01-15T12:00:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'demo_whisper_5',
        audioUrl: null,
        transcript: "Great explanation of the arithmetic here",
        color: 'sky',
        position: { x: 300, y: 400 },
        timestamp: new Date('2024-01-15T12:30:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_demo_12345',
        sharedByUsername: 'Sarah Chen',
        sharedAt: new Date('2024-01-15T12:30:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'demo_whisper_6',
        audioUrl: null,
        transcript: "This is the most confusing part of the article",
        color: 'pink',
        position: { x: 325, y: 850 },
        timestamp: new Date('2024-01-15T13:00:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_alex_789',
        sharedByUsername: 'Alex Kumar',
        sharedAt: new Date('2024-01-15T13:00:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'demo_whisper_7',
        audioUrl: null,
        transcript: "Compare this with the World Bank data",
        color: 'lavender',
        position: { x: 305, y: 550 },
        timestamp: new Date('2024-01-15T13:30:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_maria_456',
        sharedByUsername: 'Maria Rodriguez',
        sharedAt: new Date('2024-01-15T13:30:00').toISOString(),
        teamCode: 'ECON42'
      },
      {
        id: 'demo_whisper_8',
        audioUrl: null,
        transcript: "This explains why China is different from other economies",
        color: 'mint',
        position: { x: 295, y: 520 },
        timestamp: new Date('2024-01-15T14:00:00').toISOString(),
        url: articleUrl,
        sharedBy: 'user_james_321',
        sharedByUsername: 'James Wilson',
        sharedAt: new Date('2024-01-15T14:00:00').toISOString(),
        teamCode: 'ECON42'
      }
    ];
    
    // Save to storage
    await chrome.storage.local.set({ [articleUrl]: demoWhispers });
    
    // Update team whispers
    const { teams } = await chrome.storage.local.get(['teams']);
    if (teams && teams['ECON42']) {
      teams['ECON42'].whispers = demoWhispers;
      await chrome.storage.local.set({ teams });
    }
    
    btn.textContent = '✅ Demo Bubbles Loaded!';
    setTimeout(() => {
      btn.textContent = '🎭 Load Demo Bubbles (Carnegie Article)';
      btn.disabled = false;
    }, 2000);
    
    alert('✅ Demo bubbles loaded!\n\n📍 Go to the Carnegie article and refresh the page to see 8 bubbles!\n\n🔗 https://carnegieendowment.org/china-financial-markets/2023/12/what-will-it-take-for-chinas-gdp-to-grow-at-4-5-percent-over-the-next-decade?lang=en');
    
  } catch (error) {
    console.error('Error loading demo bubbles:', error);
    btn.textContent = '❌ Error - Try Again';
    btn.disabled = false;
  }
}

// Toggle heatmap
async function toggleHeatmap() {
  const checkbox = document.getElementById('heatmapToggle');
  heatmapEnabled = checkbox.checked;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      console.error('No active tab');
      checkbox.checked = false;
      return;
    }
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'toggleHeatmap',
      enabled: heatmapEnabled,
      mode: heatmapMode,
      teamCode: currentTeamCode
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error toggling heatmap:', chrome.runtime.lastError);
        checkbox.checked = false;
      }
    });
  } catch (error) {
    console.error('Error toggling heatmap:', error);
    checkbox.checked = false;
  }
}

// Switch heatmap mode
async function switchHeatmapMode(mode) {
  heatmapMode = mode;
  
  // Update UI
  document.querySelectorAll('.heatmap-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  // If heatmap is enabled, refresh it with new mode
  if (heatmapEnabled) {
    await toggleHeatmap();
    document.getElementById('heatmapToggle').checked = true;
    await toggleHeatmap();
  }
}

// Update stats when whisper is created
async function updateWhisperStats() {
  await teamService.updateStats('totalWhispers');
  await loadUserProfile();
}

// Share whisper with team
async function shareWhisperWithTeam(whisper) {
  if (!currentTeamCode) {
    alert('Please select a team first');
    return;
  }
  
  try {
    await teamService.shareWhisperWithTeam(whisper, currentTeamCode);
    await loadUserProfile();
    await loadTeams();
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.textContent = '✓ Whisper shared with team!';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #d8769e 0%, #c589b5 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  } catch (error) {
    console.error('Error sharing whisper:', error);
    alert('Error sharing whisper. Please try again.');
  }
}

