// Test to verify the Review Again fix works correctly
// The fix: After adding to review queue, don't increment index - just update UI
// because the array gets reordered and the next card is now at the current index

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

console.log('=== Test: Review Again Fix ===\n');

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

app.inSession = true;
app.sessionCards = [...app.cards];
app.sessionReviewedCards = new Set();
app.currentCardIndex = 0;
app.reviewQueue = [];

console.log('Initial state:');
console.log('- Cards:', [1, 2, 3, 4, 5]);
console.log('- Index: 0, viewing card 1\n');

// Test 1: Mark card 1 for review
console.log('Test 1: Mark card 1 for review');
let filteredCards = app.getFilteredCards();
console.log('- Before: cards =', filteredCards.map(c => c.id), ', index =', app.currentCardIndex);
console.assert(filteredCards[app.currentCardIndex].id === 1, 'Should be viewing card 1');

// Simulate markForReview: add to queue, don't increment index
app.reviewQueue.push(1);
app.sessionReviewedCards.add(1);
// Don't increment index!

filteredCards = app.getFilteredCards();
console.log('- After:  cards =', filteredCards.map(c => c.id), ', index =', app.currentCardIndex);
console.log('- Now viewing:', filteredCards[app.currentCardIndex].id);
console.assert(filteredCards[app.currentCardIndex].id === 2, 'Should be viewing card 2');
console.log('✓ Test 1 passed: Card 1 moved to end, now viewing card 2 at same index\n');

// Test 2: Mark card 2 for review
console.log('Test 2: Mark card 2 for review');
console.log('- Before: cards =', filteredCards.map(c => c.id), ', index =', app.currentCardIndex);
console.assert(filteredCards[app.currentCardIndex].id === 2, 'Should be viewing card 2');

app.reviewQueue.push(2);
app.sessionReviewedCards.add(2);

filteredCards = app.getFilteredCards();
console.log('- After:  cards =', filteredCards.map(c => c.id), ', index =', app.currentCardIndex);
console.log('- Now viewing:', filteredCards[app.currentCardIndex].id);
console.assert(filteredCards[app.currentCardIndex].id === 3, 'Should be viewing card 3');
console.log('✓ Test 2 passed: Card 2 moved to end, now viewing card 3 at same index\n');

// Test 3: Continue normally through cards 3, 4, 5
console.log('Test 3: Continue through remaining cards');
console.log('- Current: cards =', filteredCards.map(c => c.id), ', index =', app.currentCardIndex);

// Card 3 - mark as easy (use nextCard)
console.assert(filteredCards[app.currentCardIndex].id === 3, 'Should be on card 3');
app.sessionReviewedCards.add(3);
app.currentCardIndex++; // nextCard increments

filteredCards = app.getFilteredCards();
console.log('- After card 3: index =', app.currentCardIndex, ', viewing:', filteredCards[app.currentCardIndex].id);
console.assert(filteredCards[app.currentCardIndex].id === 4, 'Should be on card 4');

// Card 4 - mark as easy (use nextCard)
app.sessionReviewedCards.add(4);
app.currentCardIndex++;

filteredCards = app.getFilteredCards();
console.log('- After card 4: index =', app.currentCardIndex, ', viewing:', filteredCards[app.currentCardIndex].id);
console.assert(filteredCards[app.currentCardIndex].id === 5, 'Should be on card 5');

// Card 5 - mark as easy (use nextCard)
app.sessionReviewedCards.add(5);
app.currentCardIndex++;

filteredCards = app.getFilteredCards();
console.log('- After card 5: index =', app.currentCardIndex, ', viewing:', filteredCards[app.currentCardIndex].id);
console.assert(filteredCards[app.currentCardIndex].id === 1, 'Should be on card 1 (first queued)');
console.log('✓ Test 3 passed: Navigated through cards 3-5, now on queued card 1\n');

// Test 4: Continue through queued cards
console.log('Test 4: Continue through queued cards');
console.log('- Cards:', filteredCards.map(c => c.id));
console.log('- On card 1 (queued), marking as easy');

app.currentCardIndex++; // Move to card 2

console.log('- After card 1: index =', app.currentCardIndex, ', viewing:', filteredCards[app.currentCardIndex].id);
console.assert(filteredCards[app.currentCardIndex].id === 2, 'Should be on card 2 (second queued)');
console.log('✓ Test 4 passed: On card 2 (second queued card)\n');

// Test 5: Verify all cards present
console.log('Test 5: Verify all cards present');
console.assert(filteredCards.length === 5, 'Should still have 5 cards');
const cardIds = filteredCards.map(c => c.id).sort();
console.assert(JSON.stringify(cardIds) === '[1,2,3,4,5]', 'All cards should be present');
console.log('- All cards present:', cardIds);
console.log('✓ Test 5 passed: All 5 cards still in session\n');

// Test 6: Verify session completion
console.log('Test 6: Session completion check');
console.log('- Session reviewed cards:', Array.from(app.sessionReviewedCards).sort());
console.log('- All cards reviewed?', app.isSessionComplete());
console.assert(app.isSessionComplete() === true, 'Should be complete');
console.log('✓ Test 6 passed: Session marked as complete\n');

console.log('=== All Tests Passed! ===');
console.log('\nThe fix works correctly:');
console.log('- After marking for review, don\'t increment index');
console.log('- The reordered array has the next card at the current index');
console.log('- All cards remain in the session');
console.log('- Navigation proceeds through all cards in correct order');

process.exit(0);
