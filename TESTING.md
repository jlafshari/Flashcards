# Testing Guide for Flashcards App

This guide explains how to test the flashcard application through various methods.

## Table of Contents
- [Quick Start](#quick-start)
- [Manual Testing](#manual-testing)
- [Automated Testing](#automated-testing)
- [Browser Compatibility Testing](#browser-compatibility-testing)
- [Test Scenarios](#test-scenarios)
- [Known Limitations](#known-limitations)

## Quick Start

### 1. Manual Testing in Browser
The simplest way to test the app:

1. Open `index.html` in your web browser (Chrome, Firefox, or Safari)
2. Follow the [Manual Test Checklist](#manual-test-checklist) below

### 2. Automated Unit Tests
Run the built-in test suite:

1. Open `test_app.html` in your web browser
2. The tests will run automatically and display results
3. All tests should show green checkmarks

### 3. File Validation
Validate the HTML, CSS, and JavaScript structure:

```bash
node validate_html.js
```

Expected output: `✅ All checks passed!`

## Manual Testing

### Manual Test Checklist

#### Initial Load
- [ ] Open `index.html` - page loads without errors
- [ ] Check browser console (F12) - no JavaScript errors
- [ ] Default tab is "Study"
- [ ] Message displays: "No flashcards yet! Go to 'Manage Cards' to add some."
- [ ] Stats show: Total Cards: 0, Reviewed Today: 0

#### Adding Cards
- [ ] Click "Manage Cards" tab
- [ ] Enter Bulgarian text: `Здравей`
- [ ] Enter English text: `Hello`
- [ ] Click "Add Card" button
- [ ] Button changes to "✓ Added!" briefly with green background
- [ ] Card appears in the list below with both texts visible
- [ ] Card count updates to show "All Cards (1)"
- [ ] Input fields are cleared and focus returns to Bulgarian field

#### Studying Cards
- [ ] Click "Study" tab
- [ ] Total Cards shows "1"
- [ ] Direction selector shows two buttons: "Bulgarian → English" and "English → Bulgarian"
- [ ] "Bulgarian → English" button is active (highlighted) by default
- [ ] Card displays with "Bulgarian" label and "Здравей" text
- [ ] Card position shows "1 / 1"
- [ ] Previous button is disabled
- [ ] Next button is disabled (only 1 card)

#### Direction Switching
- [ ] Click "English → Bulgarian" button
- [ ] Button becomes active (highlighted)
- [ ] "Bulgarian → English" button becomes inactive
- [ ] Card now shows "English" label and "Hello" text (front side)
- [ ] Flip the card - back side shows "Bulgarian" label and "Здравей"
- [ ] Click "Bulgarian → English" button to switch back
- [ ] Card resets to show "Bulgarian" label and "Здравей" (front side)
- [ ] Flip the card - back side shows "English" label and "Hello"

#### Card Flipping
- [ ] Click on the card - it flips to show "Hello"
- [ ] Click again - it flips back to "Здравей"
- [ ] Click "Flip Card" button - works the same way
- [ ] Press Space key - card flips
- [ ] Press Enter key - card flips

#### Navigation
Add more cards first:
- [ ] Go to "Manage Cards" and add 2 more cards
- [ ] Return to "Study" tab
- [ ] Click "Next →" button - moves to card 2/3
- [ ] Position updates correctly
- [ ] Click "Previous ←" button - returns to card 1/3
- [ ] Press right arrow key → - navigates to next card
- [ ] Press left arrow key ← - navigates to previous card
- [ ] At first card, Previous button is disabled
- [ ] At last card, Next button is disabled

#### Review Tracking
- [ ] Navigate through several cards using Next button
- [ ] "Reviewed Today" counter increases each time you move to next card
- [ ] Counter does NOT increase when going to previous cards

#### Deleting Cards
- [ ] Go to "Manage Cards" tab
- [ ] Click "Delete" button on a card
- [ ] Card is immediately removed from the list
- [ ] Card count decreases by 1
- [ ] Go to "Study" tab - total cards reflects the deletion

#### Data Persistence
- [ ] Add several cards
- [ ] Switch between study directions (Bulgarian → English and English → Bulgarian)
- [ ] Close the browser tab completely
- [ ] Open `index.html` again
- [ ] All cards are still there
- [ ] Review count persists for same day
- [ ] Last selected study direction is remembered

#### Input Validation
- [ ] Try to add a card with empty Bulgarian field
- [ ] Alert shows: "Please fill in both Bulgarian and English fields"
- [ ] Try to add a card with empty English field
- [ ] Same alert appears
- [ ] Add a card with leading/trailing spaces - spaces are trimmed

#### Keyboard Shortcuts
- [ ] In Study tab, press Space - flips card
- [ ] Press Enter - flips card
- [ ] Press ← (left arrow) - goes to previous card
- [ ] Press → (right arrow) - goes to next card
- [ ] In Manage Cards tab, type in Bulgarian field and press Enter - focus moves to English field
- [ ] In English field, press Enter - adds the card

### Visual Testing
- [ ] Card has smooth flip animation (3D effect)
- [ ] Colors and gradients display correctly
- [ ] Buttons have hover effects
- [ ] Text is readable and properly sized
- [ ] Layout is centered and well-spaced
- [ ] Tab switching is smooth

### Responsive Design Testing
- [ ] Resize browser window to narrow width (< 600px)
- [ ] Layout adjusts for mobile view
- [ ] All elements remain accessible and readable
- [ ] Buttons are touch-friendly sized

## Automated Testing

### Running Unit Tests

The app includes a basic unit test suite in `test_app.html`:

1. Open `test_app.html` in a web browser
2. Tests run automatically on page load
3. Results display with green (pass) or red (fail) indicators

#### Current Test Coverage
- App initialization
- Adding single cards
- Adding multiple cards
- Deleting cards
- localStorage persistence
- Navigation (next/previous)
- Navigation boundary handling
- Review count tracking

#### Expected Output
```
✓ App initializes
✓ Cards array is empty initially
✓ Can add a card
✓ Cards are stored
✓ Can add multiple cards
✓ Can delete a card
✓ localStorage persistence
✓ Current card index is valid
✓ Can navigate between cards
✓ Navigation bounds are respected
✓ Review count tracks
All tests completed!
```

### Running File Validation

```bash
node validate_html.js
```

This checks:
- HTML structure and required elements
- CSS classes and animations
- JavaScript class and methods
- File integrity

## Browser Compatibility Testing

### Recommended Browsers
Test in these browsers for best coverage:
- **Chrome/Edge** 90+ (most common)
- **Firefox** 88+
- **Safari** 14+ (for macOS/iOS users)

### What to Check
- [ ] Open app in Chrome - all features work
- [ ] Open app in Firefox - all features work
- [ ] Open app in Safari - all features work
- [ ] Card flip animation works in all browsers
- [ ] localStorage works in all browsers
- [ ] Keyboard shortcuts work in all browsers

### Known Browser Issues
- **File:// Protocol**: Some browsers restrict localStorage when opening files directly. Use a local server if needed:
  ```bash
  # Python
  python3 -m http.server 8000
  
  # Node.js
  npx http-server
  ```

## Test Scenarios

### Scenario 1: First-Time User
1. Open app for first time
2. See empty state message
3. Go to Manage Cards
4. Add 5 cards with common Bulgarian phrases
5. Return to Study tab
6. Review all cards using Next button
7. Verify review count shows 4 (moved 4 times)

### Scenario 2: Daily Review
1. Open app with existing cards
2. Navigate through all cards
3. Note the "Reviewed Today" count
4. Close and reopen browser
5. Count persists for same day
6. Change system date to next day (if possible)
7. Reopen app - count resets to 0

### Scenario 3: Card Management
1. Add 10 cards
2. Study first 5 cards
3. Go to Manage Cards
4. Delete cards 2, 4, 6
5. Return to Study
6. Verify deleted cards are gone
7. Verify navigation still works correctly

### Scenario 4: Keyboard Power User
1. Open app with 10+ cards
2. Navigate using only keyboard:
   - → to move forward
   - ← to move backward
   - Space to flip cards
3. Switch to Manage tab with mouse
4. Add cards using only keyboard:
   - Type Bulgarian text
   - Press Enter
   - Type English text
   - Press Enter to add

### Scenario 5: Mobile Usage
1. Open app on mobile device or narrow browser window
2. Verify layout is usable
3. Tap to flip cards
4. Use touch to navigate (buttons)
5. Add new cards using mobile keyboard
6. All features accessible

### Scenario 6: Data Loss Prevention
1. Add several important cards
2. Try to clear browser data/cache
3. Note that cards will be lost (expected)
4. **Future enhancement**: Test export/import when implemented

### Scenario 7: Special Characters
1. Add cards with special characters:
   - Cyrillic: `Здравей, как си?`
   - Punctuation: `"Hello!" he said.`
   - Numbers: `5 апельсина = 5 oranges`
2. Verify all characters display correctly
3. Flip cards to check both sides
4. Delete and verify no errors

### Scenario 8: Stress Testing
1. Add 50+ flashcards
2. Verify app remains responsive
3. Navigate through all cards
4. Check page load time
5. Verify localStorage hasn't hit limits
6. Test scrolling in Manage Cards list

## Testing Edge Cases

### Empty States
- [ ] No cards - proper message displays
- [ ] Delete all cards - returns to empty state

### Boundary Conditions
- [ ] Navigate at first card - Previous disabled
- [ ] Navigate at last card - Next disabled
- [ ] Add card with max text length (test very long phrases)

### Data Validation
- [ ] Add card with only spaces - should be rejected
- [ ] Add card with HTML characters like `<script>` - should be escaped
- [ ] Add duplicate cards - should be allowed (no restriction)

### localStorage Limits
- [ ] Add many cards to approach ~5MB limit
- [ ] Monitor for localStorage quota errors
- [ ] Note: Typical app usage unlikely to hit limits

## Known Limitations

### Current Implementation
1. **No Export/Import**: Data can't be backed up or moved to another browser
2. **Single Browser/Device**: Cards stored only in current browser
3. **No Search**: Can't search for specific cards
4. **No Shuffle**: Cards always in insertion order
5. **No Categories**: All cards in one collection

### Testing Workarounds
- To test persistence across browsers, manually recreate cards
- To test with large datasets, use browser console to bulk-add:
  ```javascript
  for (let i = 1; i <= 50; i++) {
    app.addCard(`Български ${i}`, `English ${i}`);
  }
  ```

## Troubleshooting Tests

### Tests Fail in test_app.html
- Check browser console for errors
- Ensure `app.js` is in same directory
- Try in different browser
- Clear localStorage: `localStorage.clear()` in console

### Manual Tests Don't Work
- Check browser console for JavaScript errors
- Verify all files (index.html, app.js, styles.css) are present
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache and localStorage

### localStorage Not Persisting
- Check browser privacy settings
- Use http:// or https:// instead of file://
- Try different browser
- Check available storage: `navigator.storage.estimate()`

### Visual Issues
- Verify `styles.css` loaded correctly
- Check for CSS conflicts if testing in production environment
- Test in browser DevTools responsive mode
- Clear browser cache

## Performance Testing

### Metrics to Monitor
- **Page Load**: Should be < 100ms (very lightweight)
- **Card Addition**: Instant (< 50ms)
- **Card Flip Animation**: Smooth 600ms transition
- **Navigation**: Instant (< 50ms)
- **localStorage Save**: < 10ms for typical dataset

### How to Measure
Use browser DevTools:
1. Open DevTools (F12)
2. Go to Performance tab
3. Record user actions
4. Check timing of operations

## Automated Testing Scripts

### Bulk Add Cards (Browser Console)
```javascript
// Add 10 test cards
const testWords = [
    ['Здравей', 'Hello'],
    ['Довиждане', 'Goodbye'],
    ['Благодаря', 'Thank you'],
    ['Моля', 'Please'],
    ['Да', 'Yes'],
    ['Не', 'No'],
    ['Добро утро', 'Good morning'],
    ['Лека нощ', 'Good night'],
    ['Извинете', 'Excuse me'],
    ['Как се казваш?', 'What is your name?']
];

testWords.forEach(([bg, en]) => app.addCard(bg, en));
console.log(`Added ${testWords.length} test cards`);
```

### Clear All Data
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Check Storage Usage
```javascript
// In browser console
const cards = JSON.parse(localStorage.getItem('flashcards') || '[]');
const json = JSON.stringify(cards);
const bytes = new Blob([json]).size;
console.log(`Storage: ${bytes} bytes (${(bytes/1024).toFixed(2)} KB)`);
console.log(`Cards: ${cards.length}`);
console.log(`Limit: ~5MB = 5,120 KB`);
console.log(`Usage: ${((bytes/1024)/5120*100).toFixed(2)}%`);
```

## Continuous Testing Checklist

Use this for regular testing during development:

- [ ] Run `node validate_html.js` - all checks pass
- [ ] Open `test_app.html` - all unit tests pass
- [ ] Open `index.html` - no console errors
- [ ] Add a card - works correctly
- [ ] Study cards - flip and navigation work
- [ ] Delete a card - works correctly
- [ ] Close and reopen - data persists
- [ ] Test in 2+ different browsers

## Reporting Issues

When you find a bug during testing, document:
1. **Steps to reproduce**: Exact clicks/actions taken
2. **Expected behavior**: What should happen
3. **Actual behavior**: What actually happened
4. **Browser**: Name and version
5. **Console errors**: Any JavaScript errors from F12 console
6. **Screenshots**: If visual issue

## Future Testing Enhancements

Potential additions for more comprehensive testing:
- Integration with testing frameworks (Jest, Mocha)
- Automated end-to-end tests (Playwright, Cypress)
- Accessibility testing (axe, WAVE)
- Performance monitoring
- Error tracking
- Analytics for usage patterns
