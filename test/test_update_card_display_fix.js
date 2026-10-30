// Test for updateCardDisplay using getFilteredCards during sessions
require('./dom-mock.js');

console.log('Testing updateCardDisplay Review Queue Fix\n');
console.log('===========================================\n');

let testsRun = 0;
let testsPassed = 0;

function test(description, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✓ ${description}`);
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
        console.log(`  Stack: ${error.stack}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
}

// Mock DOM elements
class MockElement {
    constructor(id) {
        this.id = id;
        this.style = { display: 'inline-block' };
        this.disabled = false;
        this.textContent = '';
        this.value = '';
        this.dataset = {};
        this.classList = {
            classes: [],
            add: function(cls) { 
                if (!this.classes.includes(cls)) this.classes.push(cls); 
            },
            remove: function(cls) { 
                this.classes = this.classes.filter(c => c !== cls); 
            },
            toggle: function(cls, force) {
                if (force === undefined) force = !this.classes.includes(cls);
                if (force) this.add(cls);
                else this.remove(cls);
            },
            contains: function(cls) {
                return this.classes.includes(cls);
            }
        };
    }
    
    addEventListener(event, handler) {
        if (!this.eventListeners) this.eventListeners = {};
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(handler);
    }
    
    focus() {}
}

// Create mock DOM
const mockDOM = {
    'study-tab': new MockElement('study-tab'),
    'manage-tab': new MockElement('manage-tab'),
    'flashcard': new MockElement('flashcard'),
    'next-btn': new MockElement('next-btn'),
    'prev-btn': new MockElement('prev-btn'),
    'flip-btn': new MockElement('flip-btn'),
    'easy-btn': new MockElement('easy-btn'),
    'review-btn': new MockElement('review-btn'),
    'card-front-text': new MockElement('card-front-text'),
    'card-back-text': new MockElement('card-back-text'),
    'card-front-lang': new MockElement('card-front-lang'),
    'card-back-lang': new MockElement('card-back-lang'),
    'card-position': new MockElement('card-position'),
    'total-cards': new MockElement('total-cards'),
    'reviewed-today': new MockElement('reviewed-today'),
    'card-count': new MockElement('card-count'),
    'cards-list': new MockElement('cards-list'),
    'no-cards-message': new MockElement('no-cards-message'),
    'card-container': new MockElement('card-container'),
    'direction-bg-en': new MockElement('direction-bg-en'),
    'direction-en-bg': new MockElement('direction-en-bg'),
    'category-filter': new MockElement('category-filter'),
    'category-checkboxes': new MockElement('category-checkboxes'),
    'bulgarian-input': new MockElement('bulgarian-input'),
    'english-input': new MockElement('english-input'),
    'category-input': new MockElement('category-input'),
    'add-card-btn': new MockElement('add-card-btn'),
    'export-btn': new MockElement('export-btn'),
    'import-merge-btn': new MockElement('import-merge-btn'),
    'import-replace-btn': new MockElement('import-replace-btn'),
    'import-file-input': new MockElement('import-file-input'),
    'start-session-btn': new MockElement('start-session-btn'),
    'end-session-btn': new MockElement('end-session-btn'),
    'session-controls': new MockElement('session-controls'),
    'session-timer': new MockElement('session-timer'),
    'shuffle-checkbox': new MockElement('shuffle-checkbox'),
    'card-limit-input': new MockElement('card-limit-input')
};

mockDOM['study-tab'].classList.add('active');
mockDOM['easy-btn'].style.display = 'none';
mockDOM['review-btn'].style.display = 'none';
mockDOM['category-checkboxes'].querySelectorAll = () => [];
mockDOM['category-checkboxes'].innerHTML = '';
mockDOM['cards-list'].innerHTML = '';

global.document = {
    getElementById: (id) => mockDOM[id],
    querySelectorAll: (selector) => {
        if (selector === '.tab-button') {
            return [{
                addEventListener: () => {},
                dataset: { tab: 'study' },
                classList: { add: () => {}, remove: () => {} }
            }];
        }
        if (selector === '.tab-content') {
            return [mockDOM['study-tab'], mockDOM['manage-tab']];
        }
        return [];
    },
    querySelector: (selector) => {
        if (selector === '.tab-content.active') return mockDOM['study-tab'];
        return null;
    },
    createElement: () => ({ 
        textContent: '', 
        innerHTML: '',
        setAttribute: () => {},
        style: { visibility: 'hidden' }
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {}
    },
    addEventListener: () => {}
};

global.localStorage = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    removeItem: function(key) { delete this.data[key]; },
    clear: function() { this.data = {}; }
};

global.FileReader = function() {
    this.onload = null;
    this.onerror = null;
    this.readAsText = function() {};
};

