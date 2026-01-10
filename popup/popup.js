let mediaRecorder;
let audioChunks = [];
let recording = false;
let timerInterval;
let seconds = 0;
let selectedColor = 'pink';
let audioMotion;

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

// Check for API key on load
chrome.storage.local.get(['elevenLabsApiKey'], (result) => {
  if (result.elevenLabsApiKey) {
    document.getElementById('apiKeySection').style.display = 'none';
    document.getElementById('mainSection').style.display = 'block';
    loadNotes();
    initializeVisualizer();
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
      initializeVisualizer();
    });
  }
});

// Setup global spacebar control
setupSpacebarControl();

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
  stopAudio(); // Stop any playing audio
  audioChunks = [];
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('recordBtn').disabled = false;
});

// Audio cropping event listeners
document.getElementById('saveAudioBtn').addEventListener('click', saveAudio);
document.getElementById('resetCropBtn').addEventListener('click', resetCrop);

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
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    audioMotion = new AudioMotionAnalyzer(canvas, {
      audioCtx: audioContext,
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
    // Fallback: create simple canvas animation
    setupFallbackVisualizer(canvas);
  }
}

// Fallback visualizer using simple canvas animations
function setupFallbackVisualizer(canvas) {
  const ctx = canvas.getContext('2d');
  let animationId;
  let isAnimating = false;
  
  window.startFallbackAnimation = () => {
    if (isAnimating) return;
    isAnimating = true;
    
    function animate() {
      if (!isAnimating) return;
      
      ctx.clearRect(0, 0, 100, 100);
      
      const time = Date.now() * 0.005;
      const centerX = 50;
      const centerY = 50;
      
      // Draw animated circles
      for (let i = 0; i < 3; i++) {
        const radius = 10 + Math.sin(time + i) * 8;
        const opacity = 0.3 + Math.sin(time + i * 0.5) * 0.3;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + i * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, ${100 + i * 50}, 200, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      animationId = requestAnimationFrame(animate);
    }
    
    animate();
  };
  
  window.stopFallbackAnimation = () => {
    isAnimating = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    ctx.clearRect(0, 0, 100, 100);
  };
}

// Audio cropping functions
async function initializeAudioCropping(audioBlob) {
  try {
    // Initialize audio context if not exists
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    audioDuration = audioBuffer.duration;
    cropStartTime = 0;
    cropEndTime = audioDuration;
    
    // Draw waveform
    drawWaveform();
    updateCropRegion();
    updateCropInfo();
    
    // Add event listeners for dragging
    setupCropHandlers();
    
  } catch (error) {
    console.error('Error initializing audio cropping:', error);
  }
}

function drawWaveform() {
  const canvas = document.getElementById('waveformCanvas');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
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

function setupCropHandlers() {
  const canvas = document.getElementById('waveformCanvas');
  const startHandle = document.getElementById('cropStart');
  const endHandle = document.getElementById('cropEnd');
  
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
    // Determine which handle is closer
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

function updateCropRegion() {
  const container = document.querySelector('.waveform-container');
  const region = document.getElementById('cropRegion');
  const startHandle = document.getElementById('cropStart');
  const endHandle = document.getElementById('cropEnd');
  
  const containerWidth = container.offsetWidth - 10; // Account for padding
  
  const startPercent = (cropStartTime / audioDuration) * 100;
  const endPercent = (cropEndTime / audioDuration) * 100;
  
  startHandle.style.left = startPercent + '%';
  endHandle.style.left = endPercent + '%';
  
  region.style.left = startPercent + '%';
  region.style.width = (endPercent - startPercent) + '%';
}

function updateCropInfo() {
  const duration = cropEndTime - cropStartTime;
  document.getElementById('cropDuration').textContent = `Duration: ${duration.toFixed(1)}s`;
}

async function playCroppedAudio() {
  if (!audioBuffer) return;
  
  // Stop current playback if any
  stopAudio();
  
  try {
    currentAudioSource = audioContext.createBufferSource();
    currentAudioSource.buffer = audioBuffer;
    currentAudioSource.connect(audioContext.destination);
    
    const duration = cropEndTime - cropStartTime;
    
    // Set up playback end callback
    currentAudioSource.onended = () => {
      stopAudio();
    };
    
    // Start playback
    currentAudioSource.start(0, cropStartTime, duration);
    
    // Start progress tracking
    isPlaying = true;
    playbackStartTime = audioContext.currentTime;
    startProgressTracking();
    
  } catch (error) {
    console.error('Error playing cropped audio:', error);
    stopAudio();
  }
}

function stopAudio() {
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
    } catch (e) {
      // Audio might already be stopped
    }
    currentAudioSource = null;
  }
  
  isPlaying = false;
  
  // Hide progress bar
  const progressBar = document.getElementById('playbackProgress');
  if (progressBar) {
    progressBar.classList.remove('playing');
  }
  
  // Stop animation
  if (playbackAnimationId) {
    cancelAnimationFrame(playbackAnimationId);
    playbackAnimationId = null;
  }
}

function startProgressTracking() {
  const progressBar = document.getElementById('playbackProgress');
  if (!progressBar) return;
  
  progressBar.classList.add('playing');
  
  function updateProgress() {
    if (!isPlaying) return;
    
    const elapsed = audioContext.currentTime - playbackStartTime;
    const duration = cropEndTime - cropStartTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Calculate position within the crop region
    const cropWidth = (cropEndTime - cropStartTime) / audioDuration;
    const cropStart = cropStartTime / audioDuration;
    const position = (cropStart + progress * cropWidth) * 100;
    
    progressBar.style.left = position + '%';
    
    if (progress < 1 && isPlaying) {
      playbackAnimationId = requestAnimationFrame(updateProgress);
    } else {
      stopAudio();
    }
  }
  
  playbackAnimationId = requestAnimationFrame(updateProgress);
}

function setupSpacebarControl() {
  // Add keydown listener
  document.addEventListener('keydown', (e) => {
    // Only activate when crop section is visible
    const previewSection = document.getElementById('previewSection');
    const cropSection = document.getElementById('audioCropSection');
    
    // Check if preview section is visible and crop section exists
    if (!previewSection || previewSection.style.display === 'none' || !cropSection || !audioBuffer) {
      return;
    }
    
    if (e.code === 'Space') {
      e.preventDefault();
      
      if (isPlaying) {
        stopAudio();
      } else {
        playCroppedAudio();
      }
    }
  });
}

function resetCrop() {
  stopAudio(); // Stop any playing audio
  cropStartTime = 0;
  cropEndTime = audioDuration;
  updateCropRegion();
  updateCropInfo();
}

async function saveAudio() {
  stopAudio(); // Stop any playing audio
  
  try {
    // Create cropped audio buffer
    const croppedLength = Math.floor((cropEndTime - cropStartTime) * audioBuffer.sampleRate);
    const croppedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      croppedLength,
      audioBuffer.sampleRate
    );
    
    // Copy cropped audio data
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const originalData = audioBuffer.getChannelData(channel);
      const croppedData = croppedBuffer.getChannelData(channel);
      const startSample = Math.floor(cropStartTime * audioBuffer.sampleRate);
      
      for (let i = 0; i < croppedLength; i++) {
        croppedData[i] = originalData[startSample + i] || 0;
      }
    }
    
    // Convert buffer to blob
    const croppedBlob = await bufferToBlob(croppedBuffer);
    
    // Get chirp name from input
    const chirpName = document.getElementById('chirpName').value.trim() || `Chirp ${Date.now()}`;
    
    // Convert to base64 and send to content script
    const reader = new FileReader();
    reader.readAsDataURL(croppedBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, {
        action: 'enablePlacement',
        audioData: base64Audio,
        color: selectedColor,
        name: chirpName
      });
    };
    
  } catch (error) {
    console.error('Error processing audio:', error);
    // Fallback to original audio
    const chirpName = document.getElementById('chirpName').value.trim() || `Chirp ${Date.now()}`;
    
    const reader = new FileReader();
    reader.readAsDataURL(currentAudioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, {
        action: 'enablePlacement',
        audioData: base64Audio,
        color: selectedColor,
        name: chirpName
      });
    };
  }
}

