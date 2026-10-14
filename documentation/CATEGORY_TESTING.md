# Manual Testing Guide for Category Feature

## Test Overview
This guide covers manual testing for the new category feature in the Flashcards app.

## Prerequisites
- Open `index.html` in a web browser
- Have `test_import_categories.csv` available for import testing

## Test Cases

### 1. Add Card with Category
**Steps:**
1. Go to "Manage Cards" tab
2. Fill in Bulgarian field: `Здравей`
3. Fill in English field: `Hello`
4. Fill in Category field: `Greetings`
5. Click "Add Card"

**Expected Result:**
- Card is added successfully
- Card appears in the card list with "Category: Greetings" displayed
- Success message shows "✓ Added!"

### 2. Add Card without Category
**Steps:**
1. Go to "Manage Cards" tab
2. Fill in Bulgarian field: `Хляб`
3. Fill in English field: `Bread`
4. Leave Category field empty
5. Click "Add Card"

**Expected Result:**
- Card is added successfully
- Card appears in the card list without category info
- Success message shows "✓ Added!"

### 3. Keyboard Navigation in Add Form
**Steps:**
1. Go to "Manage Cards" tab
2. Type Bulgarian word and press Enter
3. Type English translation and press Enter
4. Type Category and press Enter

**Expected Result:**
- Enter in Bulgarian field focuses English field
- Enter in English field focuses Category field
- Enter in Category field adds the card

### 4. Category Filter Display
**Steps:**
1. Add cards with different categories (Greetings, Food, Drinks)
2. Add at least one card without a category
3. Go to "Study" tab

**Expected Result:**
- Category filter section appears below stats
- Shows checkboxes for all categories including "Uncategorized" for cards without categories
- All checkboxes are checked by default

### 5. Filter by Single Category
**Steps:**
1. Go to "Study" tab with cards in multiple categories
2. Uncheck all categories except "Greetings"
3. Navigate through cards

**Expected Result:**
- Only cards with "Greetings" category are shown
- Total Cards count reflects filtered cards only
- Card position shows "1 / X" where X is the number of greeting cards

### 6. Filter by Multiple Categories
**Steps:**
1. Go to "Study" tab
2. Check only "Food" and "Drinks" categories
3. Uncheck all other categories
4. Navigate through cards

**Expected Result:**
- Only cards with "Food" or "Drinks" categories are shown
- Total Cards count reflects filtered cards
- Can navigate through all Food and Drinks cards

### 7. Filter by Uncategorized
**Steps:**
1. Add cards with and without categories
2. Go to "Study" tab
3. Uncheck all categories except "Uncategorized"

**Expected Result:**
- Only cards without a category are shown
- Works correctly

### 8. All Categories Selected Shows All Cards
**Steps:**
1. Go to "Study" tab
2. Uncheck a category
3. Check it again so all categories are checked

**Expected Result:**
- All cards are shown (no filtering)
- Total Cards count shows all cards

### 9. Export Cards with Categories
**Steps:**
1. Add multiple cards with different categories
2. Go to "Manage Cards" tab
3. Click "Export Cards"
4. Open downloaded CSV file

**Expected Result:**
- CSV file has 3 columns: English, Bulgarian, Category
- Cards with categories show category in third column
- Cards without categories have empty third column

### 10. Import 3-Column CSV
**Steps:**
1. Go to "Manage Cards" tab
2. Click "Import Cards (Replace)"
3. Select `test_import_categories.csv`

**Expected Result:**
- Alert shows "Successfully imported 10 cards"
- Cards appear in card list with categories
- Go to Study tab - category filter shows Greetings, Questions, Food, Drinks, Uncategorized

### 11. Import 2-Column CSV (Backward Compatibility)
**Steps:**
1. Create a CSV with only 2 columns (English, Bulgarian)
2. Click "Import Cards (Replace)"
3. Select the 2-column CSV

**Expected Result:**
- Cards import successfully
- Cards have no category (treated as empty)
- No errors occur

### 12. Category Filter Persistence
**Steps:**
1. Go to "Study" tab
2. Select specific categories (e.g., only "Food")
3. Switch to "Manage Cards" tab
4. Switch back to "Study" tab

**Expected Result:**
- Selected categories are remembered
- Filter still shows only "Food" cards

### 13. Navigate with Category Filter Active
**Steps:**
1. Add 3 Food cards and 3 Greetings cards
2. Go to "Study" tab
3. Filter to show only "Food" category
4. Use Previous/Next buttons and keyboard arrows

**Expected Result:**
- Navigation only cycles through Food cards
- Card position shows "1 / 3", "2 / 3", "3 / 3"
- Cannot go beyond filtered card range

### 14. Flip Card with Category Filter
**Steps:**
1. Go to "Study" tab with category filter active
2. Flip card
3. Mark as Easy or Review Again

**Expected Result:**
- Card flips normally
- Easy/Review buttons work
- Advances to next card within filtered category

### 15. No Cards Message with Filter
**Steps:**
1. Add cards only in "Food" category
2. Go to "Study" tab
3. Uncheck "Food", check only "Greetings"

**Expected Result:**
- Shows "No flashcards yet!" message or empty state
- No errors in console

### 16. Responsive Design
**Steps:**
1. Resize browser to mobile width (< 600px)
2. Check both Study and Manage Cards tabs

**Expected Result:**
- Category checkboxes stack vertically on mobile
- Category input field looks good
- Category display in card list is readable

### 17. Special Characters in Category
**Steps:**
1. Add card with category: `Food & Drinks`
2. Add card with category: `"Phrases"`
3. Export and re-import

**Expected Result:**
- Special characters handled correctly
- CSV escaping works
- Import restores categories correctly

## Performance Check
**Steps:**
1. Import 50+ cards with various categories
2. Test category filter switching
3. Navigate through filtered cards

**Expected Result:**
- UI remains responsive
- No lag when switching categories
- Smooth navigation

## Browser Compatibility
Test the above in:
- Chrome/Edge
- Firefox
- Safari (if available)

## Success Criteria
- All test cases pass
- No console errors
- UI looks good and is intuitive
- Backward compatibility maintained (2-column CSV still works)
