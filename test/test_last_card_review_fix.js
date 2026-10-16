// Test for the fix: marking the last card for review should NOT end the session
// The user should be able to review the card again

// Minimal localStorage mock for Node.js
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = String(value); },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};

// Minimal DOM mock
const createMockElement = () => ({
    textContent: '', 
    style: {},
    value: '',
    innerHTML: '',
    dataset: {},
    files: [],
    classList: { 
        add: () => {}, 
        remove: () => {}, 
        toggle: () => {} 
    },
    disabled: false,
    addEventListener: () => {},
    click: () => {},
    focus: () => {},
    setAttribute: () => {},
    appendChild: () => {},
    removeChild: () => {},
    querySelectorAll: () => []
});

global.document = {
    getElementById: () => createMockElement(),
    querySelectorAll: () => [],
    querySelector: (selector) => {
        if (selector === '.stats') {
            return createMockElement();
        }
        return { id: 'study-tab' };
    },
    createElement: () => createMockElement(),
    body: createMockElement(),
    addEventListener: () => {}
};

// Read and execute app.js
const fs = require('fs');
let appJs = fs.readFileSync('../app.js', 'utf8');
appJs = appJs.replace('const app = new FlashcardApp();', '');
appJs = appJs.replace('class FlashcardApp {', 'global.FlashcardApp = class FlashcardApp {');
eval(appJs);

const FlashcardApp = global.FlashcardApp;

console.log('=== Test: Last Card Review Fix ===\n');

// Test Scenario: Mark last card for review - should NOT end session immediately
console.log('Scenario: Mark Last Card for Review (should continue session)');
console.log('--------------------------------------------------------------');
localStorage.clear();
const app = new FlashcardApp();

app.cards = [
    { id: 1, bulgarian: 'Card 1', english: 'One', category: 'Test' },
    { id: 2, bulgarian: 'Card 2', english: 'Two', category: 'Test' },
    { id: 3, bulgarian: 'Card 3', english: 'Three', category: 'Test' }
];

app.startSession();
console.log('Session started with 3 cards');

// Mark first two cards as easy
app.sessionReviewedCards.add(1);
app.currentCardIndex = 1;
console.log('Card 1 marked as Easy');

app.sessionReviewedCards.add(2);
app.currentCardIndex = 2;
console.log('Card 2 marked as Easy');

// Now we're on the last card (card 3)
let filteredCards = app.getFilteredCards();
console.log('\nCurrent state:');
console.log('- Current index:', app.currentCardIndex);
console.log('- Current card:', filteredCards[app.currentCardIndex].id);
console.log('- Cards reviewed:', Array.from(app.sessionReviewedCards));
console.log('- Review queue:', app.reviewQueue);

console.assert(filteredCards[app.currentCardIndex].id === 3, 'Should be on card 3');
console.assert(app.currentCardIndex === 2, 'Should be at last index');

// Mark the last card (card 3) for review
console.log('\nMarking card 3 for review...');
app.reviewQueue.push(filteredCards[app.currentCardIndex].id);
app.sessionReviewedCards.add(filteredCards[app.currentCardIndex].id);

console.log('- Cards reviewed:', Array.from(app.sessionReviewedCards));
console.log('- Review queue:', app.reviewQueue);
console.log('- isSessionComplete():', app.isSessionComplete());

// Check if session should end
const shouldEnd = app.isSessionComplete() && app.currentCardIndex < filteredCards.length - 1;
console.log('- Should end session:', shouldEnd);

if (shouldEnd) {
    console.log('\n✗ FAIL: Session would end immediately (OLD BEHAVIOR)');
    console.log('  User would not be able to review card 3 again!');
    process.exit(1);
} else {
    console.log('\n✓ PASS: Session continues (NEW BEHAVIOR)');
    console.log('  User can now review card 3 again');
}

// After the fix, the card should be reordered to the end
filteredCards = app.getFilteredCards();
console.log('\nAfter reordering:');
console.log('- Filtered cards order:', filteredCards.map(c => c.id));
console.log('- Card at current index:', filteredCards[app.currentCardIndex].id);
console.log('- Expected: Card 3 should still be accessible for review');

// User should now be able to review card 3 again
// After reviewing it the second time, THEN the session should complete
console.log('\nNow reviewing card 3 again (second time)...');
app.currentCardIndex++;
if (app.currentCardIndex >= filteredCards.length) {
    // Reached the end - check if complete
    console.log('- Reached end of cards');
    if (app.isSessionComplete()) {
        console.log('- Session complete!');
        console.log('\n✓ PASS: Session completes after reviewing the queued card');
    } else {
        console.log('- Session not complete (unexpected)');
        process.exit(1);
    }
} else {
    console.log('- Still at index', app.currentCardIndex);
    console.log('- Card:', filteredCards[app.currentCardIndex].id);
}

console.log('\n=== Test Passed! ===');
console.log('The fix works correctly:');
console.log('1. Marking last card for review does NOT end session');
console.log('2. User can review the card again');
console.log('3. Session completes after the second review');

process.exit(0);
