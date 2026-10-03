# Flashcards

A simple, user-friendly flashcard web application for learning English from Bulgarian.

## Features

- ✨ **Simple Interface** - Clean, intuitive design that's easy to understand and use
- 🎴 **Card Management** - Add, view, and delete flashcards with Bulgarian and English text
- 🔄 **Flip Animation** - Click or press Space/Enter to flip cards and reveal translations
- ⌨️ **Keyboard Navigation** - Use arrow keys to navigate between cards
- 💾 **Automatic Saving** - All cards are saved to browser local storage
- 📊 **Study Tracking** - See how many cards you've reviewed today
- 🚫 **No Limits** - Review as many cards as you want, whenever you want

## Getting Started

### Option 1: Open Locally
1. Download the repository
2. Open `index.html` in any modern web browser
3. Start adding flashcards!

### Option 2: Use a Web Server
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx http-server
```

Then navigate to `http://localhost:8000` in your browser.

## How to Use

### Adding Cards
1. Click the **"Manage Cards"** tab
2. Enter a Bulgarian word or phrase in the first field
3. Enter the English translation in the second field
4. Click **"Add Card"** or press Enter

### Studying Cards
1. Click the **"Study"** tab to review your flashcards
2. Click on a card or press Space/Enter to flip and see the translation
3. Use the **Previous/Next** buttons or arrow keys (← →) to navigate
4. Review as many cards as you like - there are no daily limits!

### Managing Cards
- View all your cards in the **"Manage Cards"** tab
- Click **"Delete"** to remove cards you no longer need

## Key Differences from Anki

This app was designed to be simpler and more flexible than Anki:

1. **No Daily Limits** - Review as many cards as you want, anytime
2. **Simpler UI** - Clear tabs and straightforward controls
3. **Instant Start** - No complex setup or deck configuration
4. **Browser-Based** - Works in any modern web browser
5. **Lightweight** - Just three files (HTML, CSS, JavaScript)

## Technical Details

- **Pure JavaScript** - No frameworks or build tools required
- **Local Storage** - All data stored in browser (no server needed)
- **Responsive Design** - Works on desktop and mobile devices
- **Keyboard Shortcuts** - Arrow keys for navigation, Space/Enter to flip

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Data Storage

All flashcards are stored in your browser's local storage. This means:
- ✅ Your data stays private on your device
- ✅ No account or internet connection needed
- ⚠️ Clearing browser data will delete your cards
- ⚠️ Cards are not synced across devices

## Future Enhancements

Potential features for future versions:
- Import/export cards to JSON or CSV
- Multiple decks for different topics
- Shuffle/randomize card order
- Search and filter cards
- Dark mode
- Progress statistics and graphs

## License

This is a personal learning project. Feel free to use and modify as needed.
