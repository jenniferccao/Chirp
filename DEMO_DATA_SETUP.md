# 🎭 Demo Data Setup Guide

## How to Load Demo Data for Testing

To showcase the **Teams** and **Heatmap** features with realistic data, follow these steps:

### Step 1: Load the Extension
1. Open Chrome and go to `chrome://extensions`
2. Make sure "Sticky Whispers" is loaded and enabled

### Step 2: Run the Demo Data Script
1. Open the **Extension Popup** (click the Chirp icon)
2. Right-click anywhere in the popup → **Inspect**
3. Go to the **Console** tab
4. Copy and paste the entire contents of `demo-data.js`
5. Press **Enter**

You should see:
```
🎭 Generating demo data...
✅ User profile created: Sarah Chen
✅ Teams created: ECON42, STUDY1
✅ Created 15 demo whispers with annotations
📊 Heatmap hotspots:
   - "if China maintained..." (15 annotations) - RED HOT! 🔥
   - "32 percent of global investment" (5 annotations) - ORANGE
   - "42-44 percent of its GDP" (4 annotations) - ORANGE
🎉 Demo data loaded successfully!
```

### Step 3: View the Demo Data

#### In the Popup:
1. Go to the **👥 Teams** tab
2. You'll see:
   - **Your Profile**: Sarah Chen
   - **Stats**: 47 whispers, 23 shared, 15 articles read, 31 team contributions
   - **Teams**: 
     - **ECON42** - Economics Study Group (4 members)
     - **STUDY1** - Accessibility Research Team (3 members)

#### On the Carnegie Article:
1. Navigate to: https://carnegieendowment.org/china-financial-markets/2023/12/what-will-it-take-for-chinas-gdp-to-grow-at-4-5-percent-over-the-next-decade?lang=en
2. Open the extension popup
3. Go to **👥 Teams** tab
4. Toggle the **📊 Annotation Heatmap** switch ON
5. Select **🌍 Community** or **👥 Team** mode

### Step 4: See the Heatmap in Action!

You'll see:
- **RED sections** (11+ annotations) - The confusing GDP growth section
- **ORANGE sections** (6-10 annotations) - Key statistics
- **YELLOW sections** (3-5 annotations) - Important points
- **Click any highlighted text** to see all annotations from your team!

---

## 📊 What the Demo Data Shows

### Heatmap Hotspots:
1. **"if China maintained annual GDP growth rates..."** 
   - 🔥 **15 annotations** (RED - Very High)
   - Shows this is the most confusing/important section
   - Multiple students struggling with this concept

2. **"32 percent of global investment"**
   - 🟠 **5 annotations** (ORANGE - High)
   - Key statistic everyone is noting

3. **"42-44 percent of its GDP"**
   - 🟠 **4 annotations** (ORANGE - High)
   - Important outlier data point

### Team Members:
- **Sarah Chen** (You) - 47 whispers, 23 shared
- **Alex Kumar** - Active contributor
- **Maria Rodriguez** - Study group leader
- **James Wilson** - Economics major
- **Priya Patel** - Accessibility research

### Sample Annotations:
- "This is confusing - need to review"
- "Key point for exam!"
- "Compare with World Bank data"
- "Professor mentioned this in lecture"
- "Important for our presentation"

---

## 🎯 Demo Script for Judges

### Show the DEI Impact:

1. **Open the article** and say:
   > "This is a complex economics article. Let me show you how our heatmap helps students."

2. **Toggle heatmap ON**:
   > "The RED section shows 15 students annotated here - it's confusing for everyone, not just one person."

3. **Click the red section**:
   > "See? Multiple students are struggling. Sarah, who is blind, can hear 'This section has 15 annotations' and know she's not alone."

4. **Show team mode**:
   > "In team mode, she can see only her study group's annotations and collaborate asynchronously."

5. **Show stats**:
   > "Sarah has contributed 31 times to her team, showing equal participation despite her disability."

---

## 🔄 Reset Demo Data

To clear and reload:
```javascript
// Clear all data
await chrome.storage.local.clear();

// Then run demo-data.js again
```

---

## 💡 Customization

Want to add more data? Edit `demo-data.js`:
- Add more teams
- Increase stats numbers
- Add whispers to other articles
- Change usernames

---

**Ready to impress the judges!** 🏆

