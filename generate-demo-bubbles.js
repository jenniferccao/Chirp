// Generate Demo Bubbles with ElevenLabs Audio
// Run this script from the extension popup console

async function generateDemoBubbles() {
  console.log('🎭 Generating demo bubbles with ElevenLabs audio...');
  
  const articleUrl = 'https://carnegieendowment.org/china-financial-markets/2023/12/what-will-it-take-for-chinas-gdp-to-grow-at-4-5-percent-over-the-next-decade?lang=en';
  
  // Demo annotations with different users
  const demoAnnotations = [
    {
      user: 'Alex Kumar',
      userId: 'user_alex_789',
      text: "This is a key point about China's investment share of GDP",
      color: 'pink',
      position: { x: 300, y: 500 },
      voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam - male voice
    },
    {
      user: 'Maria Rodriguez',
      userId: 'user_maria_456',
      text: "Wait, this seems confusing. Need to review this section again.",
      color: 'lavender',
      position: { x: 320, y: 800 },
      voiceId: 'EXAVITQu4vr4xnSDxMaL' // Sarah - female voice
    },
    {
      user: 'James Wilson',
      userId: 'user_james_321',
      text: "Important statistic for our presentation!",
      color: 'mint',
      position: { x: 310, y: 650 },
      voiceId: 'ErXwobaYiN019PkySvjV' // Charlie - male voice
    },
    {
      user: 'Priya Patel',
      userId: 'user_priya_654',
      text: "This contradicts what we learned in class. Need to ask professor.",
      color: 'peach',
      position: { x: 315, y: 900 },
      voiceId: 'EXAVITQu4vr4xnSDxMaL' // Sarah - female voice
    },
    {
      user: 'Sarah Chen',
      userId: 'user_demo_12345',
      text: "Great explanation of the arithmetic here",
      color: 'sky',
      position: { x: 300, y: 400 },
      voiceId: 'EXAVITQu4vr4xnSDxMaL' // Sarah - female voice
    },
    {
      user: 'Alex Kumar',
      userId: 'user_alex_789',
      text: "This is the most confusing part of the article",
      color: 'pink',
      position: { x: 325, y: 850 },
      voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam
    },
    {
      user: 'Maria Rodriguez',
      userId: 'user_maria_456',
      text: "Compare this with the World Bank data",
      color: 'lavender',
      position: { x: 305, y: 550 },
      voiceId: 'EXAVITQu4vr4xnSDxMaL' // Sarah
    },
    {
      user: 'James Wilson',
      userId: 'user_james_321',
      text: "This explains why China is different from other economies",
      color: 'mint',
      position: { x: 295, y: 520 },
      voiceId: 'ErXwobaYiN019PkySvjV' // Charlie
    }
  ];
  
  const whispers = [];
  
  // Generate audio for each annotation
  for (let i = 0; i < demoAnnotations.length; i++) {
    const annotation = demoAnnotations[i];
    console.log(`🔊 Generating audio ${i + 1}/${demoAnnotations.length}: "${annotation.text}"`);
    
    try {
      // Request TTS from background script
      const response = await chrome.runtime.sendMessage({
        action: 'textToSpeech',
        text: annotation.text,
        voiceId: annotation.voiceId
      });
      
      if (response.success && response.audioData) {
        const whisper = {
          id: `demo_whisper_${i + 1}`,
          audioUrl: response.audioData,
          transcript: annotation.text,
          color: annotation.color,
          position: annotation.position,
          timestamp: new Date(2024, 0, 15, 10 + i, 30, 0).toISOString(),
          url: articleUrl,
          sharedBy: annotation.userId,
          sharedByUsername: annotation.user,
          sharedAt: new Date(2024, 0, 15, 10 + i, 30, 0).toISOString(),
          teamCode: 'ECON42'
        };
        
        whispers.push(whisper);
        console.log(`✅ Generated audio for ${annotation.user}`);
      } else {
        console.error(`❌ Failed to generate audio: ${response.error}`);
      }
    } catch (error) {
      console.error(`❌ Error generating audio:`, error);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save whispers to storage
  await chrome.storage.local.set({ [articleUrl]: whispers });
  
  // Update team whispers
  const { teams } = await chrome.storage.local.get(['teams']);
  if (teams && teams['ECON42']) {
    teams['ECON42'].whispers = whispers;
    await chrome.storage.local.set({ teams });
  }
  
  console.log(`\n🎉 Generated ${whispers.length} demo bubbles with audio!`);
  console.log('📍 Go to the Carnegie article and refresh the page to see them!');
  console.log('🔊 Each bubble has real ElevenLabs audio');
  console.log('👥 Hover over bubbles to see who added them');
  
  return whispers;
}

// Run the function
generateDemoBubbles();

