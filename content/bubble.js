// Content script for Sticky Whispers
let placementMode = false;
let pendingNote = null;
let currentlyPlaying = null;

// Load and display bubbles on page load
window.addEventListener('load', () => {
  loadBubbles();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enablePlacement') {
    enablePlacementMode(request.audioData, request.color);
  } else if (request.action === 'playNote') {
    playNoteByIndex(request.index);
  } else if (request.action === 'refreshBubbles') {
    clearBubbles();
    loadBubbles();
  }
});

function enablePlacementMode(audioData, color) {
  placementMode = true;
  pendingNote = { audioData, color };
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'whisper-overlay';
  overlay.id = 'whisperOverlay';
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'whisper-tooltip';
  tooltip.textContent = '✨ Click anywhere to place your whisper!';
  
  document.body.appendChild(overlay);
  document.body.appendChild(tooltip);
  
  // Handle click to place
  overlay.addEventListener('click', (e) => {
    placeNote(e.clientX + window.scrollX, e.clientY + window.scrollY);
    overlay.remove();
    tooltip.remove();
    placementMode = false;
  });
}

async function placeNote(x, y) {
  const url = window.location.hostname + window.location.pathname;
  
  // Get existing notes
  chrome.storage.local.get([url], (result) => {
    const notes = result[url] || [];
    
    // Add new note
    const newNote = {
      id: Date.now().toString(),
      position: { x, y },
      audioData: pendingNote.audioData,
      color: pendingNote.color,
      timestamp: new Date().toISOString()
    };
    
    notes.push(newNote);
    
    // Save to storage
    chrome.storage.local.set({ [url]: notes }, () => {
      createBubble(newNote);
      createSparkles(x, y);
    });
  });
}

function loadBubbles() {
  const url = window.location.hostname + window.location.pathname;
  
  chrome.storage.local.get([url], (result) => {
    const notes = result[url] || [];
    notes.forEach(note => createBubble(note));
  });
}

function createBubble(note) {
  const bubble = document.createElement('div');
  bubble.className = `whisper-bubble ${note.color}`;
  bubble.style.left = `${note.position.x}px`;
  bubble.style.top = `${note.position.y}px`;
  bubble.dataset.noteId = note.id;
  bubble.innerHTML = '🎙️';
  
  // Create delete button
  const deleteBtn = document.createElement('div');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteBubble(note.id);
  });
  bubble.appendChild(deleteBtn);
  
  // Make draggable
  makeDraggable(bubble, note);
  
  // Click to play
  bubble.addEventListener('click', () => {
    playNote(note);
  });
  
  document.body.appendChild(bubble);
}

function makeDraggable(bubble, note) {
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;
  
  bubble.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('delete-btn')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = bubble.offsetLeft;
    initialTop = bubble.offsetTop;
    bubble.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newLeft = initialLeft + dx;
    const newTop = initialTop + dy;
    
    bubble.style.left = `${newLeft}px`;
    bubble.style.top = `${newTop}px`;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      bubble.style.cursor = 'pointer';
      
      // Save new position
      note.position.x = bubble.offsetLeft;
      note.position.y = bubble.offsetTop;
      updateNotePosition(note);
    }
  });
}

function updateNotePosition(note) {
  const url = window.location.hostname + window.location.pathname;
  
  chrome.storage.local.get([url], (result) => {
    const notes = result[url] || [];
    const index = notes.findIndex(n => n.id === note.id);
    if (index !== -1) {
      notes[index] = note;
      chrome.storage.local.set({ [url]: notes });
    }
  });
}

function playNote(note) {
  const bubble = document.querySelector(`[data-note-id="${note.id}"]`);
  if (!bubble) return;
  
  // Stop any currently playing audio
  if (currentlyPlaying) {
    currentlyPlaying.pause();
    currentlyPlaying = null;
  }
  
  // Add playing animation
  bubble.classList.add('playing');
  
  // Create and play audio
  const audio = new Audio(note.audioData);
  currentlyPlaying = audio;
  
  audio.play();
  
  audio.addEventListener('ended', () => {
    bubble.classList.remove('playing');
    currentlyPlaying = null;
  });
}

function playNoteByIndex(index) {
  const url = window.location.hostname + window.location.pathname;
  
  chrome.storage.local.get([url], (result) => {
    const notes = result[url] || [];
    if (notes[index]) {
      playNote(notes[index]);
    }
  });
}

function deleteBubble(noteId) {
  const url = window.location.hostname + window.location.pathname;
  
  chrome.storage.local.get([url], (result) => {
    const notes = result[url] || [];
    const filtered = notes.filter(n => n.id !== noteId);
    
    chrome.storage.local.set({ [url]: filtered }, () => {
      const bubble = document.querySelector(`[data-note-id="${noteId}"]`);
      if (bubble) {
        bubble.style.animation = 'bubbleFadeIn 0.3s ease-out reverse';
        setTimeout(() => bubble.remove(), 300);
      }
    });
  });
}

function clearBubbles() {
  document.querySelectorAll('.whisper-bubble').forEach(bubble => bubble.remove());
}

function createSparkles(x, y) {
  for (let i = 0; i < 8; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'whisper-sparkle';
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    
    const angle = (Math.PI * 2 * i) / 8;
    const distance = 30 + Math.random() * 20;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    sparkle.style.setProperty('--tx', `${tx}px`);
    sparkle.style.setProperty('--ty', `${ty}px`);
    
    document.body.appendChild(sparkle);
    
    setTimeout(() => sparkle.remove(), 1000);
  }
}