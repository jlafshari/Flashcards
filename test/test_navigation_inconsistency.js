// Test for navigation inconsistency between nextCard and updateCardDisplay
require('./dom-mock.js');

console.log('Testing Navigation Inconsistency\n');
console.log('=================================\n');

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
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
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
    
    addEventListener(event, handler) {}
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

global.FileReader = function() {};
global.Blob = function() {};
global.URL = { createObjectURL: () => 'mock-url', revokeObjectURL: () => {} };
global.alert = () => {};
global.confirm = () => true;
global.setTimeout = (fn) => fn(); // Execute immediately

// Load the app
const fs = require('fs');
const appCode = fs.readFileSync('../app.js', 'utf8');
const classCode = appCode
    .replace(/\nconst app = new FlashcardApp\(\);?\s*$/, '')
    .replace('class FlashcardApp', 'global.FlashcardApp = class FlashcardApp');

eval(classCode);

const FlashcardApp = global.FlashcardApp;
localStorage.clear();

let app;

test('nextCard() should use getFilteredCards() during session for consistent navigation', () => {
    app = new FlashcardApp();
    
    // Add 5 cards
    for (let i = 1; i <= 5; i++) {
        app.addCard(`Card${i}_BG`, `Card${i}_EN`, '');
    }
    
    app.shuffleEnabled = false;
    app.startSession();
    
    // At start, we're at index 0
    assert(app.currentCardIndex === 0, 'Should start at index 0');
    
    const firstCardId = app.sessionCards[0].id;
    console.log(`  First card ID: ${firstCardId}`);
    console.log(`  Session cards: ${app.sessionCards.map(c => c.english).join(', ')}`);
    
    // Mark first card for review
    app.markForReview();
    
    console.log(`  After markForReview, current index: ${app.currentCardIndex}`);
    console.log(`  Review queue: ${app.reviewQueue}`);
    
    // Check what getFilteredCards returns (should have first card at the end)
    const filteredCards = app.getFilteredCards();
    console.log(`  Filtered cards (reordered): ${filteredCards.map(c => c.english).join(', ')}`);
    
    // The first card should now be at the end of filtered cards
    assert(filteredCards[filteredCards.length - 1].id === firstCardId,
        'First card should be at end of filtered cards');
    
    // But sessionCards should still have original order
    console.log(`  Session cards (original): ${app.sessionCards.map(c => c.english).join(', ')}`);
    
    // The inconsistency: nextCard uses sessionCards, updateCardDisplay uses getFilteredCards
    // This means navigation bounds check uses one order, but display uses another
    console.log('\n  INCONSISTENCY DETECTED:');
    console.log(`  - nextCard() checks bounds against sessionCards (length ${app.sessionCards.length})`);
    console.log(`  - updateCardDisplay() displays from getFilteredCards() (length ${filteredCards.length})`);
    console.log(`  - Both should use getFilteredCards() for consistency`);
});

test('Demonstrate the navigation bug: trying to go beyond bounds', () => {
    app = new FlashcardApp();
    
    // Add 3 cards for simplicity
    for (let i = 1; i <= 3; i++) {
        app.addCard(`Card${i}_BG`, `Card${i}_EN`, '');
    }
    
    app.shuffleEnabled = false;
    app.startSession();
    
    console.log(`  Initial setup - 3 cards`);
    console.log(`  Session cards: ${app.sessionCards.map(c => c.english).join(', ')}`);
    
    // Move to index 1
    app.currentCardIndex = 0;
    app.nextCard();
    console.log(`  After nextCard(): index = ${app.currentCardIndex}`);
    
    // Now mark this card for review
    app.markForReview();
    console.log(`  Marked card at index ${app.currentCardIndex} for review`);
    console.log(`  Review queue: ${app.reviewQueue}`);
    
    const filtered = app.getFilteredCards();
    console.log(`  Filtered cards (reordered): ${filtered.map(c => c.english).join(', ')}`);
    
    // The problem: nextCard() checks `currentCardIndex < sessionCards.length - 1`
    // But the actual cards shown are from getFilteredCards() which is reordered
    console.log(`\n  Current index: ${app.currentCardIndex}`);
    console.log(`  sessionCards.length: ${app.sessionCards.length}`);
    console.log(`  Bound check in nextCard: ${app.currentCardIndex} < ${app.sessionCards.length - 1} = ${app.currentCardIndex < app.sessionCards.length - 1}`);
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
