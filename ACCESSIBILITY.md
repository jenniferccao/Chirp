# ♿ Accessibility Features - Sticky Whispers

## 🎯 **Built for Everyone**

Sticky Whispers is designed to be fully accessible for blind and visually impaired users, with comprehensive keyboard navigation, screen reader support, and audio feedback.

---

## ⌨️ **Keyboard Shortcuts**

### Article Reading
| Shortcut | Action |
|----------|--------|
| `Alt + R` | Read entire article on page |
| `Alt + S` | Read selected text |
| `Alt + P` | Pause/Resume reading |
| `Alt + X` | Stop reading |

### Navigation
| Shortcut | Action |
|----------|--------|
| `Alt + H` | Show keyboard shortcuts help |
| `Alt + T` | Toggle accessibility toolbar |
| `Tab` | Navigate between elements |
| `Enter` | Activate focused element |
| `Esc` | Close overlays/dialogs |

---

## 📖 **Article Reader**

### Automatic Article Detection
The extension automatically detects the main article content on any webpage using:
- Semantic HTML tags (`<article>`, `<main>`)
- Common class names (`.article-content`, `.post-content`)
- Intelligent text block analysis

### How to Use:
1. **Press `Alt + R`** or click the 📖 button
2. The article starts reading immediately
3. See visual indicator showing reading status
4. **Change voice** using the dropdown in the reading indicator
5. Press `Alt + P` to pause/resume
6. Press `Alt + X` to stop

### Voice Selection:
The reading indicator includes a voice selector where you can:
- Choose from all your **ElevenLabs AI voices**
- Select "Auto (Best Quality)" for automatic selection
- Your preference is saved for future sessions

**ElevenLabs AI Voices:**
- **Ultra-realistic** - Sounds like a real person!
- **Emotionally expressive** - Natural intonation
- **Multiple accents** - American, British, Australian, and more
- **Unique personalities** - Each voice has character

### Features:
- ✅ **ElevenLabs AI voices** - The most realistic TTS available
- ✅ **Multiple voice options** - Choose from your voice library
- ✅ **Visual reading indicator** - See what's being read
- ✅ **Pause/Resume capability** - Control at any time
- ✅ **Works on any website** - Universal compatibility
- ✅ **Automatic chunking** - Seamless playback of long articles

---

## 🔊 **Text Selection Reader**

### Read Any Text
Select any text on the page and have it read aloud instantly!

### How to Use:
1. **Select text** with your mouse or keyboard
2. **Press `Alt + S`** or click the 🔊 button
3. Selected text is read immediately

### Perfect For:
- Reading specific paragraphs
- Checking pronunciation
- Focusing on important sections
- Quick text review

---

## 🎨 **Accessibility Toolbar**

### Floating Toolbar
A convenient toolbar appears in the bottom-left corner with quick access to all accessibility features.

### Buttons:
- **📖** - Read Article
- **🔊** - Read Selection
- **⌨️** - Show Shortcuts
- **×** - Hide Toolbar

### Features:
- Always visible (can be hidden with `Alt + T`)
- Large, easy-to-click buttons
- Tooltips on hover
- Keyboard accessible

---

## 🎤 **Screen Reader Support**

### ARIA Labels
All interactive elements have proper ARIA labels:
- Buttons announce their purpose
- Tabs indicate selection state
- Lists are properly structured
- Status updates are announced

### Live Regions
- Recording status announced
- Transcript updates announced
- Whisper placement confirmed
- Error messages spoken

### Semantic HTML
- Proper heading hierarchy
- Landmark regions
- List structures
- Form labels

---

## 🔔 **Audio Feedback**

### Sound Cues
Different sounds for different actions:
- **High beep** - Action started (reading, recording)
- **Low beep** - Action stopped
- **Click** - Button pressed, pause/resume

### Benefits:
- Confirms actions without visual feedback
- Helps blind users know what's happening
- Non-intrusive and pleasant
- Can be disabled (coming soon)

---

## 🎯 **Focus Management**

### Visible Focus Indicators
- **Pink outline** on focused elements
- **3px thick** for high visibility
- **2px offset** for clarity
- Works with keyboard navigation

### Focus Trapping
- Dialogs trap focus inside
- Tab cycles through dialog elements
- Escape closes and returns focus
- Logical tab order

---

## 📱 **Additional Features**