// Helper function to convert AudioBuffer to Blob
async function bufferToBlob(buffer) {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  
  // Create WAV file
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    recording = true;

    // Connect audio stream to visualizer
    if (audioMotion) {
      try {
        // Connect the stream to the visualizer
        await audioMotion.connectInput(stream);
        console.log('Visualizer connected to audio stream');
      } catch (error) {
        console.error('Error connecting visualizer:', error);
        // Use fallback animation
        if (typeof startFallbackAnimation === 'function') {
          startFallbackAnimation();
        }
      }
    } else {
      console.warn('Visualizer not initialized, using fallback');
      // Use fallback animation
      if (typeof startFallbackAnimation === 'function') {
        startFallbackAnimation();
      }
    }

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
    
    let errorMessage = 'Could not access microphone. ';
    
    if (error.name === 'NotAllowedError') {
      errorMessage += 'Please allow microphone access in your browser settings and reload the extension.';
    } else if (error.name === 'NotFoundError') {
      errorMessage += 'No microphone found. Please check your audio devices.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage += 'Audio recording is not supported in this browser.';
    } else {
      errorMessage += 'Please check permissions and try again.';
    }
    
    alert(errorMessage);
  }
}

function stopRecording() {
  if (mediaRecorder && recording) {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    recording = false;
    clearInterval(timerInterval);

    // Disconnect visualizer
    if (audioMotion) {
      try {
        audioMotion.disconnectInput();
        console.log('Visualizer disconnected');
      } catch (error) {
        console.error('Error disconnecting visualizer:', error);
      }
    }

    // Stop fallback animation if it's running
    if (typeof stopFallbackAnimation === 'function') {
      stopFallbackAnimation();
    }

    document.getElementById('recordBtnText').textContent = 'Start Recording';
    document.getElementById('recordBtn').classList.remove('recording');
    document.getElementById('recordVisual').classList.remove('recording');
    document.getElementById('timer').textContent = '0:00';
  }
}

