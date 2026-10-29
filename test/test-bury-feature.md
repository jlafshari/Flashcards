# Manual Test Plan for Bury Card Feature

## Test 1: Bury card during study session
1. Open index.html in browser
2. Start a study session
3. Flip a card
4. Click "Bury ⏸" button
5. **Expected**: Card should be marked as buried and removed from current session
6. **Expected**: Next card should appear (or session ends if it was the last card)

## Test 2: Keyboard shortcut
1. Start a study session
2. Flip a card
3. Press "3" key
4. **Expected**: Same behavior as clicking Bury button

## Test 3: Bury/Unbury in Manage Cards
1. Go to Manage Cards tab
2. Find a card and click "Bury" button
3. **Expected**: Card should show with faded appearance and strikethrough
4. **Expected**: Button should change to "Unbury"
5. Click "Unbury" button
6. **Expected**: Card should return to normal appearance

## Test 4: Buried cards excluded from new sessions
1. Bury a card in Manage Cards tab
2. Go to Study tab
3. Start a new session
4. **Expected**: Buried card should not appear in the session
5. **Expected**: Total cards count should exclude buried cards

## Test 5: Bury last card in session
1. Start a session with 2-3 cards
2. Mark all cards as "Easy" except one
3. On the last card, flip it and click "Bury"
4. **Expected**: Session should end gracefully

## Test 6: Data persistence
1. Bury some cards
2. Refresh the page
3. **Expected**: Buried cards should still be buried
4. **Expected**: Buried cards should not appear in study session

