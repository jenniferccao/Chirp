// Content script for Sticky Whispers
let placementMode = false;
let pendingNote = null;
let currentlyPlaying = null;
let selectedTextContext = null;
let highlightedElements = [];
let articleReader = null;
let accessibilityToolbarVisible = false;

// Load and display bubbles on page load
window.addEventListener('load', () => {
  loadBubbles();
  initializeAccessibility();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.action);
  
  if (request.action === 'enablePlacement') {
    enablePlacementMode(request.audioData, request.color, request.transcript);
    sendResponse({ success: true });
    return true;
  } else if (request.action === 'playNote') {
    playNoteByIndex(request.index);
  } else if (request.action === 'refreshBubbles') {
    clearBubbles();
    loadBubbles();
  } else if (request.action === 'playReadAloud') {
    playReadAloudAudio(request.audioData, request.text);
  } else if (request.action === 'showNotification') {
    showNotification(request.message);
  } else if (request.action === 'scrollToWhisper') {
    scrollToWhisperByText(request.searchText);
  } else if (request.action === 'scrollToWhisperById') {
    scrollToWhisperById(request.noteId);
  } else if (request.action === 'highlightWhisperText') {
    highlightAllWhisperTexts();
  }
});

function enablePlacementMode(audioData, color, transcript) {
  placementMode = true;
  
  // Capture any selected text on the page
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    selectedTextContext = {
      text: selection.toString().trim(),
      range: selection.getRangeAt(0).cloneRange()
    };
  }
  
  pendingNote = { audioData, color, transcript, selectedText: selectedTextContext };
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'whisper-overlay';
  overlay.id = 'whisperOverlay';
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'whisper-tooltip';
  
  let tooltipContent = '✨ Click anywhere to place your whisper!';
  
  // If there's selected text, show it
  if (selectedTextContext) {
    tooltipContent = `
      <div style="font-weight: bold;">✨ Click to place whisper with highlighted text!</div>
      <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">"${selectedTextContext.text.substring(0, 60)}${selectedTextContext.text.length > 60 ? '...' : ''}"</div>
    `;
  } else if (transcript) {
    tooltipContent = `
      <div style="font-weight: bold;">✨ Click anywhere to place your whisper!</div>
      <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">"${transcript.substring(0, 60)}${transcript.length > 60 ? '...' : ''}"</div>
    `;
  }
  
  tooltip.innerHTML = tooltipContent;
  
  document.body.appendChild(overlay);
  document.body.appendChild(tooltip);
  
  // Handle click to place
  overlay.addEventListener('click', (e) => {
    placeNote(e.clientX + window.scrollX, e.clientY + window.scrollY);
    overlay.remove();
    tooltip.remove();
    placementMode = false;
    selectedTextContext = null;
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
      transcript: pendingNote.transcript || null,
      selectedText: pendingNote.selectedText ? pendingNote.selectedText.text : null,
      timestamp: new Date().toISOString()
    };
    
    notes.push(newNote);
    
    // Save to storage
    chrome.storage.local.set({ [url]: notes }, () => {
      createBubble(newNote);
      createSparkles(x, y);
      
      // Highlight the selected text if it exists
      if (newNote.selectedText) {
        highlightTextOnPage(newNote.selectedText, newNote.id);
      }
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
  
  // Add title attribute with transcript if available
  if (note.transcript) {
    bubble.title = note.transcript;
  }
  
  // Create delete button
  const deleteBtn = document.createElement('div');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    deleteBubble(note.id);
  });
  bubble.appendChild(deleteBtn);
  
  // Create transcript preview tooltip (shows on hover)
  if (note.transcript) {
    const transcriptTooltip = document.createElement('div');
    transcriptTooltip.className = 'bubble-transcript-tooltip';
    transcriptTooltip.textContent = note.transcript;
    bubble.appendChild(transcriptTooltip);
  }
  
  // Click to play (use mouseup to avoid conflict with drag)
  let clickStartTime = 0;
  bubble.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('delete-btn')) return;
    clickStartTime = Date.now();
  });
  
  bubble.addEventListener('mouseup', (e) => {
    if (e.target.classList.contains('delete-btn')) return;
    const clickDuration = Date.now() - clickStartTime;
    // Only play if it was a quick click (not a drag)
    if (clickDuration < 300) {
      playNote(note);
    }
  });
  
  // Make draggable
  makeDraggable(bubble, note);
  
  document.body.appendChild(bubble);
}

