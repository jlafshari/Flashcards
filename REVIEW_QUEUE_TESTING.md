# Review Queue Feature - Manual Testing Guide

## Overview
The "Review Again" button now marks cards for review and places them at the end of the study queue, allowing users to review challenging cards after going through the remaining cards.

## Setup
1. Open `index.html` in a browser
2. Go to "Manage Cards" tab
3. Add at least 5 flashcards (or import test_import.csv)

## Test Scenarios

### Scenario 1: Basic Review Queue Functionality
1. Go to Study tab
2. Flip the first card
3. Click "Review Again" button
4. Continue through remaining cards
5. **Expected**: After reaching the last original card, the first card should appear again

### Scenario 2: Multiple Cards in Queue
1. Start from the first card
2. Mark cards #1, #2, and #3 as "Review Again"
3. Continue through cards #4 and #5
4. **Expected**: After card #5, you should see cards #1, #2, and #3 again in order

### Scenario 3: Cards Marked Multiple Times
1. Mark card #1 as "Review Again"
2. Continue to card #2
3. Mark card #2 as "Review Again"
4. When you reach card #1 again at the end, mark it "Review Again" again
5. **Expected**: Card #1 should only appear once more at the very end (no duplicates)

### Scenario 4: Easy vs Review Again
1. Mark card #1 as "Review Again"
2. Mark card #2 as "Easy"
3. Mark card #3 as "Review Again"
4. Continue to the end
5. **Expected**: 
   - "Reviewed Today" counter should only count the "Easy" cards
   - Only cards #1 and #3 should appear at the end for review
   - Card #2 should not reappear

### Scenario 5: Queue Cleared on Category Change
1. Add cards with different categories (e.g., "Food", "Greetings")
2. Mark a card as "Review Again"
3. Change the category filter
4. **Expected**: Review queue should be cleared, marked card won't appear at end

### Scenario 6: Queue Cleared on Direction Change
1. Mark a card as "Review Again"
2. Switch from "Bulgarian → English" to "English → Bulgarian"
3. **Expected**: Review queue should be cleared, study session resets

### Scenario 7: Queue Cleared on Tab Switch
1. Mark cards as "Review Again"
2. Switch to "Manage Cards" tab
3. Switch back to "Study" tab
4. **Expected**: Review queue should be cleared, fresh study session

### Scenario 8: Last Card Behavior
1. Navigate to the last card (no queued cards)
2. Flip the card
3. **Expected**: 
   - "Review Again" button should be disabled
   - "Easy" button should be disabled
   - Can only use Previous or Flip buttons

### Scenario 9: Category Filtering with Queue
1. Add cards with categories: 3 "Food", 2 "Greetings"
2. Filter to show only "Food" category
3. Mark 2 food cards as "Review Again"
4. **Expected**: 
   - Only see 3 food cards in rotation
   - The 2 marked cards appear at the end of the 3-card sequence
   - No greeting cards appear

## Keyboard Shortcuts (still work with queue)
- **Space/Enter**: Flip card
- **Left Arrow**: Previous card
- **Right Arrow**: Next card
- **1** (when flipped): Mark as Easy
- **2** (when flipped): Mark for Review Again

## Implementation Notes

### State Management
- `reviewQueue` array stores card IDs marked for review
- Queue persists during a study session
- Queue is cleared when:
  - Switching tabs
  - Changing category filters
  - Changing study direction

### Duplicate Prevention
- Cards can be marked for review multiple times
- But they only appear once in the queue (duplicate prevention)
- Uses card ID for tracking

### Card Counting
- Total cards display includes queued cards
- Card position shows current position in the full sequence
- "Reviewed Today" only counts "Easy" clicks, not "Review Again"

## Edge Cases Covered
1. ✅ Empty queue - normal behavior
2. ✅ All cards marked for review - cycles through again
3. ✅ Same card marked multiple times - appears only once
4. ✅ Queue with category filters - only filtered cards queued
5. ✅ Last card in sequence - buttons properly disabled
6. ✅ Tab switching - queue cleared appropriately
7. ✅ Direction change - queue cleared appropriately

## Automated Tests
Run the automated test suite:
```bash
node test_review_queue.js
```

This tests:
- Queue initialization
- Adding cards to queue
- Duplicate prevention
- Queue clearing on tab/category/direction changes
- Integration with category filtering
