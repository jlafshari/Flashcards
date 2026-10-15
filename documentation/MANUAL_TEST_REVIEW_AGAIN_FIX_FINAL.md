# Manual Testing Guide - Review Again Button Fix

## Purpose
This guide provides step-by-step manual testing procedures to verify that the "Review Again" button works correctly and doesn't skip cards during study sessions.

## Test 1: Basic Review Again Functionality

### Setup
1. Open the application in a browser
2. Go to "Manage Cards" tab
3. Ensure you have at least 5 cards in the system

### Test Steps
1. Go to "Study" tab
2. Click "Start Study Session"
3. On the first card, click to flip it
4. Click "Review Again" button
5. **Expected**: You should see the second card (not the third)
6. Continue through all cards normally
7. **Expected**: After going through cards 2-5, you should see card 1 again at the end

### Pass Criteria
- ✅ No cards are skipped after clicking "Review Again"
- ✅ The card marked for review appears at the end of the session
- ✅ All cards are shown exactly once

## Test 2: Multiple Cards Marked for Review

### Setup
1. Start a fresh study session with 5 cards

### Test Steps
1. On card 1, flip and click "Review Again"
2. **Expected**: Now viewing card 2
3. On card 2, flip and click "Review Again"
4. **Expected**: Now viewing card 3
5. On card 3, flip and click "Easy"
6. **Expected**: Now viewing card 4
7. On card 4, flip and click "Easy"
8. **Expected**: Now viewing card 5
9. On card 5, flip and click "Easy"
10. **Expected**: Now viewing card 1 (first queued)
11. On card 1, flip and click "Easy"
12. **Expected**: Now viewing card 2 (second queued)
13. On card 2, flip and click "Easy"
14. **Expected**: Session complete dialog appears

### Pass Criteria
- ✅ Cards appear in order: 3, 4, 5, 1, 2
- ✅ No cards are skipped
- ✅ All 5 cards are reviewed
- ✅ Session completes successfully

## Test 3: Review Again with Card Limit

### Setup
1. Go to "Study" tab
2. Set card limit to 3
3. Ensure you have at least 5 cards in the system

### Test Steps
1. Click "Start Study Session"
2. **Verify**: Session should show "1 / 3" (3 cards total)
3. On card 1, flip and click "Review Again"
4. **Expected**: Now viewing card 2, still showing "1 / 3"
5. On card 2, flip and click "Review Again"
6. **Expected**: Now viewing card 3, still showing "1 / 3"
7. On card 3, flip and click "Easy"
8. **Expected**: Now viewing card 1 (queued), showing "2 / 3"
9. On card 1, flip and click "Easy"
10. **Expected**: Now viewing card 2 (queued), showing "3 / 3"
11. On card 2, flip and click "Easy"
12. **Expected**: Session complete dialog appears

### Pass Criteria
- ✅ Session maintains exactly 3 cards throughout
- ✅ Card counter shows correct position (1/3, 2/3, 3/3)
- ✅ No additional cards are added to the session
- ✅ All 3 cards are reviewed (including the queued ones)

## Test 4: Review Again on Last Card

### Setup
1. Start a study session with 2 cards

### Test Steps
1. On card 1, flip and click "Easy"
2. **Expected**: Now viewing card 2
3. On card 2, flip and click "Review Again"
4. **Expected**: Session complete dialog appears

### Pass Criteria
- ✅ Marking the last card for review completes the session
- ✅ No errors occur
- ✅ Session complete dialog displays correctly

## Test 5: Mixed Review Pattern

### Setup
1. Start a study session with 5 cards

### Test Steps
1. Card 1: "Easy"
2. Card 2: "Review Again"
3. Card 3: "Easy"
4. Card 4: "Review Again"
5. Card 5: "Review Again"
6. **Expected**: Now viewing card 2 (first queued)
7. Card 2: "Easy"
8. **Expected**: Now viewing card 4 (second queued)
9. Card 4: "Easy"
10. **Expected**: Now viewing card 5 (third queued)
11. Card 5: "Easy"
12. **Expected**: Session complete

### Pass Criteria
- ✅ Order is: 1(E), 2(R), 3(E), 4(R), 5(R), 2(E), 4(E), 5(E)
- ✅ All cards reviewed correctly
- ✅ No cards skipped

## Test 6: Verify Card Display

### Setup
1. Start a study session with cards that have distinct content
2. Example: "Hello", "Goodbye", "Thank you", "Please", "Yes"

### Test Steps
1. On "Hello", click "Review Again"
2. **Verify**: Screen shows "Goodbye" (not "Thank you")
3. Write down which card you see: __________
4. Click "Review Again"
5. **Verify**: Screen shows "Thank you" (not "Please")
6. Write down which card you see: __________

### Pass Criteria
- ✅ Each card appears in the expected order
- ✅ The content matches what you wrote down
- ✅ No card appears twice before all cards are shown once

## Bug Indicators

If you see any of these, the bug is NOT fixed:
- ❌ Cards are skipped (you never see certain cards)
- ❌ You see fewer than the expected number of cards
- ❌ The card counter shows incorrect totals
- ❌ A card appears twice before all other cards are shown
- ❌ Session completes before all cards are reviewed

## Success Indicators

The fix is working if:
- ✅ Every card appears exactly once during the session
- ✅ Cards marked for "Review Again" appear at the end
- ✅ No cards are skipped
- ✅ The order is: [non-queued cards] then [queued cards in order]
- ✅ Card limit is respected (no cards are removed)

## Reporting Issues

If you find any issues during testing, please report:
1. Which test case failed
2. What you expected to happen
3. What actually happened
4. The order of cards you saw
5. Whether you were using a card limit (and what limit)
