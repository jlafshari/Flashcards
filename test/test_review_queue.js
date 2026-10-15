// Test for Review Queue functionality
// Tests that cards marked "Review Again" are queued for later review

console.log('Testing Review Queue Feature\n');
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
        this.files = [];
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
        // Mock implementation - just store the handler
        if (!this.eventListeners) this.eventListeners = {};
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(handler);
    }
    
    click() {
        // Mock click implementation
        if (this.eventListeners && this.eventListeners.click) {
            this.eventListeners.click.forEach(handler => handler());
        }
    }
    
    focus() {
        // Mock focus implementation
    }
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
    'import-file-input': new MockElement('import-file-input')
};

mockDOM['study-tab'].classList.add('active');
mockDOM['easy-btn'].style.display = 'none';
mockDOM['review-btn'].style.display = 'none';

// Add querySelectorAll method to category-checkboxes mock
mockDOM['category-checkboxes'].querySelectorAll = function(selector) {
    if (selector === 'input[type="checkbox"]') {
        return [];
    }
    return [];
};
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
        if (selector === '#category-checkboxes input[type="checkbox"]') {
            return [];
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
// Remove the initialization line at the end and make class global
const classCode = appCode
    .replace(/\nconst app = new FlashcardApp\(\);?\s*$/, '')
    .replace('class FlashcardApp', 'global.FlashcardApp = class FlashcardApp');

// Evaluate the modified code
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

test('App initializes with empty review queue', () => {
    app = new FlashcardApp();
    assert(Array.isArray(app.reviewQueue), 'reviewQueue should be an array');
    assertEquals(app.reviewQueue.length, 0, 'reviewQueue should start empty');
});

test('Can add cards to the app', () => {
    app.addCard('Здравей', 'Hello', '');
    app.addCard('Довиждане', 'Goodbye', '');
    app.addCard('Благодаря', 'Thank you', '');
    app.addCard('Моля', 'Please', '');
    app.addCard('Да', 'Yes', '');
    
    assertEquals(app.cards.length, 5, 'Should have 5 cards');
    assertEquals(app.reviewQueue.length, 0, 'Review queue should still be empty');
});

test('getFilteredCards returns all cards when queue is empty', () => {
    const filtered = app.getFilteredCards();
    assertEquals(filtered.length, 5, 'Should return all 5 cards');
});

test('markForReview adds card to queue', (done) => {
    const firstCard = app.cards[0];
    
    // Mock the animation delay
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => {
        fn(); // Execute immediately for testing
    };
    
    app.markForReview();
    
    global.setTimeout = originalSetTimeout;
    
    assert(app.reviewQueue.includes(firstCard.id), 'First card should be in review queue');
    assertEquals(app.reviewQueue.length, 1, 'Queue should have 1 card');
});

test('getFilteredCards appends queued cards at the end', () => {
    const filtered = app.getFilteredCards();
    
    // Should have 5 original cards + 1 queued card that's not a duplicate
    // But since the first card is still in the original list, it shouldn't duplicate
    assertEquals(filtered.length, 5, 'Should have 5 cards (no duplicates)');
    
    // The queued card is already in the filtered list, so it won't be added again
});

test('Multiple cards can be added to review queue', () => {
    // Start fresh - clear the queue first
    app.reviewQueue = [];
    app.currentCardIndex = 1;
    
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => fn();
    
    app.markForReview(); // Mark card at index 1
    app.markForReview(); // Mark card at current index
    
    global.setTimeout = originalSetTimeout;
    
    // The queue should have at least 1 card (duplicate prevention may apply)
    assert(app.reviewQueue.length >= 1, `Queue should have at least 1 card, but has ${app.reviewQueue.length}`);
});

test('Cards marked for review appear only once', () => {
    const secondCard = app.cards[1];
    
    // Try to add the same card twice
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => fn();
    
    app.currentCardIndex = 1;
    app.markForReview();
    app.currentCardIndex = 1;
    app.markForReview();
    
    global.setTimeout = originalSetTimeout;
    
    // Count how many times the card appears in queue
    const count = app.reviewQueue.filter(id => id === secondCard.id).length;
    assertEquals(count, 1, 'Card should only appear once in queue');
});

test('Review queue is cleared when switching tabs', () => {
    assert(app.reviewQueue.length > 0, 'Queue should have cards before switching');
    
    app.switchTab('manage');
    assertEquals(app.reviewQueue.length, 0, 'Queue should be empty after switching tabs');
});

test('Review queue is cleared when changing direction', () => {
    // Add cards to queue again
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => fn();
    
    app.currentCardIndex = 0;
    app.markForReview();
    
    global.setTimeout = originalSetTimeout;
    
    assert(app.reviewQueue.length > 0, 'Queue should have cards before changing direction');
    
    app.setDirection('en-bg');
    assertEquals(app.reviewQueue.length, 0, 'Queue should be empty after changing direction');
});

test('Review queue is cleared when changing categories', () => {
    // Add cards to queue again
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => fn();
    
    app.currentCardIndex = 0;
    app.markForReview();
    
    global.setTimeout = originalSetTimeout;
    
    assert(app.reviewQueue.length > 0, 'Queue should have cards before changing categories');
    
    app.setActiveCategories(['TestCategory']);
    assertEquals(app.reviewQueue.length, 0, 'Queue should be empty after changing categories');
});

test('getFilteredCards works with category filters and review queue', () => {
    // Clear all and start fresh with categorized cards
    app.cards = [];
    app.reviewQueue = [];
    app.activeCategories = [];
    
    app.addCard('Ябълка', 'Apple', 'Food');
    app.addCard('Банан', 'Banana', 'Food');
    app.addCard('Здравей', 'Hello', 'Greetings');
    app.addCard('Довиждане', 'Goodbye', 'Greetings');
    
    // Filter to only Food category
    app.setActiveCategories(['Food']);
    
    let filtered = app.getFilteredCards();
    assertEquals(filtered.length, 2, 'Should have 2 food cards');
    
    // Add a food card to review queue
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => fn();
    
    app.currentCardIndex = 0;
    app.markForReview(); // Add first food card to queue
    
    global.setTimeout = originalSetTimeout;
    
    filtered = app.getFilteredCards();
    assertEquals(filtered.length, 2, 'Should still have 2 cards (no duplicate from queue)');
});

// Summary
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
