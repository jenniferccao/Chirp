// Demo Data Generator for Sticky Whispers
// Run this in the browser console to populate with fake data

async function generateDemoData() {
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
  
  await chrome.storage.local.set({ teams });
  await chrome.storage.local.set({ currentTeamCode: 'ECON42' });
  console.log('✅ Teams created: ECON42, STUDY1');
  
  // 3. Create demo whispers for the Carnegie article
  const articleUrl = 'https://carnegieendowment.org/china-financial-markets/2023/12/what-will-it-take-for-chinas-gdp-to-grow-at-4-5-percent-over-the-next-decade?lang=en';
  
  const demoWhispers = [
    {
      id: 'whisper_1',
      audioData: null, // No actual audio for demo
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
      selectedText: "if China maintained annual GDP growth rates of 4–5 percent while also maintaining",
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
      transcript: "This contradicts what we learned in class. Need to ask professor.",
      selectedText: "if China maintained annual GDP growth rates of 4–5 percent while also maintaining",
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
      transcript: "Great explanation of the arithmetic here",
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
      transcript: "This is the most confusing part of the article",
      selectedText: "if China maintained annual GDP growth rates of 4–5 percent while also maintaining",
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
      transcript: "Compare this with the World Bank data",
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
      transcript: "This explains why China is different from other economies",
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
      transcript: "Really struggling to understand this section",
      selectedText: "if China maintained annual GDP growth rates of 4–5 percent while also maintaining",
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
      transcript: "This is the most important statistic in the article",
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
      transcript: "Professor mentioned this in lecture",
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
      transcript: "Need help understanding this",
      selectedText: "if China maintained annual GDP growth rates of 4–5 percent while also maintaining",
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
      transcript: "This section is critical for understanding the whole argument",
      selectedText: "if China maintained annual GDP growth rates of 4–5 percent while also maintaining",
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
      transcript: "Compare with Japan's economic history",
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
  
  // Also save as regular whispers for community heatmap
  await chrome.storage.local.set({ [articleUrl]: demoWhispers });
  
  console.log('✅ Created 15 demo whispers with annotations');
  console.log('📊 Heatmap hotspots:');
  console.log('   - "if China maintained..." (15 annotations) - RED HOT! 🔥');
  console.log('   - "32 percent of global investment" (5 annotations) - ORANGE');
  console.log('   - "42-44 percent of its GDP" (4 annotations) - ORANGE');
  console.log('   - Other sections (1-2 annotations) - YELLOW');
  
  console.log('\n🎉 Demo data loaded successfully!');
  console.log('👥 Teams: ECON42 (4 members), STUDY1 (3 members)');
  console.log('📈 Your stats: 47 whispers, 23 shared, 15 articles read, 31 team contributions');
  console.log('\n🚀 Reload the extension popup to see the data!');
}

// Run the function
generateDemoData();

