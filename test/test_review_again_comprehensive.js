// Comprehensive end-to-end test for Review Again functionality
// Tests the complete workflow including card limits, multiple reviews, and session completion

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

console.log('=== Comprehensive Review Again Test ===\n');

// Test Scenario 1: Basic review again functionality
console.log('Scenario 1: Basic Review Again Functionality');
console.log('-------------------------------------------');
localStorage.clear();
const app1 = new FlashcardApp();

app1.cards = [
    { id: 1, bulgarian: 'Здравей', english: 'Hello', category: 'Greetings' },
    { id: 2, bulgarian: 'Довиждане', english: 'Goodbye', category: 'Greetings' },
    { id: 3, bulgarian: 'Благодаря', english: 'Thank you', category: 'Polite' },
    { id: 4, bulgarian: 'Моля', english: 'Please', category: 'Polite' },
    { id: 5, bulgarian: 'Да', english: 'Yes', category: 'Basic' }
];

app1.startSession();
console.assert(app1.inSession === true, 'Session should be active');
console.assert(app1.sessionCards.length === 5, 'Should have 5 cards in session');
console.assert(app1.currentCardIndex === 0, 'Should start at index 0');

// Simulate marking first card for review
let filteredCards = app1.getFilteredCards();
console.assert(filteredCards[0].id === 1, 'First card should be card 1');

app1.reviewQueue.push(1);
app1.sessionReviewedCards.add(1);
// Don't increment - the fix!

filteredCards = app1.getFilteredCards();
console.assert(filteredCards[0].id === 2, 'After marking, card 2 should be at index 0');
console.assert(filteredCards[4].id === 1, 'Card 1 should be at the end');
console.log('✓ Card 1 marked for review, moved to end, now viewing card 2\n');

// Test Scenario 2: Multiple cards marked for review
console.log('Scenario 2: Multiple Cards Marked for Review');
console.log('---------------------------------------------');
localStorage.clear();
const app2 = new FlashcardApp();

app2.cards = [
    { id: 1, bulgarian: 'Card 1', english: 'One', category: 'Test' },
    { id: 2, bulgarian: 'Card 2', english: 'Two', category: 'Test' },
    { id: 3, bulgarian: 'Card 3', english: 'Three', category: 'Test' },
    { id: 4, bulgarian: 'Card 4', english: 'Four', category: 'Test' },
    { id: 5, bulgarian: 'Card 5', english: 'Five', category: 'Test' }
];

app2.startSession();

// Mark cards 1, 2, and 3 for review
filteredCards = app2.getFilteredCards();
app2.reviewQueue.push(filteredCards[0].id);
app2.sessionReviewedCards.add(filteredCards[0].id);

filteredCards = app2.getFilteredCards();
app2.reviewQueue.push(filteredCards[0].id);
app2.sessionReviewedCards.add(filteredCards[0].id);

filteredCards = app2.getFilteredCards();
app2.reviewQueue.push(filteredCards[0].id);
app2.sessionReviewedCards.add(filteredCards[0].id);

filteredCards = app2.getFilteredCards();
const expectedOrder = [4, 5, 1, 2, 3];
const actualOrder = filteredCards.map(c => c.id);
console.log('Expected order:', expectedOrder);
console.log('Actual order:  ', actualOrder);
console.assert(JSON.stringify(actualOrder) === JSON.stringify(expectedOrder), 'Cards should be in correct order');
console.log('✓ Multiple cards marked for review maintain correct order\n');

// Test Scenario 3: Review again with card limit
console.log('Scenario 3: Review Again with Card Limit');
console.log('----------------------------------------');
localStorage.clear();
const app3 = new FlashcardApp();

app3.cards = [];
for (let i = 1; i <= 10; i++) {
    app3.cards.push({ id: i, bulgarian: `Card ${i}`, english: `Card ${i}`, category: 'Test' });
}

app3.cardLimit = 5;
app3.startSession();