async function processAudio(audioBlob) {
  currentAudioBlob = audioBlob;
  
  // Get note count for default name
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url).hostname + new URL(tab.url).pathname;
  
  chrome.storage.local.get([url], (result) => {
    const notes = result[url] || [];
    const defaultName = `Chirp ${notes.length + 1}`;
    const chirpInput = document.getElementById('chirpName');
    chirpInput.value = defaultName;
    chirpInput.placeholder = defaultName;
    
    // Focus and select the input for easy editing
    setTimeout(() => {
      chirpInput.focus();
      chirpInput.select();
    }, 100);
  });
  
  // Show preview section
  document.getElementById('previewSection').style.display = 'block';
  document.getElementById('recordBtn').disabled = true;
  
  // Initialize audio cropping
  await initializeAudioCropping(audioBlob);
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
        <div style="color: ${getColorValue(note.color)}; cursor: pointer; font-weight: 500;" onclick="editNoteName(${index}, '${(note.name || `Chirp ${index + 1}`).replace(/'/g, "\\'")}')" title="Click to rename">● ${note.name || `Chirp ${index + 1}`}</div>
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

window.editNoteName = async (index, currentName) => {
  const newName = prompt('Rename this chirp:', currentName);
  if (newName === null || newName.trim() === '') return;
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url).hostname + new URL(tab.url).pathname;
  
  chrome.storage.local.get([url], (result) => {
    const notes = result[url] || [];
    if (notes[index]) {
      notes[index].name = newName.trim();
      chrome.storage.local.set({ [url]: notes }, () => {
        loadNotes();
      });
    }
  });
};

