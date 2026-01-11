// Heatmap Service for Sticky Whispers
// Visualizes annotation density on articles

class HeatmapService {
  constructor() {
    this.heatmapEnabled = false;
    this.heatmapMode = 'community'; // 'community' or 'team'
    this.heatmapOverlay = null;
  }

  // Calculate heatmap data for current page
  async calculateHeatmap(url, mode = 'community', teamCode = null) {
    let whispers = [];

    if (mode === 'team' && teamCode) {
      // Get team whispers
      const teamsData = await chrome.storage.local.get(['teams']);
      if (teamsData.teams && teamsData.teams[teamCode]) {
        whispers = teamsData.teams[teamCode].whispers.filter(w => w.url === url);
      }
    } else {
      // Get all whispers for this page (community mode)
      const result = await chrome.storage.local.get([url]);
      whispers = result[url] || [];
    }

    // Group whispers by text selection or position
    const heatmapData = {};

    whispers.forEach(whisper => {
      if (whisper.selectedText) {
        // Group by selected text
        const key = whisper.selectedText.substring(0, 50); // Use first 50 chars as key
        if (!heatmapData[key]) {
          heatmapData[key] = {
            text: whisper.selectedText,
            count: 0,
            whispers: [],
            position: whisper.position
          };
        }
        heatmapData[key].count++;
        heatmapData[key].whispers.push(whisper);
      } else if (whisper.position) {
        // Group by position
        const posKey = `${Math.floor(whisper.position.x / 100)}_${Math.floor(whisper.position.y / 100)}`;
        if (!heatmapData[posKey]) {
          heatmapData[posKey] = {
            text: null,
            count: 0,
            whispers: [],
            position: whisper.position
          };
        }
        heatmapData[posKey].count++;
        heatmapData[posKey].whispers.push(whisper);
      }
    });

    return heatmapData;
  }

  // Get intensity level based on count
  getIntensity(count) {
    if (count === 0) return 'none';
    if (count <= 2) return 'low';
    if (count <= 5) return 'medium';
    if (count <= 10) return 'high';
    return 'very-high';
  }

  // Get color for intensity
  getColor(intensity) {
    const colors = {
      'none': 'transparent',
      'low': 'rgba(255, 255, 0, 0.2)',      // Light yellow
      'medium': 'rgba(255, 165, 0, 0.3)',   // Orange
      'high': 'rgba(255, 99, 71, 0.4)',     // Tomato red
      'very-high': 'rgba(255, 0, 0, 0.5)'   // Red
    };
    return colors[intensity] || colors.none;
  }

  // Create heatmap overlay
  async createHeatmapOverlay(url, mode = 'community', teamCode = null) {
    // Remove existing overlay
    this.removeHeatmapOverlay();

    const heatmapData = await this.calculateHeatmap(url, mode, teamCode);

    // Create overlay container
    this.heatmapOverlay = document.createElement('div');
    this.heatmapOverlay.id = 'whisper-heatmap-overlay';
    this.heatmapOverlay.className = 'whisper-heatmap-overlay';
    this.heatmapOverlay.setAttribute('role', 'region');
    this.heatmapOverlay.setAttribute('aria-label', `Annotation heatmap - ${mode} mode`);

    // Find and highlight text with annotations
    Object.values(heatmapData).forEach(data => {
      if (data.text) {
        this.highlightTextWithHeatmap(data.text, data.count, data.whispers);
      }
    });

    // Add heatmap legend
    this.addHeatmapLegend(mode);

    // Add screen reader announcements
    this.announceHeatmapStats(heatmapData);

    document.body.appendChild(this.heatmapOverlay);
    this.heatmapEnabled = true;
    this.heatmapMode = mode;
  }