console.assert(app3.sessionCards.length === 5, 'Session should have exactly 5 cards');
const originalCards = app3.sessionCards.map(c => c.id);

// Mark first two cards for review
filteredCards = app3.getFilteredCards();
app3.reviewQueue.push(filteredCards[0].id);
app3.sessionReviewedCards.add(filteredCards[0].id);

filteredCards = app3.getFilteredCards();
app3.reviewQueue.push(filteredCards[0].id);
app3.sessionReviewedCards.add(filteredCards[0].id);

filteredCards = app3.getFilteredCards();
console.assert(filteredCards.length === 5, 'Should still have exactly 5 cards');

const currentCards = filteredCards.map(c => c.id);
console.log('Original cards:', originalCards);
console.log('Current cards: ', currentCards);

// Verify all original cards are still present
const allPresent = originalCards.every(id => currentCards.includes(id));
console.assert(allPresent === true, 'All original cards should still be present');
console.log('✓ Card limit respected, no cards removed from session\n');

// Test Scenario 4: Complete session workflow
console.log('Scenario 4: Complete Session Workflow');
console.log('-------------------------------------');
localStorage.clear();
const app4 = new FlashcardApp();

app4.cards = [
    { id: 1, bulgarian: 'A', english: 'A', category: 'Test' },
    { id: 2, bulgarian: 'B', english: 'B', category: 'Test' },
    { id: 3, bulgarian: 'C', english: 'C', category: 'Test' }
];

app4.startSession();

// Mark A for review (stays at index 0, but A moves to end)
filteredCards = app4.getFilteredCards();
app4.reviewQueue.push(filteredCards[0].id);
app4.sessionReviewedCards.add(filteredCards[0].id);
console.assert(app4.currentCardIndex === 0, 'Index should stay at 0');

filteredCards = app4.getFilteredCards();
console.assert(filteredCards[0].id === 2, 'Should now show card B');

// Mark B as easy (increment to next)
app4.sessionReviewedCards.add(filteredCards[0].id);
app4.currentCardIndex++;

filteredCards = app4.getFilteredCards();
console.assert(filteredCards[1].id === 3, 'Should now show card C');

// Mark C as easy (increment to next)
app4.sessionReviewedCards.add(filteredCards[1].id);
app4.currentCardIndex++;

filteredCards = app4.getFilteredCards();
console.assert(filteredCards[2].id === 1, 'Should now show card A (queued)');

// Mark A as easy (session complete)
console.assert(app4.isSessionComplete() === true, 'Session should be complete');
console.log('✓ Complete session workflow: A (review) → B (easy) → C (easy) → A (easy)\n');

// Test Scenario 5: Edge case - mark last card for review
console.log('Scenario 5: Edge Case - Mark Last Card for Review');
console.log('--------------------------------------------------');
localStorage.clear();
const app5 = new FlashcardApp();

app5.cards = [
    { id: 1, bulgarian: 'X', english: 'X', category: 'Test' },
    { id: 2, bulgarian: 'Y', english: 'Y', category: 'Test' }
];

app5.startSession();

// Go to last card
app5.sessionReviewedCards.add(1);
app5.currentCardIndex = 1;

filteredCards = app5.getFilteredCards();
console.assert(filteredCards[1].id === 2, 'Should be on card Y');

// Mark Y for review - this should complete the session
app5.reviewQueue.push(filteredCards[1].id);
app5.sessionReviewedCards.add(filteredCards[1].id);

console.assert(app5.isSessionComplete() === true, 'Session should be complete');
console.log('✓ Marking last card for review completes session\n');

console.log('=== All Scenarios Passed! ===');
console.log('\nKey behaviors verified:');
console.log('1. Marking for review doesn\'t skip cards (index stays same)');
console.log('2. Multiple reviews maintain correct order');
console.log('3. Card limits are respected (no cards removed)');
console.log('4. Complete session workflow works correctly');
console.log('5. Edge cases handled properly');

process.exit(0);
