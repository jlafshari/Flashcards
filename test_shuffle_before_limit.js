// Test shuffle before limit functionality
const fs = require('fs');

// Minimal localStorage mock
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = String(value); },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};

global.alert = () => {}; // Mock alert

// Create a minimal DOM mock
const createMockElement = () => ({
    textContent: '', 
    style: {},
    value: '',
    innerHTML: '',
    dataset: {},
    files: [],
    checked: false,
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
    removeChild: () => {}
});

global.document = {
    getElementById: () => createMockElement(),
    querySelectorAll: () => [],
    querySelector: () => ({ id: 'study-tab' }),
    createElement: () => createMockElement(),
    body: createMockElement(),
    addEventListener: () => {}
};

global.confirm = () => true;
global.FileReader = class {
    readAsText() {}
};
global.Blob = class {};
global.URL = { createObjectURL: () => '' };

// Load the app
let appJs = fs.readFileSync('./app.js', 'utf8');
// Remove the auto-initialization at the end
appJs = appJs.replace('const app = new FlashcardApp();', '');
// Make FlashcardApp global
appJs = appJs.replace('class FlashcardApp {', 'global.FlashcardApp = class FlashcardApp {');
eval(appJs);

const FlashcardApp = global.FlashcardApp;

console.log('=== Shuffle Before Limit Tests ===\n');

function clearStorage() {
    localStorage.clear();
}

function assertEquals(actual, expected, message) {
    if (actual === expected) {
        console.log('✓', message);
        return true;
    } else {
        console.log('✗', message);
        console.log(`  Expected: ${expected}`);
        console.log(`  Actual: ${actual}`);
        return false;
    }
}

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Without shuffle, same cards are selected each time
console.log('Test 1: Without shuffle, same first N cards selected each time');
clearStorage();
const app1a = new FlashcardApp();
app1a.cards = [
    { id: 1, bulgarian: 'а', english: 'a', category: '' },
    { id: 2, bulgarian: 'б', english: 'b', category: '' },
    { id: 3, bulgarian: 'в', english: 'c', category: '' },
    { id: 4, bulgarian: 'г', english: 'd', category: '' },
    { id: 5, bulgarian: 'д', english: 'e', category: '' }
];
app1a.cardLimit = 2;
app1a.shuffleEnabled = false;
app1a.startSession();
const firstRun = app1a.sessionCards.map(c => c.id).join(',');

app1a.endSession();
app1a.startSession();
const secondRun = app1a.sessionCards.map(c => c.id).join(',');

if (assertEquals(firstRun, secondRun, 'Without shuffle, same cards selected')) {
    testsPassed++;
} else {
    testsFailed++;
}
if (assertEquals(firstRun, '1,2', 'Without shuffle, first 2 cards are IDs 1,2')) {
    testsPassed++;
} else {
    testsFailed++;
}

// Test 2: With shuffle enabled, different cards can be selected
console.log('\nTest 2: With shuffle enabled, cards are shuffled before limiting');
clearStorage();
const app2 = new FlashcardApp();
app2.cards = [
    { id: 1, bulgarian: 'а', english: 'a', category: '' },
    { id: 2, bulgarian: 'б', english: 'b', category: '' },
    { id: 3, bulgarian: 'в', english: 'c', category: '' },
    { id: 4, bulgarian: 'г', english: 'd', category: '' },
    { id: 5, bulgarian: 'д', english: 'e', category: '' },
    { id: 6, bulgarian: 'е', english: 'f', category: '' },
    { id: 7, bulgarian: 'ж', english: 'g', category: '' },
    { id: 8, bulgarian: 'з', english: 'h', category: '' },
    { id: 9, bulgarian: 'и', english: 'i', category: '' },
    { id: 10, bulgarian: 'й', english: 'j', category: '' }
];
app2.cardLimit = 3;
app2.shuffleEnabled = true;

// Run multiple sessions and collect which cards were selected
const selectedCards = new Set();
for (let i = 0; i < 20; i++) {
    app2.endSession();
    app2.startSession();
    app2.sessionCards.forEach(card => selectedCards.add(card.id));
}

// With shuffle before limit, we should eventually see more than just the first 3 cards
const uniqueCardsCount = selectedCards.size;
if (uniqueCardsCount > 3) {
    console.log('✓ With shuffle, saw', uniqueCardsCount, 'different cards across 20 sessions (more than the limit of 3)');
    testsPassed++;
} else {
    console.log('✗ With shuffle, only saw', uniqueCardsCount, 'different cards (should see more than 3)');
    testsFailed++;
}

// Test 3: Card limit is still respected (always returns exactly N cards)
console.log('\nTest 3: Card limit is still respected with shuffle');
clearStorage();
const app3 = new FlashcardApp();
app3.cards = [
    { id: 1, bulgarian: 'а', english: 'a', category: '' },
    { id: 2, bulgarian: 'б', english: 'b', category: '' },
    { id: 3, bulgarian: 'в', english: 'c', category: '' },
    { id: 4, bulgarian: 'г', english: 'd', category: '' },
    { id: 5, bulgarian: 'д', english: 'e', category: '' }
];
app3.cardLimit = 2;
app3.shuffleEnabled = true;

let allSessionsHaveTwoCards = true;
for (let i = 0; i < 10; i++) {
    app3.endSession();
    app3.startSession();
    if (app3.sessionCards.length !== 2) {
        allSessionsHaveTwoCards = false;
        break;
    }
}

if (assertEquals(allSessionsHaveTwoCards, true, 'All sessions have exactly 2 cards')) {
    testsPassed++;
} else {
    testsFailed++;
}

// Test 4: Without card limit, shuffle still works on all cards
console.log('\nTest 4: Without card limit, shuffle applies to all cards');
clearStorage();
const app4 = new FlashcardApp();
app4.cards = [
    { id: 1, bulgarian: 'а', english: 'a', category: '' },
    { id: 2, bulgarian: 'б', english: 'b', category: '' },
    { id: 3, bulgarian: 'в', english: 'c', category: '' }
];
app4.cardLimit = null;
app4.shuffleEnabled = true;
app4.startSession();

if (assertEquals(app4.sessionCards.length, 3, 'All 3 cards included when no limit')) {
    testsPassed++;
} else {
    testsFailed++;
}

// Verify all card IDs are present
const cardIds = app4.sessionCards.map(c => c.id).sort();
const expectedIds = [1, 2, 3];
if (assertEquals(cardIds.join(','), expectedIds.join(','), 'All card IDs present')) {
    testsPassed++;
} else {
    testsFailed++;
}

console.log('\n=== Test Summary ===');
console.log('Passed:', testsPassed);
console.log('Failed:', testsFailed);
console.log('Total:', testsPassed + testsFailed);

if (testsFailed === 0) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed');
    process.exit(1);
}
