# Demo Bubbles Setup Guide 🎭

## Quick Setup (5 minutes)

### Step 1: Load Demo Data
1. Open the extension popup
2. Press `F12` to open console
3. Copy and paste the contents of `load-demo-bubbles.js`
4. Press Enter
5. You should see: `✅ Loaded 8 demo bubbles!`

### Step 2: View the Bubbles
1. Go to the Carnegie article:
   ```
   https://carnegieendowment.org/china-financial-markets/2023/12/what-will-it-take-for-chinas-gdp-to-grow-at-4-5-percent-over-the-next-decade?lang=en
   ```
2. Refresh the page (`Cmd+R` or `F5`)
3. You should see **8 colorful bubbles** on the page!

### Step 3: Test the Features
1. **Hover over a bubble** → See username and transcript
2. **Click a bubble** → Plays audio (generates on first click)
3. **Open popup → Teams tab** → See "8 annotations"
4. **Click "Jump to Annotation"** → Scrolls to bubble and plays it

## What You Get

### 8 Demo Bubbles with Different Users:

1. **👤 Alex Kumar** (Pink)
   - "This is a key point about China's investment share of GDP"
   - Position: Top of article

2. **👤 Maria Rodriguez** (Lavender)
   - "Wait, this seems confusing. Need to review this section again."
   - Position: Middle section

3. **👤 James Wilson** (Mint)
   - "Important statistic for our presentation!"
   - Position: Statistics section

4. **👤 Priya Patel** (Peach)
   - "This contradicts what we learned in class. Need to ask professor."
   - Position: Lower section

5. **👤 Sarah Chen - You!** (Sky)
   - "Great explanation of the arithmetic here"
   - Position: Arithmetic section

6. **👤 Alex Kumar** (Pink)
   - "This is the most confusing part of the article"
   - Position: Confusing section

7. **👤 Maria Rodriguez** (Lavender)
   - "Compare this with the World Bank data"
   - Position: World Bank section

8. **👤 James Wilson** (Mint)
   - "This explains why China is different from other economies"
   - Position: China comparison section

## Features Demonstrated

### ✅ Hover Tooltip
When you hover over a bubble, you see:
```
👤 Alex Kumar
─────────────
This is a key point about
China's investment share of GDP
```

### ✅ Team Annotations List
In the popup Teams tab:
```
📍 Team Annotations on This Page
8 annotations

👤 Alex Kumar        1/15/2024
"This is a key point about China's investment share of GDP"
📍 Jump to Annotation

👤 Maria Rodriguez   1/15/2024
"Wait, this seems confusing..."
📍 Jump to Annotation
```

### ✅ On-Demand Audio Generation
- First click: Generates ElevenLabs audio (uses ~50 credits)
- Subsequent clicks: Plays saved audio (no credits used)
- Audio is cached in storage for future use

### ✅ Jump to Annotation
- Click "Jump to Annotation" in popup
- Page scrolls to the bubble
- Bubble flashes to highlight
- Audio plays automatically

## Hackathon Demo Script

### 1. Show Collaboration (30 seconds)
"Our team of 5 students is studying this economics article together. Each bubble represents a voice note from a team member."

**Action:** Hover over different colored bubbles to show different users.

### 2. Show Confusion Detection (30 seconds)
"Notice how multiple people annotated the same section? That's a signal that this part is confusing and needs extra attention."

**Action:** Point to bubbles clustered in the same area.

### 3. Show Team View (30 seconds)
"In the Teams tab, I can see all my teammates' annotations on this page. I can jump directly to what Maria found confusing."

**Action:** Open popup → Teams tab → Click "Jump to Annotation"

### 4. Show Accessibility (30 seconds)
"For blind students, they can hear all team annotations using screen readers and keyboard navigation. No visual required!"

**Action:** Press `Alt+H` to show accessibility toolbar.

### 5. Show Heatmap (30 seconds)
"The heatmap shows where our team focused most. Red zones mean many annotations - either important or confusing."

**Action:** Toggle heatmap in Teams tab.

## Troubleshooting

### Bubbles Not Showing?
1. Make sure you're on the exact Carnegie article URL
2. Check console for errors (`F12`)
3. Try running `load-demo-bubbles.js` again
4. Refresh the page

### Audio Not Playing?
1. Check ElevenLabs credits (need at least 400 remaining)
2. Check console for "Failed to generate audio" errors
3. Make sure extension has microphone permission
4. Try clicking a different bubble

### "Jump to Annotation" Not Working?
1. Make sure you're on the Carnegie article page
2. Refresh the page after loading demo data
3. Check that bubbles are visible on the page

### Team Annotations Not Showing in Popup?
1. Make sure you're on the Teams tab
2. Make sure ECON42 team is active (click it)
3. Refresh the popup
4. Check that you're on the Carnegie article page

## Advanced: Generate Audio for All Bubbles

If you want to pre-generate audio for all bubbles (uses ~400 credits):

```javascript
// Run in popup console
async function preGenerateAllAudio() {
  const url = 'https://carnegieendowment.org/china-financial-markets/2023/12/what-will-it-take-for-chinas-gdp-to-grow-at-4-5-percent-over-the-next-decade?lang=en';
  const result = await chrome.storage.local.get([url]);
  const notes = result[url] || [];
  
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (!note.audioUrl && note.transcript) {
      console.log(`Generating ${i+1}/${notes.length}: ${note.transcript}`);
      const response = await chrome.runtime.sendMessage({
        action: 'textToSpeech',
        text: note.transcript
      });
      if (response.success) {
        notes[i].audioUrl = response.audioData;
        console.log(`✅ Generated`);
      }
      await new Promise(r => setTimeout(r, 500)); // Delay to avoid rate limiting
    }
  }
  
  await chrome.storage.local.set({ [url]: notes });
  console.log('🎉 All audio generated!');
}

preGenerateAllAudio();
```

## Cost Breakdown

- **On-demand generation:** ~50 credits per bubble (only when clicked)
- **Pre-generation:** ~400 credits total (all 8 bubbles)
- **Recommendation:** Use on-demand for demo (saves credits!)

## Ready for Hackathon! 🏆

You now have:
- ✅ 8 realistic demo bubbles
- ✅ 5 different team members
- ✅ User attribution on hover
- ✅ Team annotations list in popup
- ✅ Jump to annotation functionality
- ✅ On-demand audio generation
- ✅ Heatmap visualization

**Total setup time:** 5 minutes
**Credits used:** 0 (until you click bubbles)
**Demo impact:** Maximum! 🚀

