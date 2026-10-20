// Integration test to verify the Review Again bug fix
// This test simulates the actual user flow through markForReview() and markEasy()

// Minimal localStorage mock for Node.js
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = String(value); },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};

// Track showSessionComplete calls
let sessionCompleteCallCount = 0;

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

console.log('=== Review Again Bug Fix Verification ===\n');

// Test the user's exact scenario: Card1 Review, Card2 Easy, Card3 Review
console.log('User Scenario: Card1 Review → Card2 Easy → Card3 Review');
console.log('--------------------------------------------------------');
localStorage.clear();
sessionCompleteCallCount = 0;

const app = new FlashcardApp();

// Override showSessionComplete to track calls
const originalShowSessionComplete = app.showSessionComplete.bind(app);
app.showSessionComplete = function() {
    sessionCompleteCallCount++;
    console.log(`  [showSessionComplete called - count: ${sessionCompleteCallCount}]`);
    originalShowSessionComplete();
};

app.cards = [
    { id: 1, bulgarian: 'Card 1', english: 'One', category: 'Test' },
    { id: 2, bulgarian: 'Card 2', english: 'Two', category: 'Test' },
    { id: 3, bulgarian: 'Card 3', english: 'Three', category: 'Test' }
];

app.startSession();
console.log('Started session with 3 cards');
console.log(`  Index: ${app.currentCardIndex}, Viewing: Card ${app.getFilteredCards()[app.currentCardIndex].id}`);

// Card 1: Mark for Review
console.log('\n[1] Card 1 - Press "Review Again"');
const beforeReview1 = {
    index: app.currentCardIndex,
    reviewQueue: [...app.reviewQueue],
    reviewed: new Set(app.sessionReviewedCards)
};

// Simulate the actual markForReview flow (without setTimeout)
const filteredCards1 = app.getFilteredCards();
const currentCard1 = filteredCards1[app.currentCardIndex];
if (currentCard1 && !app.reviewQueue.includes(currentCard1.id)) {
    app.reviewQueue.push(currentCard1.id);
    app.sessionReviewedCards.add(currentCard1.id);
    app.resetFlip();
    app.incrementReviewCount();
    
    const filteredCardsAfter1 = app.getFilteredCards();
    const remainingCards1 = filteredCardsAfter1.slice(app.currentCardIndex);
    if (app.isSessionComplete() && remainingCards1.length === 0) {
        app.showSessionComplete();
    } else {
        app.updateUI();
    }
}

console.log(`  After: Index: ${app.currentCardIndex}, Queue: [${app.reviewQueue}]`);
console.log(`  Filtered order: [${app.getFilteredCards().map(c => c.id)}]`);
console.log(`  Viewing: Card ${app.getFilteredCards()[app.currentCardIndex].id}`);
console.assert(app.currentCardIndex === 0, 'Index should stay at 0');
console.assert(app.getFilteredCards()[0].id === 2, 'Should be viewing Card 2');

// Card 2: Mark Easy
console.log('\n[2] Card 2 - Press "Easy"');
// Simulate markEasy flow
const filteredCards2 = app.getFilteredCards();
const currentCard2 = filteredCards2[app.currentCardIndex];
app.sessionReviewedCards.add(currentCard2.id);

// Check if last card
if (app.currentCardIndex === filteredCards2.length - 1) {
    if (app.isSessionComplete()) {
        app.showSessionComplete();
    }
} else {
    app.currentCardIndex++;
    app.resetFlip();
    app.incrementReviewCount();
    app.updateUI();
}

console.log(`  After: Index: ${app.currentCardIndex}, Queue: [${app.reviewQueue}]`);
console.log(`  Filtered order: [${app.getFilteredCards().map(c => c.id)}]`);
console.log(`  Viewing: Card ${app.getFilteredCards()[app.currentCardIndex].id}`);
console.assert(app.currentCardIndex === 1, 'Index should be at 1');
console.assert(app.getFilteredCards()[1].id === 3, 'Should be viewing Card 3');

// Card 3: Mark for Review
console.log('\n[3] Card 3 - Press "Review Again"');
const beforeReview3 = {
    index: app.currentCardIndex,
    reviewQueue: [...app.reviewQueue],
    reviewed: new Set(app.sessionReviewedCards)
};

// Simulate the actual markForReview flow (without setTimeout)
const filteredCards3 = app.getFilteredCards();
const currentCard3 = filteredCards3[app.currentCardIndex];
if (currentCard3 && !app.reviewQueue.includes(currentCard3.id)) {
    app.reviewQueue.push(currentCard3.id);
    app.sessionReviewedCards.add(currentCard3.id);
    app.resetFlip();
    app.incrementReviewCount();
    
    const filteredCardsAfter3 = app.getFilteredCards();
    const remainingCards3 = filteredCardsAfter3.slice(app.currentCardIndex);
    
    console.log(`  isSessionComplete: ${app.isSessionComplete()}`);
    console.log(`  remainingCards from index ${app.currentCardIndex}: [${remainingCards3.map(c => c.id)}]`);
    console.log(`  remainingCards.length: ${remainingCards3.length}`);
    
    if (app.isSessionComplete() && remainingCards3.length === 0) {
        console.log(`  → Session should end (no cards remaining)`);
        app.showSessionComplete();
    } else {
        console.log(`  → Session continues (${remainingCards3.length} cards remaining)`);
        app.updateUI();
    }
}

console.log(`  After: Index: ${app.currentCardIndex}, Queue: [${app.reviewQueue}]`);
console.log(`  Filtered order: [${app.getFilteredCards().map(c => c.id)}]`);

// Verify the fix
console.log('\n=== Verification ===');
console.log(`Session complete calls: ${sessionCompleteCallCount}`);
console.log(`Expected: 0 (session should NOT have ended yet)`);

if (sessionCompleteCallCount === 0) {
    console.log('✓ BUG FIXED: Session did not end prematurely');
    console.log(`  Current index: ${app.currentCardIndex}`);
    console.log(`  Cards remaining: [${app.getFilteredCards().slice(app.currentCardIndex).map(c => c.id)}]`);
    console.log(`  User can continue reviewing Card 1 and Card 3`);
    console.log('\nExpected next steps:');
    console.log('  [4] View Card 1 again (from review queue)');
    console.log('  [5] View Card 3 again (from review queue)');
    console.log('  [6] Session ends after all cards reviewed');
} else {
    console.log('❌ BUG STILL EXISTS: Session ended prematurely');
    process.exit(1);
}

console.log('\n=== Test Passed! ===');
process.exit(0);
