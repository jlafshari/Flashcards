// Test for review queue behavior with card limit
console.log('Testing Review Queue with Card Limit\n');
console.log('====================================\n');

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
global.setTimeout = (fn) => fn(); // Execute immediately

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

test('Session with card limit: all limited cards should remain in session', () => {
    app = new FlashcardApp();
    
    // Add 10 cards
    for (let i = 1; i <= 10; i++) {
        app.addCard(`Card${i}_BG`, `Card${i}_EN`, '');
    }
    
    // Set card limit to 5 and start session (no shuffle for predictability)
    app.cardLimit = 5;
    app.shuffleEnabled = false;
    app.startSession();
    
    // Verify session has 5 cards
    assert(app.sessionCards.length === 5, `Expected 5 session cards, got ${app.sessionCards.length}`);
    
    console.log('  Session cards:', app.sessionCards.map(c => c.english).join(', '));
    
    // Mark first card for review
    app.currentCardIndex = 0;
    const firstCardId = app.sessionCards[0].id;
    app.markForReview();
    
    console.log('  Review queue after marking first card:', app.reviewQueue);
    console.log('  Current index after markForReview:', app.currentCardIndex);
    
    // Check that session still has 5 cards
    assert(app.sessionCards.length === 5, `Session should still have 5 cards, got ${app.sessionCards.length}`);
    
    // Check that getFilteredCards returns 5 cards
    const filtered = app.getFilteredCards();
    assert(filtered.length === 5, `getFilteredCards should return 5 cards, got ${filtered.length}`);
    
    console.log('  Filtered cards (reordered):', filtered.map(c => c.english).join(', '));
    
    // Verify the first card was moved to the end
    assert(filtered[filtered.length - 1].id === firstCardId, 
        'First card should be at the end of filtered cards');
});

test('Session with card limit: reviewing multiple cards should not exceed limit', () => {
    app = new FlashcardApp();
    
    // Add 10 cards
    for (let i = 1; i <= 10; i++) {
        app.addCard(`Card${i}_BG`, `Card${i}_EN`, '');
    }
    
    // Set card limit to 5 and start session
    app.cardLimit = 5;
    app.shuffleEnabled = false;
    app.startSession();
    
    const originalSessionCards = app.sessionCards.map(c => c.id);
    console.log('  Original session card IDs:', originalSessionCards);
    
    // Mark first 3 cards for review
    for (let i = 0; i < 3; i++) {
        app.currentCardIndex = i;
        app.markForReview();
    }
    
    console.log('  Review queue:', app.reviewQueue);
    
    // Session cards array should not change
    assert(app.sessionCards.length === 5, `Session should still have 5 cards, got ${app.sessionCards.length}`);
    
    // All original session cards should still be present
    const currentSessionCardIds = app.sessionCards.map(c => c.id);
    for (const id of originalSessionCards) {
        assert(currentSessionCardIds.includes(id), 
            `Original card ${id} should still be in session`);
    }
    
    console.log('  Session card IDs after reviews:', currentSessionCardIds);
    console.log('  All original cards preserved: ✓');
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
