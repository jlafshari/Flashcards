// Debug test to understand card ordering with duplicate IDs in queue

// Minimal localStorage mock for Node.js
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = String(value); },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};

// Mock alert
global.alert = () => {};

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

console.log('=== Debug: Card Ordering with Duplicate Queue IDs ===\n');

localStorage.clear();
const app = new FlashcardApp();

app.cards = [
    { id: 1, bulgarian: 'Card 1', english: 'One', category: 'Test' },
    { id: 2, bulgarian: 'Card 2', english: 'Two', category: 'Test' },
    { id: 3, bulgarian: 'Card 3', english: 'Three', category: 'Test' }
];

app.startSession();
console.log('Initial state:');
console.log(`  sessionCards: [${app.sessionCards.map(c => c.id)}]`);
console.log(`  reviewQueue: [${app.reviewQueue}]`);

// Simulate: Card 1 Review, Card 2 Review
app.reviewQueue = [1, 2];
console.log('\nAfter Card1 Review, Card2 Review:');
console.log(`  reviewQueue: [${app.reviewQueue}]`);
let filtered = app.getFilteredCards();
console.log(`  getFilteredCards: [${filtered.map(c => c.id)}]`);
console.log('  Expected: [3, 1, 2] (non-queued first, then queued in order)');

// Simulate: Card 1 Review again (now queue is [1, 2, 1])
app.reviewQueue = [1, 2, 1];
console.log('\nAfter Card1 Review AGAIN (duplicate):');
console.log(`  reviewQueue: [${app.reviewQueue}]`);
filtered = app.getFilteredCards();
console.log(`  getFilteredCards: [${filtered.map(c => c.id)}]`);
console.log('  Expected: [3, 1, 2, 1] (non-queued first, then each queued entry in order)');
console.log('  Problem: getFilteredCards uses a Set, so it deduplicates card IDs!');

console.log('\n=== Analysis ===');
console.log('The issue is in getFilteredCards() at line 425:');
console.log('  const queuedCardIds = new Set(this.reviewQueue);');
console.log('');
console.log('This converts the array to a Set, which removes duplicates:');
console.log('  [1, 2, 1] becomes Set {1, 2}');
console.log('');
console.log('Then it groups sessionCards into queued vs non-queued based on Set membership:');
console.log('  - If card.id is in the Set, add to queuedCards ONCE');
console.log('  - Otherwise add to nonQueuedCards');
console.log('');
console.log('Result: Card 1 appears only once in the final array, not twice!');
console.log('');
console.log('Solution: Iterate through reviewQueue to build queuedCards,');
console.log('          adding each occurrence of a card as it appears in the queue.');

process.exit(0);
