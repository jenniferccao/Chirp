# 🔑 API Key Configuration

## ✅ **Already Set Up!**

Your ElevenLabs API key is hardcoded in `config.js` and will auto-load when you open the extension.

**No need to enter it manually!** 🎉

---

## 🔒 **Security**

- `config.js` is in `.gitignore` - won't be committed to Git
- API key is stored locally in Chrome storage
- Never exposed to websites (only to extension)

---

## 🚀 **How It Works**

1. Extension loads
2. Checks if API key exists in storage
3. If not, auto-loads from `config.js`
4. Stores in Chrome local storage
5. Ready to use!

---

## 🔄 **If You Need to Change the Key**

Edit `config.js`:
```javascript
const CONFIG = {
  ELEVENLABS_API_KEY: 'your-new-key-here'
};
```

Then reload the extension.

---

## ⚠️ **IMPORTANT: Before Pushing to GitHub**

Make sure `.gitignore` includes:
```
config.js
```

This prevents your API key from being committed!

---

## 📝 **For Other Developers**

If someone clones your repo, they need to:

1. Create `config.js` in the root:
```javascript
const CONFIG = {
  ELEVENLABS_API_KEY: 'their-api-key-here'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
```

2. Get their own API key from [elevenlabs.io](https://elevenlabs.io)

3. Reload the extension

---

## ✅ **Your Key (For Reference)**

```
sk_371dd1ebfd6b3123e8674dee136c2792744760be31db90db
```

**Keep this safe!** Don't share publicly.

---

**Everything is set up! Just reload the extension and it will work automatically! 🚀**