global.Blob = function() {};
global.URL = { createObjectURL: () => 'mock-url', revokeObjectURL: () => {} };
global.alert = () => {};
global.confirm = () => true;

// Load the app
const fs = require('fs');
const appCode = fs.readFileSync('../app.js', 'utf8');
const classCode = appCode
    .replace(/\nconst app = new FlashcardApp\(\);?\s*$/, '')
    .replace('class FlashcardApp', 'global.FlashcardApp = class FlashcardApp');

eval(classCode);

if (typeof global.FlashcardApp !== 'function') {
    console.error('Failed to load FlashcardApp class');
    process.exit(1);
}

const FlashcardApp = global.FlashcardApp;

// Clear localStorage before tests
localStorage.clear();

// Create app instance
let app;

test('App initializes correctly', () => {
    app = new FlashcardApp();
    assert(app !== null, 'App should be created');
    assert(app.inSession === false, 'Should not be in session initially');
});

test('updateCardDisplay uses sessionCards when not in session', () => {
    // Add some cards
    localStorage.setItem('flashcards', JSON.stringify([
        { id: 1, bulgarian: 'Card1', english: 'One', category: '' },
        { id: 2, bulgarian: 'Card2', english: 'Two', category: '' },
        { id: 3, bulgarian: 'Card3', english: 'Three', category: '' }
    ]));
    
    app = new FlashcardApp();
    app.sessionCards = app.cards.slice(); // Copy all cards to session
    app.currentCardIndex = 0;
    
    // Not in session - should use sessionCards directly
    app.updateCardDisplay();
    
    // Verify the first card is displayed
    assertEquals(mockDOM['card-front-text'].textContent, 'Card1', 'Should display first card');
    assertEquals(mockDOM['card-position'].textContent, '1 / 3', 'Should show correct position');
});

test('updateCardDisplay uses getFilteredCards when in session with review queue', () => {
    // Setup: Start a session with 3 cards
    app.inSession = true;
    app.sessionCards = [
        { id: 1, bulgarian: 'Card1', english: 'One', category: '' },
        { id: 2, bulgarian: 'Card2', english: 'Two', category: '' },
        { id: 3, bulgarian: 'Card3', english: 'Three', category: '' }
    ];
    app.currentCardIndex = 0;
    app.reviewQueue = [];
    
    // Add card 1 to review queue
    app.reviewQueue.push(1);
    
    // Call updateCardDisplay - it should use getFilteredCards which reorders the deck
    app.updateCardDisplay();
    
    // With getFilteredCards, the order should be: Card2, Card3, Card1 (queued at end)
    // So position 1 should show Card2, not Card1
    assertEquals(mockDOM['card-front-text'].textContent, 'Card2', 'Should display Card2 (first non-queued card)');
    assertEquals(mockDOM['card-position'].textContent, '1 / 3', 'Should show position 1 of 3');
});

test('updateCardDisplay shows queued card at the end in session', () => {
    // Continue from previous test state
    app.currentCardIndex = 2; // Move to the last position (which should be the queued card)
    
    app.updateCardDisplay();
    
    // At position 3, we should see Card1 (the queued card)
    assertEquals(mockDOM['card-front-text'].textContent, 'Card1', 'Should display Card1 (the queued card) at the end');
    assertEquals(mockDOM['card-position'].textContent, '3 / 3', 'Should show position 3 of 3');
});

test('updateCardDisplay handles multiple queued cards in order', () => {
    // Setup: Start fresh with 4 cards
    app.inSession = true;
    app.sessionCards = [
        { id: 1, bulgarian: 'Card1', english: 'One', category: '' },
        { id: 2, bulgarian: 'Card2', english: 'Two', category: '' },
        { id: 3, bulgarian: 'Card3', english: 'Three', category: '' },
        { id: 4, bulgarian: 'Card4', english: 'Four', category: '' }
    ];
    app.currentCardIndex = 0;
    app.reviewQueue = [1, 3]; // Queue cards 1 and 3
    
    // Call updateCardDisplay at position 0
    app.updateCardDisplay();
    
    // Order should be: Card2, Card4, Card1, Card3
    assertEquals(mockDOM['card-front-text'].textContent, 'Card2', 'Position 0 should show Card2');
    
    // Move to position 2 (first queued card)
    app.currentCardIndex = 2;
    app.updateCardDisplay();
    assertEquals(mockDOM['card-front-text'].textContent, 'Card1', 'Position 2 should show Card1 (first queued)');
    
    // Move to position 3 (second queued card)
    app.currentCardIndex = 3;
    app.updateCardDisplay();
    assertEquals(mockDOM['card-front-text'].textContent, 'Card3', 'Position 3 should show Card3 (second queued)');
});

// Print results
console.log('\n=================================');
console.log(`Tests run: ${testsRun}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsRun - testsPassed}`);

if (testsPassed === testsRun) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
}
