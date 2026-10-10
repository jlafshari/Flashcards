# Manual Test Plan for Bug Fixes

This document describes how to manually test the two bug fixes in an active study session.

## Setup
1. Open `index.html` in a browser
2. Add at least 3 flashcards (e.g., "Здравей" / "Hello", "Довиждане" / "Goodbye", "Благодаря" / "Thank you")
3. Click "Start Session" to begin a study session

## Bug 1: Review Again Button Advances to Next Card

**Expected Behavior**: When marking a card for "Review Again", the user should see the next card immediately, not the same card.

**Test Steps**:
1. Flip the first card (click "Flip Card" button)
2. Click "Review Again" button
3. ✅ **PASS**: You should now see the second card (not the same card)
4. Continue through cards and verify the first card appears at the end

**Previous Bug**: The same card would show immediately after clicking "Review Again"

## Bug 2: Easy and Review Again Buttons Work on Last Card

**Expected Behavior**: When viewing the last card in a session, both "Easy" and "Review Again" buttons should be enabled and functional.

**Test Steps**:

### Test 2a: Mark Last Card as Easy
1. Navigate through all cards until you reach the last card
2. Flip the last card
3. ✅ **PASS**: "Easy" and "Review Again" buttons should be enabled (not grayed out)
4. Click "Easy" button
5. ✅ **PASS**: Session should complete (show completion modal or message)

### Test 2b: Mark Last Card for Review Again
1. Start a new session
2. Mark all cards as "Easy" except the last one
3. On the last card, flip it
4. ✅ **PASS**: "Easy" and "Review Again" buttons should be enabled
5. Click "Review Again" button
6. ✅ **PASS**: The last card should be added to the review queue
7. ✅ **PASS**: You should see the card again (since all cards have been reviewed once)

**Previous Bug**: Both buttons were disabled on the last card, preventing the user from completing the session properly.

## Automated Tests

Run the following command to verify the fixes programmatically:
```bash
node test_bug_fixes.js
```

All 5 tests should pass:
- ✓ Bug 1: markForReview advances to next card in session
- ✓ Bug 1: markForReview advances to next card in normal mode
- ✓ Bug 2: Easy and Review buttons enabled on last card
- ✓ Bug 2: markEasy on last card completes session
- ✓ Bug 2: markForReview on last card adds to queue and allows review
