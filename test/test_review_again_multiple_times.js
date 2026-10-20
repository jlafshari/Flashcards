// Test for review again button allowing multiple reviews of the same card
// User scenario: Mark a card for review, see it again, mark for review again
// Expected: Should be able to review the same card multiple times
// Bug: Second "review again" press is ignored

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

console.log('=== Review Again Multiple Times Test ===\n');

// Test Scenario: Card1 Review → Card2 Easy → Card1 appears again → Card1 Review again
console.log('Scenario: Card1 Review → Card2 Easy → Card1 (again) → Card1 Review again');
console.log('------------------------------------------------------------------------');
localStorage.clear();
const app = new FlashcardApp();

app.cards = [
    { id: 1, bulgarian: 'Card 1', english: 'One', category: 'Test' },
    { id: 2, bulgarian: 'Card 2', english: 'Two', category: 'Test' }
];

app.startSession();
console.log('Session started with 2 cards');
console.log(`Current index: ${app.currentCardIndex}, viewing card ${app.getFilteredCards()[app.currentCardIndex].id}`);

// Card 1: Mark for review (first time)
let filteredCards = app.getFilteredCards();
console.log(`\nCard 1 - marking for review (FIRST TIME)`);
console.log(`  Before: Review queue: [${app.reviewQueue}]`);
console.log(`  Card 1 in queue? ${app.reviewQueue.includes(1)}`);

app.reviewQueue.push(filteredCards[0].id); // Add card 1 to queue
app.sessionReviewedCards.add(filteredCards[0].id);
console.log(`  After: Review queue: [${app.reviewQueue}]`);

filteredCards = app.getFilteredCards();
console.log(`  Filtered cards order: [${filteredCards.map(c => c.id)}]`);
console.log(`  Current index: ${app.currentCardIndex}, viewing card ${filteredCards[app.currentCardIndex].id}`);

// Card 2: Mark as easy
console.log(`\nCard 2 - marking as easy`);
app.sessionReviewedCards.add(filteredCards[app.currentCardIndex].id);
app.currentCardIndex++;
filteredCards = app.getFilteredCards();
console.log(`  Current index: ${app.currentCardIndex}, viewing card ${filteredCards[app.currentCardIndex].id}`);
console.log(`  Review queue: [${app.reviewQueue}]`);

// Now we're back at Card 1 (from review queue)
console.log(`\n--- Card 1 appears again from review queue ---`);
console.log(`  Current card: ${filteredCards[app.currentCardIndex].id}`);
console.log(`  Review queue before second review: [${app.reviewQueue}]`);
console.log(`  Card 1 in queue? ${app.reviewQueue.includes(1)}`);

// Try to mark Card 1 for review AGAIN (second time)
console.log(`\nCard 1 - attempting to mark for review (SECOND TIME)`);
const currentCard = filteredCards[app.currentCardIndex];
const isInQueue = app.reviewQueue.includes(currentCard.id);
console.log(`  Check: currentCard.id = ${currentCard.id}`);
console.log(`  Check: !reviewQueue.includes(currentCard.id) = ${!isInQueue}`);

if (!isInQueue) {
    console.log('  ✓ Card would be added to review queue again');
    app.reviewQueue.push(currentCard.id);
} else {
    console.log('  ❌ BUG: Card is already in queue, so it would NOT be added again');
    console.log('     The condition on line 324 prevents adding it again');
    console.log('     Instead, nextCard() would be called, moving past this card');
}

console.log(`  Review queue after: [${app.reviewQueue}]`);

console.log('\n=== Test Complete ===');
console.log('\nBug identified:');
console.log('  Line 324: if (currentCard && !this.reviewQueue.includes(currentCard.id))');
console.log('  This prevents a card from being added to the review queue multiple times');
console.log('\nExpected behavior:');
console.log('  User should be able to press "Review Again" on the same card multiple times');
console.log('  Each time should add another instance to review later');
console.log('\nCurrent behavior:');
console.log('  Second press of "Review Again" is ignored (else branch calls nextCard())');

process.exit(0);
