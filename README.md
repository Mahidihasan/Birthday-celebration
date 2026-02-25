# Happy Birthday, My Love 💝

An interactive, cinematic birthday surprise web experience with photo slideshow, music sync, and a secret message reveal.

## Features

✨ **Cinematic Slideshow** - Smooth transitions through 8 memory slides synchronized with background music  
🎵 **Music Integration** - Background music perfectly synced with slide timing  
❤️ **Animated Rainfall** - Falling heart icons during intro and secret reveal  
🎁 **Secret Message** - Hidden message that appears after slideshow completion  
📱 **Fully Responsive** - Works beautifully on all devices  
🎨 **Modern UI** - Glassmorphic design with smooth animations  

## File Structure

```
brithday/
├── index.html          # Main HTML file
├── script.js          # JavaScript logic & interactions
├── style.css          # Styling & animations
├── files/             # Media files (images & audio)
└── README.md          # This file
```

## How to Use

### Local Development
1. Open `index.html` in your browser
2. Click "Tap to Year Overview" button to start
3. Watch the slideshow with synchronized music
4. After slides complete, click "Secret Revel" to see the hidden message

### GitHub Pages Deployment

#### Method 1: Using GitHub Web Interface
1. Create a new GitHub repository named `brithday` (or any name)
2. Upload all files to the repository:
   - `index.html`
   - `script.js`
   - `style.css`
   - `files/` folder with all images and audio
   - `README.md`
3. Go to repository **Settings** → **Pages**
4. Set **Source** to `main` branch
5. GitHub will provide your live URL (e.g., `https://username.github.io/brithday/`)

#### Method 2: Using Git Command Line
```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Birthday surprise web app"

# Add remote repository
git remote add origin https://github.com/username/brithday.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Then enable GitHub Pages in repository settings.

## Media Requirements

Make sure the `files/` folder contains:
- **8 JPEG/JPG images** for the slideshow (slides 1-8)
- **1 MP3 audio file** named `Alex Warren - Ordinary.mp3`

Current expected files in `files/`:
- WhatsApp Image 2025-04-12 at 02.20.59_56a806da.jpg
- 7fc26282-0d8c-446b-bead-eda499b1b7d4.jpg
- d652ccd0-10a6-4a6f-bd13-73583784d214.jpg
- 5194019b-58b9-4efb-b3d1-730ef9466162.jpg
- 289cc508-8f45-4756-ae78-40e02d44f21c.jpg
- 199fefec-76b1-4ab0-8d18-0bc5f8b55d93.jpg
- a80cb535-e532-4600-9c90-f9fd8b5cb087.jpg
- 59a81b52-b1b7-41ce-9665-32d8b6151d68.jpg
- Alex Warren - Ordinary.mp3

## Customization

### Change Music
Replace `files/Alex Warren - Ordinary.mp3` with your desired audio file (keep the same filename).

### Change Images
Replace the 8 image files in `files/` folder with your own photos.

### Edit Text
Modify these in `index.html`:
- Birthday message in the wish card
- Memory dates and descriptions in each slide
- Secret message in the modal

### Adjust Timing
In `script.js`, modify these constants:
- `DEFAULT_MAX_SILENCE_SLIDE_MS` - Slide duration timing
- `MIN_SLIDE_GAP_MS` - Minimum gap between slides

## Browser Compatibility

✅ Chrome/Edge 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- Music requires user interaction to play on some browsers (click the button to ensure playback)
- All assets are loaded with lazy loading for optimal performance
- Works best on modern browsers with CSS backdrop-filter support

## License

Personal use only. Created with ❤️

---

**Enjoy your birthday surprise!** 🎉
