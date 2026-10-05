# Flashcards

A simple, user-friendly flashcard web application for learning English from Bulgarian.

## Features

- ✨ **Simple Interface** - Clean, intuitive design that's easy to understand and use
- 🎴 **Card Management** - Add, view, and delete flashcards with Bulgarian and English text
- 🔄 **Bidirectional Testing** - Study from Bulgarian to English OR English to Bulgarian
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
2. **Choose your study direction:**
   - **Bulgarian → English**: See Bulgarian word, guess the English translation
   - **English → Bulgarian**: See English word, guess the Bulgarian translation
3. Click on a card or press Space/Enter to flip and see the translation
4. After flipping, indicate if the card was:
   - **Easy ✓** (press **1**) - You knew it well, counts toward daily review
   - **Review Again ↻** (press **2**) - Needs more practice, moves to next without counting
5. Use the **Previous/Next** buttons or arrow keys (← →) to navigate
6. Review as many cards as you like - there are no daily limits!

The app remembers your preferred study direction, so you can practice both ways!

### Managing Cards
- View all your cards in the **"Manage Cards"** tab
- Click **"Delete"** to remove cards you no longer need

## Key Differences from Anki

This app was designed to be simpler and more flexible than Anki:

1. **No Daily Limits** - Review as many cards as you want, anytime
2. **Bidirectional Testing** - Easily switch between Bulgarian→English and English→Bulgarian
3. **Simpler UI** - Clear tabs and straightforward controls
4. **Instant Start** - No complex setup or deck configuration
5. **Browser-Based** - Works in any modern web browser
6. **Lightweight** - Just three files (HTML, CSS, JavaScript)

## Technical Details

- **Pure JavaScript** - No frameworks or build tools required
- **Local Storage** - All data stored in browser (no server needed)
- **Responsive Design** - Works on desktop and mobile devices
- **Keyboard Shortcuts**:
  - Arrow keys (← →) for navigation
  - Space/Enter to flip cards
  - **1** for Easy (after flipping)
  - **2** for Review Again (after flipping)

## Testing

This project includes comprehensive testing tools to ensure quality:

- **Unit Tests**: Open `test_app.html` for automated unit tests
- **End-to-End Tests**: Open `test_e2e.html` for user workflow testing  
- **File Validation**: Run `node validate_html.js` to verify structure
- **Manual Testing**: See `TESTING.md` for detailed testing guide

For complete testing instructions, see [TESTING.md](TESTING.md).

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