  // Highlight text with heatmap color
  highlightTextWithHeatmap(text, count, whispers) {
    const intensity = this.getIntensity(count);
    const color = this.getColor(intensity);

    // Find all instances of this text
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes(text.substring(0, 30))) {
        textNodes.push(node);
      }
    }

    textNodes.forEach(textNode => {
      const parent = textNode.parentElement;
      if (parent && !parent.classList.contains('whisper-bubble')) {
        const span = document.createElement('span');
        span.className = 'whisper-heatmap-highlight';
        span.style.backgroundColor = color;
        span.style.cursor = 'pointer';
        span.setAttribute('data-whisper-count', count);
        span.setAttribute('data-intensity', intensity);
        span.setAttribute('role', 'button');
        span.setAttribute('aria-label', `${count} annotation${count > 1 ? 's' : ''} here. Click to view.`);
        span.setAttribute('tabindex', '0');

        const content = textNode.textContent;
        const index = content.indexOf(text.substring(0, 30));
        
        if (index !== -1) {
          const before = content.substring(0, index);
          const highlighted = content.substring(index, index + text.length);
          const after = content.substring(index + text.length);

          const beforeNode = document.createTextNode(before);
          const afterNode = document.createTextNode(after);
          span.textContent = highlighted;

          parent.insertBefore(beforeNode, textNode);
          parent.insertBefore(span, textNode);
          parent.insertBefore(afterNode, textNode);
          parent.removeChild(textNode);

          // Add click handler to show whispers
          span.addEventListener('click', () => {
            this.showWhispersAtLocation(whispers, span);
          });

          // Keyboard support
          span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.showWhispersAtLocation(whispers, span);
            }
          });
        }
      }
    });
  }

  // Show whispers at a location
  showWhispersAtLocation(whispers, element) {
    // Create popup to show whispers
    const popup = document.createElement('div');
    popup.className = 'whisper-heatmap-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', 'Annotations at this location');

    popup.innerHTML = `
      <div class="heatmap-popup-header">
        <h3>${whispers.length} Annotation${whispers.length > 1 ? 's' : ''}</h3>
        <button class="heatmap-popup-close" aria-label="Close">×</button>
      </div>
      <div class="heatmap-popup-content">
        ${whispers.map((w, i) => `
          <div class="heatmap-whisper-item">
            <div class="heatmap-whisper-meta">
              ${w.sharedByUsername ? `<strong>${w.sharedByUsername}</strong>` : 'Anonymous'}
              ${w.sharedAt ? `<span class="heatmap-whisper-date">${new Date(w.sharedAt).toLocaleDateString()}</span>` : ''}
            </div>
            <div class="heatmap-whisper-transcript">${w.transcript || 'Voice note'}</div>
            <button class="heatmap-play-btn" data-index="${i}" aria-label="Play whisper ${i + 1}">▶️ Play</button>
          </div>
        `).join('')}
      </div>
    `;

    // Position popup near the element
    const rect = element.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.top = (rect.bottom + 10) + 'px';
    popup.style.left = rect.left + 'px';
    popup.style.zIndex = '10000';

    document.body.appendChild(popup);

    // Close button handler
    popup.querySelector('.heatmap-popup-close').addEventListener('click', () => {
      popup.remove();
    });

    // Play button handlers
    popup.querySelectorAll('.heatmap-play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const whisper = whispers[index];
        if (whisper.audioData) {
          const audio = new Audio(whisper.audioData);
          audio.play();
        }
      });
    });

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closePopup(e) {
        if (!popup.contains(e.target) && e.target !== element) {
          popup.remove();
          document.removeEventListener('click', closePopup);
        }
      });
    }, 100);
  }

  // Add heatmap legend
  addHeatmapLegend(mode) {
    const legend = document.createElement('div');
    legend.className = 'whisper-heatmap-legend';
    legend.setAttribute('role', 'complementary');
    legend.setAttribute('aria-label', 'Heatmap legend');

    legend.innerHTML = `
      <div class="heatmap-legend-header">
        <strong>📊 Annotation Heatmap</strong>
        <span class="heatmap-mode-badge">${mode === 'team' ? '👥 Team' : '🌍 Community'}</span>
      </div>
      <div class="heatmap-legend-items">
        <div class="heatmap-legend-item">
          <span class="heatmap-legend-color" style="background: rgba(255, 255, 0, 0.2);"></span>
          <span>1-2 annotations</span>
        </div>
        <div class="heatmap-legend-item">
          <span class="heatmap-legend-color" style="background: rgba(255, 165, 0, 0.3);"></span>
          <span>3-5 annotations</span>
        </div>
        <div class="heatmap-legend-item">
          <span class="heatmap-legend-color" style="background: rgba(255, 99, 71, 0.4);"></span>
          <span>6-10 annotations</span>
        </div>
        <div class="heatmap-legend-item">
          <span class="heatmap-legend-color" style="background: rgba(255, 0, 0, 0.5);"></span>
          <span>11+ annotations</span>
        </div>
      </div>
      <button class="heatmap-toggle-btn" aria-label="Toggle heatmap">Hide Heatmap</button>
    `;

    document.body.appendChild(legend);

    // Toggle button handler
    legend.querySelector('.heatmap-toggle-btn').addEventListener('click', () => {
      this.removeHeatmapOverlay();
    });
  }

  // Announce heatmap stats for screen readers
  announceHeatmapStats(heatmapData) {
    const totalSpots = Object.keys(heatmapData).length;
    const totalAnnotations = Object.values(heatmapData).reduce((sum, d) => sum + d.count, 0);

    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = `Heatmap loaded. ${totalAnnotations} annotations across ${totalSpots} locations. Use Tab to navigate highlighted sections.`;

    document.body.appendChild(announcement);

    setTimeout(() => announcement.remove(), 3000);
  }

  // Remove heatmap overlay
  removeHeatmapOverlay() {
    // Remove highlights
    document.querySelectorAll('.whisper-heatmap-highlight').forEach(el => {
      const text = el.textContent;
      const textNode = document.createTextNode(text);
      el.parentNode.replaceChild(textNode, el);
    });

    // Remove legend
    const legend = document.querySelector('.whisper-heatmap-legend');
    if (legend) legend.remove();

    // Remove popup if open
    const popup = document.querySelector('.whisper-heatmap-popup');
    if (popup) popup.remove();

    if (this.heatmapOverlay) {
      this.heatmapOverlay.remove();
      this.heatmapOverlay = null;
    }

    this.heatmapEnabled = false;
  }

  // Toggle heatmap
  async toggleHeatmap(url, mode = 'community', teamCode = null) {
    if (this.heatmapEnabled) {
      this.removeHeatmapOverlay();
    } else {
      await this.createHeatmapOverlay(url, mode, teamCode);
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeatmapService;
}

