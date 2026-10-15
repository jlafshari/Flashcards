// Test to demonstrate the Review Again bug
// The bug: markForReview() gets the current card using this.sessionCards[this.currentCardIndex]
// but after adding to review queue, getFilteredCards() returns a reordered array
// This causes currentCardIndex to point to wrong cards

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
// Remove the auto-initialization at the end
appJs = appJs.replace('const app = new FlashcardApp();', '');
// Make FlashcardApp global
appJs = appJs.replace('class FlashcardApp {', 'global.FlashcardApp = class FlashcardApp {');
eval(appJs);

const FlashcardApp = global.FlashcardApp;

console.log('=== Test: Review Again Button Misalignment Bug ===\n');

// Create app instance
localStorage.clear();
const app = new FlashcardApp();

// Setup: Create 5 test cards
app.cards = [
    { id: 1, bulgarian: 'Card 1', english: 'Card One', category: 'Test' },
    { id: 2, bulgarian: 'Card 2', english: 'Card Two', category: 'Test' },
    { id: 3, bulgarian: 'Card 3', english: 'Card Three', category: 'Test' },
    { id: 4, bulgarian: 'Card 4', english: 'Card Four', category: 'Test' },
    { id: 5, bulgarian: 'Card 5', english: 'Card Five', category: 'Test' }
];

// Start a session with all 5 cards
app.inSession = true;
app.sessionCards = [...app.cards];
app.sessionReviewedCards = new Set();
app.currentCardIndex = 0;
app.reviewQueue = [];

console.log('Initial state:');
console.log('- Session cards:', app.sessionCards.map(c => c.id));
console.log('- Current index:', app.currentCardIndex);
console.log('- Current card (from sessionCards):', app.sessionCards[app.currentCardIndex].id);
console.log('');

// Simulate what markForReview() does:
// 1. Gets current card from sessionCards[currentCardIndex]
// 2. Adds it to review queue
// 3. Calls nextCard() which uses getFilteredCards()

console.log('Step 1: Mark card 1 for review again (simulate markForReview)');
const currentCard = app.sessionCards[app.currentCardIndex]; // Line 320 in app.js
console.log('- Card being marked (from sessionCards[0]):', currentCard.id);

app.reviewQueue.push(currentCard.id); // Line 323
app.sessionReviewedCards.add(currentCard.id); // Line 326

console.log('- Review queue after marking:', app.reviewQueue);

// Now when nextCard() is called, it uses getFilteredCards()
const filteredCards = app.getFilteredCards(); // Line 227 in nextCard()
console.log('- Reordered cards (from getFilteredCards):', filteredCards.map(c => c.id));

// nextCard() increments currentCardIndex
app.currentCardIndex++; // Line 229
console.log('- New currentCardIndex:', app.currentCardIndex);

// The BUG: currentCardIndex now points into the REORDERED array
console.log('- Card at filteredCards[1]:', filteredCards[app.currentCardIndex].id);
console.log('- Expected: Card 2 (id=2)');
console.log('- Actual: Card', filteredCards[app.currentCardIndex].id === 2 ? '2 ✓' : filteredCards[app.currentCardIndex].id + ' ✗');

if (filteredCards[app.currentCardIndex].id === 2) {
    console.log('✓ PASS: After first review, we\'re on card 2\n');
} else {
    console.log('✗ FAIL: After first review, we\'re on card', filteredCards[app.currentCardIndex].id, 'instead of 2\n');
}

// Continue the scenario
console.log('Step 2: Mark card 2 for review again');

// BUG DEMONSTRATION: Using sessionCards with currentCardIndex
const wrongCard = app.sessionCards[app.currentCardIndex];
console.log('- Card at sessionCards[1]:', wrongCard.id, '(WRONG - using original array)');

// What we should get
const rightCard = filteredCards[app.currentCardIndex];
console.log('- Card at filteredCards[1]:', rightCard.id, '(CORRECT - using reordered array)');

if (wrongCard.id !== rightCard.id) {
    console.log('✗ BUG CONFIRMED: markForReview uses sessionCards[currentCardIndex]');
    console.log('  but currentCardIndex is meant for the reordered array!\n');
} else {
    console.log('✓ No misalignment detected\n');
}

// Add the correct card to review queue
app.reviewQueue.push(rightCard.id);
app.sessionReviewedCards.add(rightCard.id);
app.currentCardIndex++;

const filteredCards2 = app.getFilteredCards();
console.log('- Review queue:', app.reviewQueue);
console.log('- Reordered cards:', filteredCards2.map(c => c.id));
console.log('- Current index:', app.currentCardIndex);
console.log('- Expected current card: 3');
console.log('- Actual current card:', filteredCards2[app.currentCardIndex].id);

if (filteredCards2[app.currentCardIndex].id === 3) {
    console.log('✓ PASS: Navigation is correct\n');
} else {
    console.log('✗ FAIL: Navigation is broken\n');
}

console.log('=== Summary ===');
console.log('The bug is in markForReview() line 320:');
console.log('  const currentCard = this.sessionCards[this.currentCardIndex];');
console.log('');
console.log('This uses the ORIGINAL sessionCards array, but currentCardIndex');
console.log('points into the REORDERED array from getFilteredCards().');
console.log('');
console.log('Solution: Use getFilteredCards() to get the current card:');
console.log('  const filteredCards = this.getFilteredCards();');
console.log('  const currentCard = filteredCards[this.currentCardIndex];');

process.exit(0);
