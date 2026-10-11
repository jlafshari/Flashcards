# Manual Test Plan: Session Features (Timer, Shuffle, Card Limit)

## Overview
This document provides manual test cases for the new session features:
1. Session timer and elapsed time display
2. Total time reviewed today in stats
3. Shuffle cards option
4. Card limit option

## Prerequisites
- Open `index.html` in a web browser
- Clear browser localStorage before testing (DevTools > Application > Local Storage > Clear All)
- Have at least 5 test cards in different categories

## Test Cases

### Test 1: Session Timer - Basic Functionality
**Steps:**
1. Go to Manage Cards tab
2. Add at least 3 test cards
3. Go to Study tab
4. Click "Start Study Session"
5. Review all cards (flip and mark as Easy or Review Again)
6. Observe the completion alert

**Expected:**
- Alert shows "Session complete! You reviewed X cards in Y sec." (or "Y min Z sec" for longer sessions)
- Time should be reasonable (e.g., 10-30 seconds for quick review)

**Status:** ☐ Pass ☐ Fail

---

### Test 2: Total Time Today Display
**Steps:**
1. Complete Test 1 first
2. Look at the stats section at the top
3. Complete another study session
4. Check stats again

**Expected:**
- Stats show "Reviewed Today: X cards, Y sec" (or appropriate time format)
- Time accumulates across multiple sessions
- Both card count and time increase after each session

**Status:** ☐ Pass ☐ Fail

---

### Test 3: Daily Time Reset
**Steps:**
1. Complete a study session
2. Note the total time displayed
3. Open DevTools > Application > Local Storage
4. Change `reviewDate` to yesterday's date (e.g., "Thu Dec 19 2024")
5. Refresh the page
6. Check the stats

**Expected:**
- Total time resets to "0 sec"
- Card count also resets to 0

**Status:** ☐ Pass ☐ Fail

---

### Test 4: Shuffle Cards - Enabled
**Steps:**
1. Add 5+ cards with memorable content (e.g., A, B, C, D, E)
2. Go to Study tab
3. Check the "Shuffle cards" checkbox
4. Click "Start Study Session"
5. Note the order of cards as you go through them
6. End the session
7. Start a new session with shuffle still enabled
8. Note the order again

**Expected:**
- Cards appear in a different order than the original entry order
- Each new session shows a different random order
- All cards are still present (no cards lost or duplicated)

**Status:** ☐ Pass ☐ Fail

---

### Test 5: Shuffle Cards - Disabled
**Steps:**
1. Ensure you have 5+ cards
2. Uncheck the "Shuffle cards" checkbox
3. Start a study session
4. Note the order of cards

**Expected:**
- Cards appear in the order they were added (newest last)
- Order is consistent across multiple sessions

**Status:** ☐ Pass ☐ Fail

---

### Test 6: Card Limit - Basic Usage
**Steps:**
1. Add 10+ cards to the app
2. Go to Study tab
3. Set "Card limit" to 3
4. Note the button text
5. Click "Start Study Session"
6. Count the cards in the session (check card position indicator)

**Expected:**
- Button shows "Start Study Session (3 cards)"
- Session only includes 3 cards
- Card position shows "X / 3"
- Session completes after reviewing 3 cards

**Status:** ☐ Pass ☐ Fail

---

### Test 7: Card Limit - Exceeds Available Cards
**Steps:**
1. Have exactly 5 cards in the app
2. Set "Card limit" to 20
3. Check the button text
4. Start the session

