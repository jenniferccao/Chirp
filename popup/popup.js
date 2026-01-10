let mediaRecorder;
let audioChunks = [];
let recording = false;
let timerInterval;
let seconds = 0;
let selectedColor = 'pink';

// Check for API key on load
chrome.storage.local.get(['elevenLabsApiKey'], (result) => {
  if (result.elevenLabsApiKey) {
    document.getElementById('apiKeySection').style.display = 'none';
    document.getElementById('mainSection').style.display = 'block';
    loadNotes();
  }
});

// Save API key
document.getElementById('saveApiKey').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (apiKey) {
    chrome.storage.local.set({ elevenLabsApiKey: apiKey }, () => {
      document.getElementById('apiKeySection').style.display = 'none';
      document.getElementById('mainSection').style.display = 'block';
      loadNotes();
    });
  }
});

// Color picker
document.querySelectorAll('.color-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
    option.classList.add('active');
    selectedColor = option.dataset.color;
  });
});

// Record button
document.getElementById('recordBtn').addEventListener('click', async () => {
  if (!recording) {
    startRecording();
  } else {
    stopRecording();
  }
});

// Cancel button
document.getElementById('cancelBtn').addEventListener('click', () => {
  audioChunks = [];
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('recordBtn').disabled = false;
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    recording = true;

    document.getElementById('recordBtnText').textContent = 'Stop Recording';
    document.getElementById('recordBtn').classList.add('recording');
    document.getElementById('recordVisual').classList.add('recording');

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

function stopRecording() {
  if (mediaRecorder && recording) {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    recording = false;
    clearInterval(timerInterval);

    document.getElementById('recordBtnText').textContent = 'Start Recording';
    document.getElementById('recordBtn').classList.remove('recording');
    document.getElementById('recordVisual').classList.remove('recording');
    document.getElementById('timer').textContent = '0:00';
  }
}

async function processAudio(audioBlob) {
  // Convert blob to base64
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  reader.onloadend = async () => {
    const base64Audio = reader.result;
    
    // For MVP: Store raw audio, optionally enhance with ElevenLabs later
    // Show preview section
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('recordBtn').disabled = true;
    
    // Send message to content script to enable placement mode
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, {
      action: 'enablePlacement',
      audioData: base64Audio,
      color: selectedColor
    });
  };
}

async function loadNotes() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url).hostname + new URL(tab.url).pathname;
  
  chrome.storage.local.get([url], (result) => {
    const notes = result[url] || [];
    displayNotes(notes);
  });
}

function displayNotes(notes) {
  const container = document.getElementById('notesContainer');
  
  if (notes.length === 0) {
    container.innerHTML = '<p style="color: #888; font-size: 12px;">No whispers yet on this page</p>';
    return;
  }
  
  container.innerHTML = notes.map((note, index) => `
    <div class="note-item">
      <div class="note-info">
        <div style="color: ${getColorValue(note.color)};">● Whisper #${index + 1}</div>
        <div style="font-size: 10px; color: #aaa;">${new Date(note.timestamp).toLocaleString()}</div>
      </div>
      <div class="note-actions">
        <button class="note-btn" onclick="playNote(${index})">▶️</button>
        <button class="note-btn" onclick="deleteNote(${index})">🗑️</button>
      </div>
    </div>
  `).join('');
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

window.playNote = async (index) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {
    action: 'playNote',
    index: index
  });
};

window.deleteNote = async (index) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url).hostname + new URL(tab.url).pathname;
  
  chrome.storage.local.get([url], (result) => {
    const notes = result[url] || [];
    notes.splice(index, 1);
    chrome.storage.local.set({ [url]: notes }, () => {
      loadNotes();
      chrome.tabs.sendMessage(tab.id, { action: 'refreshBubbles' });
    });
  });
};