# Manual Test Guide - Review Queue Bug Fix

## Purpose
Verify that cards marked with "Review Again" are moved to the end of the deck during the current study session.

## Test Setup
1. Open `test_debug_queue.html` in a browser
2. Switch to the "Manage Cards" tab
3. Add 5 test cards:
   - Bulgarian: "Едно", English: "One"
   - Bulgarian: "Две", English: "Two"
   - Bulgarian: "Три", English: "Three"
   - Bulgarian: "Четири", English: "Four"
   - Bulgarian: "Пет", English: "Five"
4. Switch back to "Study" tab

## Test Case 1: Mark First Card for Review

### Steps:
1. You should see card "Едно" (One)
2. Click "Flip Card" to reveal the answer
3. Click "Review Again ↻" button (or press '2' key)

### Expected Result:
- Debug panel should show:
  - Review Queue: [card_id]
  - Current Card Index: 0
  - Filtered Cards Count: 5
- The card should immediately change to "Две" (Two) without incrementing the index
- Position indicator should show "1 / 5"

### What to verify:
- The first card ("Едно") has been removed from position 1 and moved to the end
- You can now see "Две" (Two) at position 1

## Test Case 2: Continue Through Deck

### Steps:
1. Flip and mark "Две" as "Easy ✓" (or press '1')
2. Flip and mark "Три" as "Easy ✓"
3. Flip and mark "Четири" as "Easy ✓"
4. Flip and mark "Пет" as "Easy ✓"

### Expected Result:
- You should now see "Едно" (One) again
- Position indicator should show "5 / 5"
- This is the card you marked for review earlier

## Test Case 3: Mark Multiple Cards

### Steps:
1. Refresh the page to start over
2. Go through cards and mark cards 1, 2, and 4 for review:
   - Card 1 ("Едно"): Flip → Review Again
   - Card 2 ("Две"): Flip → Review Again  
   - Card 3 ("Три"): Flip → Easy
   - Card 4 ("Четири"): Flip → Review Again
   - Card 5 ("Пет"): Flip → Easy

### Expected Result:
- After marking all cards, you should see the 3 review cards appear:
  - Position 3/5: "Едно" (first marked)
  - Position 4/5: "Две" (second marked)
  - Position 5/5: "Четири" (third marked)
- They appear in the order they were marked

## Test Case 4: Review Queue Persists Until Context Change

### Steps:
1. Mark first card for review
2. Switch to "Manage Cards" tab
3. Switch back to "Study" tab

### Expected Result:
- Review queue is cleared (shown in debug panel)
- Deck order is back to original

## Test Case 5: Queue Clears on Direction Change

### Steps:
1. Mark first card for review
2. Click "English → Bulgarian" button

### Expected Result:
- Review queue is cleared
- Deck shows in original order with reversed direction

## Success Criteria

✅ Cards marked for review immediately move to the end of the deck
✅ The current index doesn't increment (next card appears at current position)
✅ Multiple marked cards appear at the end in the order they were marked
✅ Queue clears when changing tabs, direction, or categories
✅ Position indicator correctly shows total including queued cards

## Known Issues (Not Bugs)

- If you mark the last card for review, it stays at the end (this is correct behavior)
- Queue is not persisted to localStorage (intentional - fresh start each session)
