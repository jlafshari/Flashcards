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
            removeChild: () => {},
            querySelectorAll: () => []
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
        return true;
    } else {
        console.log('✗', message);
        testsFailed++;
        return false;
    }
}

// Test 1: Total cards should always show filtered count, not session limit
console.log('Test 1: Total cards display with card limit');
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
assert(totalCardsEl.textContent == '10', `Before session: shows 10 cards (actual: ${totalCardsEl.textContent})`);

// Set a card limit of 3 and start session
app.cardLimit = 3;
app.startSession();
assert(totalCardsEl.textContent == '10', `During session with limit=3: still shows 10 cards (actual: ${totalCardsEl.textContent})`);
assert(app.sessionCards.length === 3, `Session has 3 cards as per limit (actual: ${app.sessionCards.length})`);

// End session: should still show 10
app.endSession();
assert(totalCardsEl.textContent == '10', `After session: shows 10 cards (actual: ${totalCardsEl.textContent})`);

console.log('');

// Test 2: Total cards should reflect category filtering
console.log('Test 2: Total cards display with category filter and card limit');
clearStorage();
const app2 = new FlashcardApp();
app2.cards = [
    { id: 1, bulgarian: 'Здравей', english: 'Hello', category: 'Greetings' },
    { id: 2, bulgarian: 'Довиждане', english: 'Goodbye', category: 'Greetings' },
    { id: 3, bulgarian: 'Хляб', english: 'Bread', category: 'Food' },
    { id: 4, bulgarian: 'Вода', english: 'Water', category: 'Food' },
    { id: 5, bulgarian: 'Млеко', english: 'Milk', category: 'Food' },
    { id: 6, bulgarian: 'Сирене', english: 'Cheese', category: 'Food' }
];

// Filter by Food category (4 cards) and set limit to 2
app2.activeCategories = ['Food'];
app2.cardLimit = 2;
app2.updateUI();
const totalCardsEl2 = mockElements['total-cards'];
assert(totalCardsEl2.textContent == '4', `Before session with Food filter: shows 4 cards (actual: ${totalCardsEl2.textContent})`);

// Start session
app2.startSession();
assert(totalCardsEl2.textContent == '4', `During session: still shows 4 filtered cards (actual: ${totalCardsEl2.textContent})`);
assert(app2.sessionCards.length === 2, `Session has 2 cards as per limit (actual: ${app2.sessionCards.length})`);

console.log('');

console.log('=== Test Summary ===');
console.log('Passed:', testsPassed);
console.log('Failed:', testsFailed);

if (testsFailed === 0) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed');
    process.exit(1);
}
