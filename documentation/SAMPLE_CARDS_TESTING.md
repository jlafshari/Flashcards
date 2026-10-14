# Sample Cards Feature - Manual Testing Guide

## Overview
The app now ships with 10 sample Bulgarian-English flashcards that appear automatically on first launch when localStorage is empty.

## Test Case 1: First-Time User Experience

### Setup
1. Open browser DevTools (F12)
2. Go to Application tab > Local Storage
3. Find the app's domain and clear all localStorage items
4. Reload the page

### Expected Results
- ✅ App displays "Total Cards: 10" in the Study tab
- ✅ The Manage Cards tab shows 10 cards
- ✅ Cards are organized in 3 categories:
  - **Greetings** (3 cards): Здравей/Hello, Довиждане/Goodbye, Добро утро/Good morning
  - **Questions** (3 cards): Как си?/How are you?, Як се казваш?/What is your name?, Къде е...?/Where is...?
  - **Basic Phrases** (4 cards): Благодаря/Thank you, Моля/Please, Да/Yes, Не/No
- ✅ All cards have proper structure (ID, Bulgarian, English, Category, createdAt)
- ✅ Cards are saved to localStorage immediately

### Verification Steps
1. Check Study tab shows "Total Cards: 10"
2. Switch to Manage Cards tab
3. Verify all 10 sample cards are listed
4. Verify each card shows Bulgarian, English, and Category
5. Check localStorage in DevTools - should contain flashcards data
6. Test studying the cards:
   - Click "Start Study Session"
   - Verify cards display correctly
   - Verify you can flip cards and see translations
   - Verify categories appear in category filter

## Test Case 2: Existing User Experience

### Setup
1. Add a new card manually (e.g., "Тест" / "Test" / "Testing")
2. Reload the page

### Expected Results
- ✅ App shows total cards = sample cards (10) + your new card = 11
- ✅ Your custom card is preserved
- ✅ Sample cards are still present
- ✅ No duplicate sample cards are created

### Verification Steps
1. Reload the page
2. Check total card count increases by 1 (not by 10)
3. Verify your custom card is still in the list
4. Verify sample cards are also present

## Test Case 3: User Deletes All Cards

### Setup
1. Go to Manage Cards tab
2. Delete all cards one by one
3. Reload the page

### Expected Results
- ✅ Sample cards do NOT reappear
- ✅ App shows "No flashcards yet!"
- ✅ localStorage contains empty array: `[]`

### Verification Steps
1. After deleting all cards, check total shows 0
2. Reload the page
3. Verify no cards appear (sample cards don't reinitialize)
4. Check localStorage - should have `flashcards: []`

## Test Case 4: Fresh Start (Simulating New User)

### Setup
1. Clear ALL localStorage data
2. Reload the page

### Expected Results
- ✅ 10 sample cards appear again
- ✅ Same as Test Case 1

## Test Case 5: Sample Cards Are Editable and Deletable

### Setup
1. Clear localStorage and reload to get fresh sample cards
2. Pick any sample card (e.g., "Здравей / Hello")

### Expected Results
- ✅ Can edit the card's Bulgarian, English, or Category
- ✅ Can delete the card
- ✅ Sample cards behave exactly like user-created cards

### Verification Steps
1. Click Edit on a sample card
2. Modify the text
3. Click Save
4. Verify changes persist
5. Delete a sample card
6. Verify it's removed
7. Reload page - verify edit/delete persists (cards don't reset)

## Test Case 6: Import/Export Works with Sample Cards

### Setup
1. Clear localStorage and reload to get sample cards
2. Click "Export Cards"

### Expected Results
- ✅ CSV file contains all 10 sample cards
- ✅ CSV format: English,Bulgarian,Category
- ✅ Can re-import the cards

## Automated Testing

For automated browser-based testing, open:
```
test/test_sample_cards.html
```

This provides:
- Automated checks for all 10 cards
- Category verification
- Structure validation
- "Clear localStorage and Reload" button for easy testing

## Test Results

### Manual Test Execution
- [ ] Test Case 1: First-Time User Experience
- [ ] Test Case 2: Existing User Experience  
- [ ] Test Case 3: User Deletes All Cards
- [ ] Test Case 4: Fresh Start
- [ ] Test Case 5: Sample Cards Are Editable/Deletable
- [ ] Test Case 6: Import/Export with Sample Cards

### Notes
_Add any observations or issues found during testing here_

---

## Technical Details

### Implementation
- Method: `initializeSampleCards()` in app.js
- Called by: `loadFromStorage()` when `localStorage.getItem('flashcards')` is null
- Sample cards created using existing `addCard()` method
- Each card gets proper ID, timestamps, and category
- Cards saved to localStorage immediately after creation

### Sample Card Content
1. Здравей → Hello (Greetings)
2. Довиждане → Goodbye (Greetings)
3. Добро утро → Good morning (Greetings)
4. Как си? → How are you? (Questions)
5. Как се казваш? → What is your name? (Questions)
6. Къде е...? → Where is...? (Questions)
7. Благодаря → Thank you (Basic Phrases)
8. Моля → Please (Basic Phrases)
9. Да → Yes (Basic Phrases)
10. Не → No (Basic Phrases)