function makeDraggable(bubble, note) {
  let isDragging = false;
  let hasMoved = false;
  let startX, startY, initialLeft, initialTop;
  
  bubble.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('delete-btn')) return;
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = bubble.offsetLeft;
    initialTop = bubble.offsetTop;
    bubble.style.cursor = 'grabbing';
    e.preventDefault(); // Prevent text selection
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    // Only consider it a drag if moved more than 5 pixels
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved = true;
      const newLeft = initialLeft + dx;
      const newTop = initialTop + dy;
      
      bubble.style.left = `${newLeft}px`;
      bubble.style.top = `${newTop}px`;
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      bubble.style.cursor = 'pointer';
      
      if (hasMoved) {
        // Save new position only if actually moved
        note.position.x = bubble.offsetLeft;
        note.position.y = bubble.offsetTop;
        updateNotePosition(note);
      }
      
      hasMoved = false;
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

// Read Aloud functionality
function playReadAloudAudio(audioData, text) {
  // Stop any currently playing audio
  if (currentlyPlaying) {
    currentlyPlaying.pause();
    currentlyPlaying = null;
  }
  
  // Create and play audio
  const audio = new Audio(audioData);
  currentlyPlaying = audio;
  
  // Show notification
  showNotification(`Reading: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
  
  audio.play();
  
  audio.addEventListener('ended', () => {
    currentlyPlaying = null;
  });
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'whisper-notification';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Fade in
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Fade out and remove
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Highlight text on page
function highlightTextOnPage(text, noteId) {
  const bodyText = document.body.innerText || document.body.textContent;
  
  if (!bodyText.includes(text)) {
    return; // Text not found on page
  }
  
  // Use TreeWalker to find text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    const nodeText = node.textContent;
    const index = nodeText.indexOf(text);
    
    if (index !== -1) {
      // Found the text, wrap it in a highlight span
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + text.length);
      
      const highlightSpan = document.createElement('span');
      highlightSpan.className = 'whisper-highlight';
      highlightSpan.dataset.noteId = noteId;
      highlightSpan.dataset.originalText = text;
      
      try {
        range.surroundContents(highlightSpan);
        highlightedElements.push(highlightSpan);
        
        // Add click handler to scroll to bubble
        highlightSpan.addEventListener('click', () => {
          const bubble = document.querySelector(`[data-note-id="${noteId}"]`);
          if (bubble) {
            bubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
            bubble.classList.add('pulse-highlight');
            setTimeout(() => bubble.classList.remove('pulse-highlight'), 2000);
          }
        });
      } catch (e) {
        console.log('Could not highlight text:', e);
      }
      
      break; // Only highlight first occurrence
    }
  }
}

// Highlight all whisper texts on page load
function highlightAllWhisperTexts() {
  const url = window.location.hostname + window.location.pathname;
  
  chrome.storage.local.get([url], (result) => {
    const notes = result[url] || [];
    
    // Clear existing highlights
    clearHighlights();
    
    // Highlight each note's selected text
    notes.forEach(note => {
      if (note.selectedText) {
        highlightTextOnPage(note.selectedText, note.id);
      }
    });
  });
}

// Clear all highlights
function clearHighlights() {
  highlightedElements.forEach(element => {
    const parent = element.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(element.textContent), element);
      parent.normalize(); // Merge adjacent text nodes
    }
  });
  highlightedElements = [];
}

// Scroll to whisper by ID (from popup list click)
function scrollToWhisperById(noteId) {
  const bubble = document.querySelector(`[data-note-id="${noteId}"]`);
  if (bubble) {
    // Scroll to bubble
    bubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Highlight bubble temporarily
    bubble.classList.add('pulse-highlight');
    setTimeout(() => bubble.classList.remove('pulse-highlight'), 2000);
    
    // Also highlight the text if it exists
    const highlight = document.querySelector(`[data-note-id="${noteId}"].whisper-highlight`);
    if (highlight) {
      highlight.classList.add('search-highlight-flash');
      setTimeout(() => highlight.classList.remove('search-highlight-flash'), 2000);
    }
  }
}

// Scroll to whisper by search text
function scrollToWhisperByText(searchText) {
  const url = window.location.hostname + window.location.pathname;
  
  chrome.storage.local.get([url], (result) => {
    const notes = result[url] || [];
    
    // Find note matching search text
    const matchingNote = notes.find(note => {
      return (note.transcript && note.transcript.toLowerCase().includes(searchText.toLowerCase())) ||
             (note.selectedText && note.selectedText.toLowerCase().includes(searchText.toLowerCase()));
    });
    
    if (matchingNote) {
      scrollToWhisperById(matchingNote.id);
    }
  });
}

// Load highlights on page load
window.addEventListener('load', () => {
  setTimeout(() => {
    highlightAllWhisperTexts();
  }, 500);
});

// ========================================
// ACCESSIBILITY FEATURES
// ========================================

// Initialize accessibility features
function initializeAccessibility() {
  // Initialize article reader
  if (typeof ArticleReader !== 'undefined') {
    articleReader = new ArticleReader();
  }

  // Create accessibility toolbar
  createAccessibilityToolbar();

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

  // Announce page load for screen readers
  announceForScreenReader('Sticky Whispers loaded. Press Alt+H for keyboard shortcuts.');
}

// Create floating accessibility toolbar
function createAccessibilityToolbar() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌥' : 'Alt';
  
  const toolbar = document.createElement('div');
  toolbar.className = 'whisper-accessibility-toolbar';
  toolbar.id = 'whisper-accessibility-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Accessibility Tools');

  toolbar.innerHTML = `
    <button class="accessibility-btn" id="readArticleBtn" aria-label="Read Article (${modKey}+R)" title="Read Article (${modKey}+R)">
      📖
    </button>
    <button class="accessibility-btn" id="readSelectionBtn" aria-label="Read Selection (${modKey}+S)" title="Read Selected Text (${modKey}+S)">
      🔊
    </button>
    <button class="accessibility-btn" id="showShortcutsBtn" aria-label="Keyboard Shortcuts (${modKey}+H)" title="Show Shortcuts (${modKey}+H)">
      ⌨️
    </button>
    <button class="accessibility-btn" id="toggleToolbarBtn" aria-label="Hide Toolbar (${modKey}+T)" title="Hide Toolbar (${modKey}+T)">
      ×
    </button>
  `;

  document.body.appendChild(toolbar);

  // Add event listeners
  document.getElementById('readArticleBtn').addEventListener('click', () => {
    if (articleReader) {
      articleReader.readArticle();
      playSound('start');
    }
  });

  document.getElementById('readSelectionBtn').addEventListener('click', () => {
    if (articleReader) {
      articleReader.readSelection();
      playSound('start');
    }
  });

  document.getElementById('showShortcutsBtn').addEventListener('click', showKeyboardShortcuts);

  document.getElementById('toggleToolbarBtn').addEventListener('click', toggleAccessibilityToolbar);
}

// Toggle accessibility toolbar visibility
function toggleAccessibilityToolbar() {
  const toolbar = document.getElementById('whisper-accessibility-toolbar');
  if (toolbar) {
    accessibilityToolbarVisible = !accessibilityToolbarVisible;
    toolbar.style.display = accessibilityToolbarVisible ? 'flex' : 'none';
    
    if (!accessibilityToolbarVisible) {
      announceForScreenReader('Accessibility toolbar hidden. Press Alt+T to show again.');
    }
  }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Alt key combinations
    if (e.altKey && !e.ctrlKey && !e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault();
          if (articleReader) {
            articleReader.readArticle();
            playSound('start');
          }
          break;
        
        case 's':
          e.preventDefault();
          if (articleReader) {
            articleReader.readSelection();
            playSound('start');
          }
          break;
        
        case 'p':
          e.preventDefault();
          if (articleReader && articleReader.isReading) {
            if (articleReader.isPaused) {
              articleReader.resume();
            } else {
              articleReader.pause();
            }
            playSound('click');
          }
          break;
        
        case 'x':
          e.preventDefault();
          if (articleReader) {
            articleReader.stop();
            playSound('stop');
          }
          break;
        
        case 'h':
          e.preventDefault();
          showKeyboardShortcuts();
          break;
        
        case 't':
          e.preventDefault();
          toggleAccessibilityToolbar();
          break;
      }
    }
  });
}

// Show keyboard shortcuts overlay
function showKeyboardShortcuts() {
  // Remove existing overlay if any
  const existing = document.getElementById('whisper-shortcuts-overlay');
  if (existing) {
    existing.remove();
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'whisper-shortcuts-overlay';
  overlay.id = 'whisper-shortcuts-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Keyboard Shortcuts');

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌥' : 'Alt';
  const modKeyName = isMac ? 'Option' : 'Alt';

  overlay.innerHTML = `
    <div class="shortcuts-panel">
      <h2>⌨️ Keyboard Shortcuts</h2>
      <p style="font-size: 12px; color: #888; margin-bottom: 15px;">
        ${isMac ? '⌥ = Option key on Mac' : 'Alt = Alt key on Windows'}
      </p>
      
      <div class="shortcut-item">
        <span class="shortcut-desc">Read entire article</span>
        <span class="shortcut-key">${modKey} + R</span>
      </div>
      
      <div class="shortcut-item">
        <span class="shortcut-desc">Read selected text</span>
        <span class="shortcut-key">${modKey} + S</span>
      </div>
      
      <div class="shortcut-item">
        <span class="shortcut-desc">Pause/Resume reading</span>
        <span class="shortcut-key">${modKey} + P</span>
      </div>
      
      <div class="shortcut-item">
        <span class="shortcut-desc">Stop reading</span>
        <span class="shortcut-key">${modKey} + X</span>
      </div>
      
      <div class="shortcut-item">
        <span class="shortcut-desc">Show/Hide this help</span>
        <span class="shortcut-key">${modKey} + H</span>
      </div>
      
      <div class="shortcut-item">
        <span class="shortcut-desc">Toggle accessibility toolbar</span>
        <span class="shortcut-key">${modKey} + T</span>
      </div>
      
      <button class="close-shortcuts-btn" id="closeShortcutsBtn">
        Close (Esc)
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close on Escape key
  const closeHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', closeHandler);
    }
  };
  document.addEventListener('keydown', closeHandler);

  // Close on button click
  document.getElementById('closeShortcutsBtn').addEventListener('click', () => {
    overlay.remove();
    document.removeEventListener('keydown', closeHandler);
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.removeEventListener('keydown', closeHandler);
    }
  });

  // Focus the close button
  setTimeout(() => {
    document.getElementById('closeShortcutsBtn').focus();
  }, 100);
}

// Announce text for screen readers
function announceForScreenReader(text) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = text;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => announcement.remove(), 1000);
}

// Play audio feedback sounds
function playSound(type) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Different sounds for different actions
  switch (type) {
    case 'start':
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      break;
    
    case 'stop':
      oscillator.frequency.value = 400;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
      break;
    
    case 'click':
      oscillator.frequency.value = 600;
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
      break;
  }
}