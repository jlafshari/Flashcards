# Manual Test: Edit Card Feature

## Test Date: 2024
## Feature: Make card text editable in manage cards tab

## Pre-Test Setup
1. Open `index.html` in a web browser
2. Clear browser localStorage (F12 > Application > Local Storage > Clear)
3. Refresh the page

## Test Case 1: Add Cards and View Edit Button
**Steps:**
1. Click on "Manage Cards" tab
2. Add a new card:
   - Bulgarian: "Здравей"
   - English: "Hello"
   - Category: "Greetings"
3. Click "Add Card"
4. Add another card:
   - Bulgarian: "Довиждане"
   - English: "Goodbye"
   - Category: "Greetings"
5. Click "Add Card"

**Expected Results:**
- Both cards appear in the card list
- Each card shows an "Edit" button next to the "Delete" button
- Edit button has purple/blue color matching the app theme
- Card layout looks clean and aligned

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 2: Edit a Card - Basic Flow
**Steps:**
1. Click the "Edit" button on the first card ("Здравей")
2. Observe the UI changes
3. Modify the Bulgarian field to "Добър ден"
4. Modify the English field to "Good day"
5. Keep the Category as "Greetings"
6. Click "Save"

**Expected Results:**
- When Edit is clicked, the card content is replaced with input fields
- Input fields are pre-populated with current values
- Three input fields shown: Bulgarian, English, Category
- Save button (green) and Cancel button (gray) appear
- After clicking Save, card returns to normal view
- Card shows updated text: "Добър ден" / "Good day"
- Card still shows Category: "Greetings"

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 3: Cancel Edit
**Steps:**
1. Click "Edit" on any card
2. Change some text in the input fields
3. Click "Cancel" button

**Expected Results:**
- Card returns to normal view without saving changes
- Original text is still displayed
- No changes were persisted

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 4: Edit Category
**Steps:**
1. Click "Edit" on a card
2. Change only the Category field to "Food"
3. Click "Save"

**Expected Results:**
- Card shows updated category "Category: Food"
- Bulgarian and English text remain unchanged

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 5: Remove Category
**Steps:**
1. Click "Edit" on a card that has a category
2. Clear the Category field (make it empty)
3. Click "Save"

**Expected Results:**
- Card updates successfully
- Category line no longer appears on the card
- Bulgarian and English text remain unchanged

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 6: Validation - Empty Bulgarian Field
**Steps:**
1. Click "Edit" on any card
2. Clear the Bulgarian field (delete all text)
3. Leave English field with text
4. Click "Save"

**Expected Results:**
- Alert appears: "Please fill in both Bulgarian and English fields"
- Card remains in edit mode
- No changes are saved

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 7: Validation - Empty English Field
**Steps:**
1. Click "Edit" on any card
2. Leave Bulgarian field with text
3. Clear the English field (delete all text)
4. Click "Save"

**Expected Results:**
- Alert appears: "Please fill in both Bulgarian and English fields"
- Card remains in edit mode
- No changes are saved

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 8: Edit Multiple Cards in Sequence
**Steps:**
1. Click "Edit" on first card
2. Make changes and click "Save"
3. Immediately click "Edit" on second card
4. Make changes and click "Save"
5. Click "Edit" on first card again
6. Verify the previous changes are still there

**Expected Results:**
- Each card can be edited independently
- Only one card is in edit mode at a time
- All changes persist correctly

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 9: Persistence After Page Refresh
**Steps:**
1. Edit a card and save changes
2. Refresh the browser page (F5)
3. Go to "Manage Cards" tab
4. Check the edited card

**Expected Results:**
- Changes persist after page refresh
- Card shows the edited text
- Edit button is still functional

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 10: Edit Card with Special Characters
**Steps:**
1. Click "Edit" on any card
2. Enter text with special characters:
   - Bulgarian: "< > & ' \""
   - English: "Special & \"quoted\""
3. Click "Save"

**Expected Results:**
- Card saves successfully
- Special characters display correctly (HTML escaped)
- No XSS vulnerabilities (characters rendered as text, not HTML)

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 11: Visual Layout Check
**Steps:**
1. Add several cards with varying text lengths
2. Click "Edit" on different cards
3. Observe the layout

**Expected Results:**
- Edit form fits naturally within card layout
- Input fields are properly sized and aligned
- Buttons have consistent spacing
- Edit mode doesn't break card list layout
- Cards maintain consistent height and spacing

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Case 12: Edit Card Then Study
**Steps:**
1. Edit a card in Manage Cards tab
2. Save the changes
3. Switch to "Study" tab
4. Navigate to the edited card
5. Flip the card

**Expected Results:**
- Edited text appears correctly in study mode
- Card flips properly with new content
- No errors or display issues

**Status:** ⬜ Pass / ⬜ Fail

---

## Summary

Total Tests: 12
- Passed: ___
- Failed: ___

## Notes:
(Add any observations, bugs found, or issues encountered)

---

## Browser Tested:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

## Screen Size Tested:
- [ ] Desktop (> 600px)
- [ ] Mobile (< 600px)
