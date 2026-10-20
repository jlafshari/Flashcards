// Test for specific bug: Review Again button ending session prematurely
// User scenario: 3 cards - Card1 Review, Card2 Easy, Card3 Review
// Expected: Should see Cards 1 and 3 again
// Bug: Session ends after Card3 is marked for review

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

console.log('=== Review Again Bug Test ===\n');

// Test Scenario A: Card1 Review, Card2 Easy, Card3 Easy (SHOULD WORK)
console.log('Scenario A: Card1 Review → Card2 Easy → Card3 Easy');
console.log('----------------------------------------------------');
localStorage.clear();
const appA = new FlashcardApp();

appA.cards = [
    { id: 1, bulgarian: 'Card 1', english: 'One', category: 'Test' },
    { id: 2, bulgarian: 'Card 2', english: 'Two', category: 'Test' },
    { id: 3, bulgarian: 'Card 3', english: 'Three', category: 'Test' }
];

appA.startSession();
console.log('Session started with 3 cards');
console.log(`Current index: ${appA.currentCardIndex}, viewing card ${appA.getFilteredCards()[appA.currentCardIndex].id}`);

// Card 1: Mark for review
let filteredCards = appA.getFilteredCards();
console.log(`\nCard 1 - marking for review`);
appA.reviewQueue.push(filteredCards[0].id); // Add card 1 to queue
appA.sessionReviewedCards.add(filteredCards[0].id);
// Don't increment - stay at index 0
console.log(`  Review queue: [${appA.reviewQueue}]`);
console.log(`  Session reviewed: [${Array.from(appA.sessionReviewedCards)}]`);

filteredCards = appA.getFilteredCards();
console.log(`  Current index: ${appA.currentCardIndex}, viewing card ${filteredCards[appA.currentCardIndex].id}`);
console.log(`  Filtered cards order: [${filteredCards.map(c => c.id)}]`);

// Card 2: Mark as easy
console.log(`\nCard 2 - marking as easy`);
appA.sessionReviewedCards.add(filteredCards[appA.currentCardIndex].id);
appA.currentCardIndex++; // Increment to next card
console.log(`  Session reviewed: [${Array.from(appA.sessionReviewedCards)}]`);
console.log(`  Current index: ${appA.currentCardIndex}, viewing card ${appA.getFilteredCards()[appA.currentCardIndex].id}`);

// Card 3: Mark as easy
console.log(`\nCard 3 - marking as easy`);
filteredCards = appA.getFilteredCards();
appA.sessionReviewedCards.add(filteredCards[appA.currentCardIndex].id);
console.log(`  Session reviewed: [${Array.from(appA.sessionReviewedCards)}]`);
console.log(`  isSessionComplete: ${appA.isSessionComplete()}`);

// Should continue to next card (Card 1 from review queue)
appA.currentCardIndex++;
filteredCards = appA.getFilteredCards();
console.log(`  Current index: ${appA.currentCardIndex}, viewing card ${filteredCards[appA.currentCardIndex].id}`);

console.assert(appA.currentCardIndex === 2, 'Should be at index 2');
console.assert(filteredCards[2].id === 1, 'Should be viewing card 1 from review queue');
console.log('✓ Scenario A works correctly - Card 1 shown again\n');

// Test Scenario B: Card1 Review, Card2 Easy, Card3 Review (BUG)
console.log('Scenario B: Card1 Review → Card2 Easy → Card3 Review (THE BUG)');
console.log('----------------------------------------------------------------');
localStorage.clear();
const appB = new FlashcardApp();

appB.cards = [
    { id: 1, bulgarian: 'Card 1', english: 'One', category: 'Test' },
    { id: 2, bulgarian: 'Card 2', english: 'Two', category: 'Test' },
    { id: 3, bulgarian: 'Card 3', english: 'Three', category: 'Test' }
];

appB.startSession();
console.log('Session started with 3 cards');
console.log(`Current index: ${appB.currentCardIndex}, viewing card ${appB.getFilteredCards()[appB.currentCardIndex].id}`);

