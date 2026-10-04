# Quick Testing Guide

## 3 Ways to Test the Flashcard App

### 1. 🚀 Quick Manual Test (2 minutes)

1. Open `index.html` in your browser
2. Click "Manage Cards" tab
3. Add a card: `Здравей` → `Hello`
4. Click "Study" tab
5. Try both study directions:
   - Click "Bulgarian → English" button (should show `Здравей`)
   - Click "English → Bulgarian" button (should show `Hello`)
6. Click the card to flip it
7. Verify both sides work correctly

✅ **Pass**: If you can add cards, switch directions, and flip cards  
❌ **Fail**: If errors appear in console (F12)

### 2. 🧪 Automated Unit Tests (30 seconds)

1. Open `test_app.html` in your browser
2. Wait for tests to run automatically
3. Check the summary at top

✅ **Pass**: All tests show green checkmarks  
❌ **Fail**: Any red X marks indicate problems

### 3. 🎯 End-to-End Tests (2 minutes)

1. Open `test_e2e.html` in your browser
2. Click "Run All Scenarios"
3. Watch the automated testing in the iframe

✅ **Pass**: All scenarios complete successfully  
❌ **Fail**: Any steps marked with ❌

## Validation Script

```bash
node validate_html.js
```

Expected: `✅ All checks passed!`

## Common Issues

**Problem**: Tests don't run in `test_app.html` or `test_e2e.html`  
**Solution**: Make sure `app.js`, `index.html`, and `styles.css` are in the same directory

**Problem**: "localStorage is not defined" error  
**Solution**: Open via http:// (use `python3 -m http.server 8000`) instead of file://

**Problem**: Cards don't persist after browser close  
**Solution**: This is expected - check browser's localStorage isn't disabled

## Full Testing Documentation

For comprehensive testing instructions, see [TESTING.md](TESTING.md)