**Expected:**
- Button shows "Start Study Session (5 cards)"
- Session includes all 5 cards (doesn't try to get 20)

**Status:** ☐ Pass ☐ Fail

---

### Test 8: Card Limit - With Category Filter
**Steps:**
1. Add 10 cards: 5 in "Food" category, 5 in "Greetings" category
2. Select only "Food" category
3. Set card limit to 3
4. Check button text
5. Start session

**Expected:**
- Button shows "Start Study Session (3 cards)"
- Session includes only 3 "Food" cards
- No "Greetings" cards appear

**Status:** ☐ Pass ☐ Fail

---

### Test 9: Shuffle + Card Limit Combined
**Steps:**
1. Add 10+ cards
2. Enable "Shuffle cards"
3. Set "Card limit" to 5
4. Start session and note which 5 cards appear
5. End session
6. Start another session
7. Note which 5 cards appear

**Expected:**
- Each session has exactly 5 cards
- The 5 cards may be different each time (depending on shuffle)
- Cards are in random order

**Status:** ☐ Pass ☐ Fail

---

### Test 10: Preferences Persistence
**Steps:**
1. Enable "Shuffle cards"
2. Set "Card limit" to 7
3. Refresh the page
4. Check the Study tab options

**Expected:**
- "Shuffle cards" checkbox is still checked
- "Card limit" field shows 7
- Preferences survive page reload

**Status:** ☐ Pass ☐ Fail

---

### Test 11: Dynamic Card Limit Update
**Steps:**
1. Have 10 cards total
2. Set card limit to 5
3. Note button text: "Start Study Session (5 cards)"
4. Change card limit to 8
5. Note button text updates immediately

**Expected:**
- Button text updates without clicking anything
- Shows "Start Study Session (8 cards)"

**Status:** ☐ Pass ☐ Fail

---

### Test 12: Time Format - Various Durations
**Steps:**
1. Complete a very quick session (< 60 seconds)
2. Note the time format in the alert
3. Complete a longer session (2-3 minutes)
4. Note the time format

**Expected:**
- Short sessions: "X sec" (e.g., "15 sec")
- Medium sessions: "X min Y sec" (e.g., "2 min 30 sec")
- Stats show accumulated time in appropriate format

**Status:** ☐ Pass ☐ Fail

---

### Test 13: Card Limit Updates with Category Changes
**Steps:**
1. Add 10 cards: 5 "Food", 5 "Greetings"
2. Select all categories (default)
3. Set card limit to 8
4. Note button text
5. Uncheck "Food" category
6. Note button text changes

**Expected:**
- With all categories: "Start Study Session (8 cards)"
- With only "Greetings": "Start Study Session (5 cards)" (or 5, whichever is less)

**Status:** ☐ Pass ☐ Fail

---

### Test 14: Zero or Negative Card Limit
**Steps:**
1. Have 5+ cards
2. Try to set card limit to 0
3. Try to set it to negative number

**Expected:**
- Input should prevent entering 0 or negative (min="1" attribute)
- If somehow entered, should use all available cards

**Status:** ☐ Pass ☐ Fail

---

### Test 15: Session Timer Accuracy
**Steps:**
1. Start a session
2. Use a stopwatch to time yourself
3. Review all cards at a normal pace
4. Compare stopwatch time to app's reported time

**Expected:**
- App's time should be within 1-2 seconds of stopwatch
- Time should be reasonable and not show weird values

**Status:** ☐ Pass ☐ Fail

---

### Test 16: End Session Button Updates Time
**Steps:**
1. Clear localStorage (DevTools > Application > Local Storage > Clear All)
2. Add 5+ test cards
3. Go to Study tab
4. Click "Start Study Session"
5. Review 2-3 cards (don't complete the full session)
6. Wait a few seconds (e.g., 10 seconds)
7. Click "End Session" button
8. Check the stats section at the top

**Expected:**
- Stats show "Reviewed Today: X cards, Y sec" where Y reflects the time spent in the session
- Total time should be approximately the time elapsed since starting the session (e.g., around 10+ seconds)
- Time is updated even though the session was not completed

**Status:** ☐ Pass ☐ Fail

---

### Test 17: End Session Button Accumulates Time Across Sessions
**Steps:**
1. Complete Test 16 first and note the total time
2. Start a new session
3. Review 1-2 cards
4. Wait a few more seconds
5. Click "End Session" button again
6. Check the stats section

**Expected:**
- Total time increases from the previous value
- Both the first and second session times are accumulated
- Time continues to accumulate correctly

**Status:** ☐ Pass ☐ Fail

---

## Edge Cases

### Edge Case 1: Single Card Session
**Steps:**
1. Have exactly 1 card
2. Start a session with shuffle enabled
3. Complete the session

**Expected:**
- No errors
- Session completes normally
- Time is recorded correctly

**Status:** ☐ Pass ☐ Fail

---

### Edge Case 2: Extremely Fast Session
**Steps:**
1. Have 1-2 cards
2. Start session
3. Immediately mark cards as Easy as fast as possible

**Expected:**
- Time shows "0 sec" or "1 sec"
- No errors or negative time

**Status:** ☐ Pass ☐ Fail

---

### Edge Case 3: Very Long Session
**Steps:**
1. Start a session
2. Leave it open for 2+ minutes without completing
3. Then complete it

**Expected:**
- Time shows in "X min Y sec" format
- Time is accurate to the actual elapsed time

**Status:** ☐ Pass ☐ Fail

---

## Test Summary

Total Tests: 20
- Passed: ___
- Failed: ___

## Notes
(Add any observations, bugs found, or additional comments here)
