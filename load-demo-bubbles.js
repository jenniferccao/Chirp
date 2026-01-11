// Load Demo Bubbles WITHOUT generating new audio (saves credits!)
// This uses the demo data that's already been generated
// Run this in the browser console on the Carnegie article page

async function loadDemoBubbles() {
  console.log('🎭 Loading demo bubbles...');
  
  const articleUrl = window.location.href;
  
  // Demo whispers with realistic data (no audio URLs - will use TTS on demand)
  const demoWhispers = [
    {
      id: 'demo_whisper_1',
      audioUrl: null, // Will generate on play
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
  
  console.log(`✅ Loaded ${demoWhispers.length} demo bubbles!`);
  console.log('🔄 Refresh the page to see the bubbles');
  console.log('🎙️ Click any bubble to generate and play audio on-demand');
  console.log('👥 Hover over bubbles to see who added them');
  console.log('\nDemo users:');
  console.log('  👤 Alex Kumar (pink bubbles)');
  console.log('  👤 Maria Rodriguez (lavender bubbles)');
  console.log('  👤 James Wilson (mint bubbles)');
  console.log('  👤 Priya Patel (peach bubbles)');
  console.log('  👤 Sarah Chen - You! (sky bubbles)');
}

// Run it
loadDemoBubbles();