### High Contrast Support
- Works with system high contrast mode
- Clear color differentiation
- No color-only information
- Text alternatives for icons

### Keyboard Navigation
- **Tab** - Move forward
- **Shift + Tab** - Move backward
- **Enter/Space** - Activate
- **Escape** - Cancel/Close
- **Arrow keys** - Navigate lists

### Screen Magnification
- Works with screen magnifiers
- No fixed positioning issues
- Scalable UI elements
- Readable at 200% zoom

---

## 🎓 **Use Cases**

### For Blind Users
1. **Research**: Listen to articles while taking voice notes
2. **Study**: Read textbooks aloud, record summaries
3. **Browse**: Navigate web with keyboard, listen to content
4. **Organize**: Voice notes with automatic transcription

### For Low Vision Users
1. **Large UI**: Easy-to-see buttons and text
2. **High Contrast**: Clear visual differentiation
3. **Zoom**: Works at high magnification
4. **Focus Indicators**: Always know where you are

### For Motor Impairments
1. **Keyboard Only**: No mouse required
2. **Large Targets**: Easy to click buttons
3. **Voice Input**: Record instead of type
4. **Shortcuts**: Quick access to features

### For Cognitive Disabilities
1. **Simple Interface**: Clear, uncluttered design
2. **Audio Feedback**: Confirms actions
3. **Visual Cues**: Icons and colors
4. **Consistent Layout**: Predictable structure

---

## 🚀 **Getting Started**

### First Time Setup
1. Install extension
2. Press `Alt + H` to see keyboard shortcuts
3. Try `Alt + R` to read an article
4. Select text and press `Alt + S`
5. Start recording voice notes!

### Tips for Blind Users
1. **Use shortcuts**: Faster than clicking
2. **Enable screen reader**: NVDA, JAWS, or VoiceOver
3. **Explore toolbar**: Tab through buttons to learn
4. **Practice shortcuts**: They become second nature
5. **Use transcription**: All voice notes are searchable

---

## 🎯 **Keyboard Shortcuts Quick Reference**

```
READING:
Alt + R ........... Read article
Alt + S ........... Read selection
Alt + P ........... Pause/Resume
Alt + X ........... Stop

NAVIGATION:
Alt + H ........... Help/Shortcuts
Alt + T ........... Toggle toolbar
Tab ............... Next element
Shift + Tab ....... Previous element
Enter ............. Activate
Escape ............ Close

RECORDING:
(Use popup interface with Tab/Enter)
```

---

## 🔧 **Accessibility Settings**

Current features:
- ✅ **Voice selection** - Choose your preferred voice
- ✅ **Saved preferences** - Your voice choice is remembered

Coming soon:
- Adjust reading speed
- Customize keyboard shortcuts
- Toggle audio feedback
- High contrast theme
- Font size adjustment

---

## 📞 **Feedback & Support**

### Report Accessibility Issues
If you encounter any accessibility barriers:
1. Describe the issue
2. Mention your assistive technology
3. Include steps to reproduce
4. Suggest improvements

### Tested With:
- ✅ NVDA (Windows)
- ✅ JAWS (Windows)
- ✅ VoiceOver (Mac)
- ✅ ChromeVox (Chrome OS)
- ✅ Keyboard only
- ✅ Screen magnifiers
- ✅ High contrast mode

---

## 🏆 **Accessibility Standards**

### WCAG 2.1 Compliance
- **Level AA** compliant
- Keyboard accessible
- Screen reader compatible
- Sufficient color contrast
- Focus indicators
- Text alternatives
- Semantic markup

### Best Practices
- Progressive enhancement
- Graceful degradation
- User control
- Clear language
- Consistent navigation
- Error prevention
- Help and documentation

---

## 💡 **Pro Tips**

1. **Learn shortcuts**: Much faster than mouse
2. **Use toolbar**: Quick access to features
3. **Read while browsing**: Listen to articles hands-free
4. **Voice notes**: Faster than typing
5. **Transcription**: Makes notes searchable
6. **Keyboard navigation**: Works everywhere

---

## 🎉 **Accessibility First!**

Sticky Whispers is designed with accessibility as a core feature, not an afterthought. We believe everyone should be able to take voice notes and access web content easily.

**Your feedback makes us better!** Let us know how we can improve accessibility.

---

**Made with ♿ for everyone**

