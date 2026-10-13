// Test to verify the total cards count behavior during sessions with card limits
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

// Create a minimal DOM mock that tracks element values
const mockElements = {};
const createMockElement = (id) => {
    if (!mockElements[id]) {
        mockElements[id] = {
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
                toggle: () => {},
                states: {}
            },
            disabled: false,
            addEventListener: () => {},
            click: () => {},
            focus: () => {},
            setAttribute: () => {},
            appendChild: () => {},
            removeChild: () => {}
        };
    }
    return mockElements[id];
};

global.document = {
    getElementById: (id) => createMockElement(id),
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
appJs = appJs.replace('const app = new FlashcardApp();', '');
appJs = appJs.replace('class FlashcardApp {', 'global.FlashcardApp = class FlashcardApp {');
eval(appJs);

const FlashcardApp = global.FlashcardApp;

console.log('=== Total Cards Display Test ===\n');

function clearStorage() {
    localStorage.clear();
    Object.keys(mockElements).forEach(key => delete mockElements[key]);
}

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log('✓', message);
        testsPassed++;
    } else {
        console.log('✗', message);
        testsFailed++;
    }
}

// Test: Total cards should show actual total, not session limit
console.log('Test: Total cards display with card limit');
clearStorage();
const app = new FlashcardApp();
app.cards = [
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

// Before session: should show 10 cards
app.updateUI();
const totalCardsEl = mockElements['total-cards'];
console.log('Before session, total cards:', totalCardsEl.textContent);
assert(totalCardsEl.textContent === '10', `Before session: shows 10 cards (actual: ${totalCardsEl.textContent})`);

// Set a card limit of 3 and start session
app.cardLimit = 3;
app.startSession();
console.log('After starting session with limit=3, total cards:', totalCardsEl.textContent);
console.log('Session cards length:', app.sessionCards.length);

// The issue: currently shows 3 (the limit), should show 10 (the actual total)
assert(totalCardsEl.textContent === '10', `During session: should still show 10 cards (actual: ${totalCardsEl.textContent})`);

// End session: should still show 10
app.endSession();
console.log('After ending session, total cards:', totalCardsEl.textContent);
assert(totalCardsEl.textContent === '10', `After session: shows 10 cards (actual: ${totalCardsEl.textContent})`);

console.log('\n=== Test Summary ===');
console.log('Passed:', testsPassed);
console.log('Failed:', testsFailed);

if (testsFailed === 0) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed');
    process.exit(1);
}