// Card 1: Mark for review
filteredCards = appB.getFilteredCards();
console.log(`\nCard 1 - marking for review`);
appB.reviewQueue.push(filteredCards[0].id); // Add card 1 to queue
appB.sessionReviewedCards.add(filteredCards[0].id);
// Don't increment - stay at index 0
console.log(`  Review queue: [${appB.reviewQueue}]`);
console.log(`  Session reviewed: [${Array.from(appB.sessionReviewedCards)}]`);

filteredCards = appB.getFilteredCards();
console.log(`  Current index: ${appB.currentCardIndex}, viewing card ${filteredCards[appB.currentCardIndex].id}`);
console.log(`  Filtered cards order: [${filteredCards.map(c => c.id)}]`);

// Card 2: Mark as easy
console.log(`\nCard 2 - marking as easy`);
appB.sessionReviewedCards.add(filteredCards[appB.currentCardIndex].id);
appB.currentCardIndex++; // Increment to next card
console.log(`  Session reviewed: [${Array.from(appB.sessionReviewedCards)}]`);
console.log(`  Current index: ${appB.currentCardIndex}, viewing card ${appB.getFilteredCards()[appB.currentCardIndex].id}`);

// Card 3: Mark for review
console.log(`\nCard 3 - marking for review`);
filteredCards = appB.getFilteredCards();
appB.reviewQueue.push(filteredCards[appB.currentCardIndex].id); // Add card 3 to queue
appB.sessionReviewedCards.add(filteredCards[appB.currentCardIndex].id);
// Don't increment - stay at index 1
console.log(`  Review queue: [${appB.reviewQueue}]`);
console.log(`  Session reviewed: [${Array.from(appB.sessionReviewedCards)}]`);
console.log(`  isSessionComplete: ${appB.isSessionComplete()}`);

filteredCards = appB.getFilteredCards();
console.log(`  Current index: ${appB.currentCardIndex}`);
console.log(`  Filtered cards order: [${filteredCards.map(c => c.id)}]`);
console.log(`  filteredCards.length: ${filteredCards.length}`);

// Check the buggy condition from line 339
const buggyCondition = appB.isSessionComplete() && appB.currentCardIndex < filteredCards.length - 1;
console.log(`  Buggy condition (isSessionComplete && index < length-1): ${buggyCondition}`);
console.log(`    isSessionComplete: ${appB.isSessionComplete()}`);
console.log(`    currentCardIndex (${appB.currentCardIndex}) < filteredCards.length - 1 (${filteredCards.length - 1}): ${appB.currentCardIndex < filteredCards.length - 1}`);

if (buggyCondition) {
    console.log('  ❌ BUG TRIGGERED: Session would end here!');
    console.log('     But there are still cards to review: Card 1 and Card 3 in review queue');
} else {
    console.log('  ✓ Bug is fixed - session continues');
}

// Check the proposed fix
const remainingCards = filteredCards.slice(appB.currentCardIndex);
const fixedCondition = appB.isSessionComplete() && remainingCards.length === 0;
console.log(`\n  Fixed condition (isSessionComplete && remainingCards.length === 0): ${fixedCondition}`);
console.log(`    remainingCards from current index: [${remainingCards.map(c => c.id)}]`);
console.log(`    remainingCards.length: ${remainingCards.length}`);

if (!fixedCondition) {
    console.log('  ✓ With fix: Session should continue - there are cards remaining');
    console.log(`     Cards left to show: [${remainingCards.map(c => c.id)}]`);
}

console.log('\n=== Test Complete ===');
console.log('\nSummary:');
console.log('- Scenario A (Review→Easy→Easy): Works correctly');
console.log('- Scenario B (Review→Easy→Review): Bug exists');
console.log('\nBug condition: isSessionComplete() && currentCardIndex < filteredCards.length - 1');
console.log('  This ends the session when there are still cards ahead in the review queue');
console.log('\nFix: Check remainingCards.slice(currentCardIndex).length === 0 instead');
console.log('  This only ends the session when there are NO cards remaining to show');

process.exit(0);
