// Check if demo data exists
// Run this in the POPUP console (right-click popup → Inspect)

async function checkDemoData() {
  console.log('🔍 Checking demo data...');
  
  const articleUrl = 'https://carnegieendowment.org/china-financial-markets/2023/12/what-will-it-take-for-chinas-gdp-to-grow-at-4-5-percent-over-the-next-decade?lang=en';
  
  // Check full URL
  const fullUrlData = await chrome.storage.local.get([articleUrl]);
  console.log('Full URL data:', fullUrlData);
  console.log('Whispers found:', fullUrlData[articleUrl]?.length || 0);
  
  // Check hostname + pathname format
  const shortUrl = 'carnegieendowment.org/china-financial-markets/2023/12/what-will-it-take-for-chinas-gdp-to-grow-at-4-5-percent-over-the-next-decade';
  const shortUrlData = await chrome.storage.local.get([shortUrl]);
  console.log('Short URL data:', shortUrlData);
  console.log('Whispers found:', shortUrlData[shortUrl]?.length || 0);
  
  // Check all storage
  const allData = await chrome.storage.local.get(null);
  console.log('All storage keys:', Object.keys(allData));
  
  // Find any keys that look like URLs
  const urlKeys = Object.keys(allData).filter(key => 
    key.includes('carnegie') || key.includes('http')
  );
  console.log('URL-like keys:', urlKeys);
  
  if (urlKeys.length > 0) {
    urlKeys.forEach(key => {
      console.log(`Key: ${key}`);
      console.log(`Data:`, allData[key]);
    });
  }
}

checkDemoData();

