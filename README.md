## 💡 Inspiration
The web is still overwhelmingly text-first, and for many users with visual impairments, learning differences, or who think better out loud, reading, remembering, and navigating dense content can be challenging. We built **Chirp It!** to make the web more human and accessible by letting users interact with webpages through voice instead of just text. 

## ⚙️ What it does
**Chirp It!** is a Chrome extension that lets users leave **persistent voice notes** directly on any webpage. _Turn any webpage into a conversation._

Users can:
- Record and edit voice notes and save them locally
- Drag and pin voice notes anywhere on a webpage
- Revisit pages and find notes exactly where they were placed
- Transcribe voice notes using **ElevenLabs**
- Read all on-screen or highlighted text aloud
- Instantly play the voice note associated with highlighted text on the page

This creates a **voice-first, spatial layer on top of the web**, turning static pages into interactive, audible workspaces.

## 🧱 How we built it

### Frontend / Extension
- JavaScript
- HTML & CSS
- Chrome Extension APIs (Manifest V3)
- Local Storage for persistent, private data
- DOM manipulation for draggable, page-anchored notes

### AI & Voice
- **ElevenLabs API**
  - Text-to-speech for reading on-screen or highlighted text
  - Speech-to-text for transcribing voice notes
  - Natural, high-quality audio playback for accessibility

## 🤨 Challenges we ran into
- Anchoring voice notes to dynamic webpage layouts so they persist across reloads
- Accurately mapping highlighted text to its associated voice note
- Managing audio recording, playback, and transcription entirely client-side
- Ensuring performance and usability without relying on a backend

## 😊 Accomplishments that we're proud of
- Persistent, draggable voice notes that stay anchored to webpages
- Seamless transcription and text-to-speech powered by ElevenLabs
- A clean, intuitive UX focused on accessibility and ease of use
- Turning any webpage into an interactive, voice-enabled space

## 🧠 What we learned
- How to design for accessibility beyond visual UI
- Working with browser APIs for audio recording and DOM interaction
- Integrating ElevenLabs to handle both transcription and text-to-speech
- The importance of privacy-first design using local storage

## 🚀 What's next for Chirp It!
- Voice note search and filtering
- Sharing voice notes across devices
- Smarter text-to-note linking for long documents
- Expanding accessibility features for screen-reader users
