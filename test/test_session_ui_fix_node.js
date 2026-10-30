// Node.js test for session UI fix
// This simulates the DOM and tests the logic

// Mock DOM elements
require('./dom-mock.js');

class MockElement {
    constructor(id) {
        this.id = id;
        this.style = {};
        this.classList = {
            items: [],
            add: function(cls) { this.items.push(cls); },
            remove: function(cls) { this.items = this.items.filter(c => c !== cls); },
            toggle: function(cls, force) { 
                if (force !== undefined) {
                    if (force) this.add(cls);
                    else this.remove(cls);
                } else {
                    if (this.items.includes(cls)) this.remove(cls);
                    else this.add(cls);
                }
            },
            contains: function(cls) { return this.items.includes(cls); }
        };
        this.textContent = '';
        this.innerHTML = '';
        this.value = '';
        this.checked = false;
    }
    
    addEventListener() {}
    querySelectorAll() { return []; }
}

// Mock localStorage
const localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = value; },
    clear() { this.data = {}; }
};

// Mock document
const mockElements = {
    'total-cards': new MockElement('total-cards'),
    'reviewed-today': new MockElement('reviewed-today'),
    'no-cards-message': new MockElement('no-cards-message'),
    'card-container': new MockElement('card-container'),
    'start-session-btn': new MockElement('start-session-btn'),
    'end-session-btn': new MockElement('end-session-btn'),
    'study-options': new MockElement('study-options'),
    'category-filter': new MockElement('category-filter'),
    'category-checkboxes': new MockElement('category-checkboxes'),
    'direction-bg-en': new MockElement('direction-bg-en'),
    'direction-en-bg': new MockElement('direction-en-bg'),
    'card-front-lang': new MockElement('card-front-lang'),
    'card-back-lang': new MockElement('card-back-lang'),
    'card-front-text': new MockElement('card-front-text'),
    'card-back-text': new MockElement('card-back-text'),
    'card-position': new MockElement('card-position'),
    'flashcard': new MockElement('flashcard'),
    'cards-list': new MockElement('cards-list'),
    'card-count': new MockElement('card-count'),
    'bulgarian-input': new MockElement('bulgarian-input'),
    'english-input': new MockElement('english-input'),
    'category-input': new MockElement('category-input')
};

const document = {
    getElementById(id) { return mockElements[id] || new MockElement(id); },
    querySelectorAll() { return []; },
    addEventListener() {},
    createElement() { return new MockElement('div'); }
};

global.document = document;
global.localStorage = localStorage;
global.alert = function() {};

// Load the app code
const fs = require('fs');
const vm = require('vm');
const appCode = fs.readFileSync('../app.js', 'utf8');

// Create a context with all necessary globals
const context = {
    document: document,
    localStorage: localStorage,
    alert: function() {},
    console: console,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Set: Set,
    Array: Array,
    String: String,
    Number: Number,
    Object: Object,
    FlashcardApp: null
};

vm.createContext(context);
vm.runInContext(appCode, context);

// Get FlashcardApp from the context
const FlashcardApp = context.FlashcardApp;

// Run tests
console.log('\n=== Session UI Fix Tests ===\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✓ ${testName}`);
        testsPassed++;
    } else {
        console.log(`✗ ${testName}`);
        testsFailed++;
    }
}

// Initialize app
localStorage.clear();
const app = new FlashcardApp();

// Add test cards
app.addCard('Здравей', 'Hello', 'Greetings');
app.addCard('Хляб', 'Bread', 'Food');
app.addCard('Вода', 'Water', 'Food');

// Simulate switching to study tab
app.switchTab('study');

// Test 1: Pre-session state
assert(
    mockElements['study-options'].style.display === 'flex',
    'Test 1: Study options visible before session'
);

assert(
    mockElements['start-session-btn'].style.display === 'inline-block',
    'Test 2: Start session button visible before session'
);

assert(
    mockElements['card-container'].style.display === 'none',
    'Test 3: Card container hidden before session'
);

assert(
    mockElements['no-cards-message'].style.display === 'none',
    'Test 4: No cards message hidden when cards exist'
);

// Start session
app.startSession();

// Test 2: During session state
assert(
    app.inSession === true,
    'Test 5: Session started successfully'
);

assert(
    mockElements['study-options'].style.display === 'none',
    'Test 6: Study options hidden during session'
);

assert(
    mockElements['card-container'].style.display === 'block',
    'Test 7: Card container visible during session'
);

assert(
    mockElements['start-session-btn'].style.display === 'none',
    'Test 8: Start button hidden during session'
);

assert(
    mockElements['end-session-btn'].style.display === 'inline-block',
    'Test 9: End session button visible during session'
);

// End session
app.endSession();

// Test 3: Post-session state (back to pre-session)
assert(
    app.inSession === false,
    'Test 10: Session ended successfully'
);

assert(
    mockElements['study-options'].style.display === 'flex',
    'Test 11: Study options visible after ending session'
);

assert(
    mockElements['card-container'].style.display === 'none',
    'Test 12: Card container hidden after ending session'
);

assert(
    mockElements['start-session-btn'].style.display === 'inline-block',
    'Test 13: Start button visible after ending session'
);

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✓ ALL TESTS PASSED\n');
    process.exit(0);
} else {
    console.log('\n✗ SOME TESTS FAILED\n');
    process.exit(1);
}
