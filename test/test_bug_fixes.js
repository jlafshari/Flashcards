// Test for the two session bugs fixed:
// 1. When flipping a card and pressing review again, user should see next card
// 2. When reviewing the last card, easy and review again buttons should be enabled

require('./dom-mock.js');

console.log('Testing Session Bug Fixes\n');
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
        if (!this.eventListeners) this.eventListeners = {};
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(handler);
    }
    
    click() {
        if (this.eventListeners && this.eventListeners.click) {
            this.eventListeners.click.forEach(handler => handler());
        }
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
    'session-complete-modal': new MockElement('session-complete-modal')
};

mockDOM['study-tab'].classList.add('active');
mockDOM['easy-btn'].style.display = 'none';
mockDOM['review-btn'].style.display = 'none';

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

// Mock setTimeout to execute immediately for testing
const originalSetTimeout = global.setTimeout;
global.setTimeout = (fn, delay) => fn();

// Test 1: Bug Fix - Review Again should advance to next card in session mode
test('Bug 1: markForReview advances to next card in session', () => {
    const app = new FlashcardApp();
    app.addCard('Здравей', 'Hello', '');
    app.addCard('Довиждане', 'Goodbye', '');
    app.addCard('Благодаря', 'Thank you', '');
    
    app.startSession();
    assertEquals(app.currentCardIndex, 0, 'Should start at card 0');
    
    const firstCardId = app.sessionCards[0].id;
    app.markForReview();
    
    // Should have moved to next card (index 1)
    assertEquals(app.currentCardIndex, 1, 'Should advance to card 1 after marking for review');
    assert(app.reviewQueue.includes(firstCardId), 'First card should be in review queue');
});

// Test 2: Bug Fix - Review Again should advance to next card in normal mode
test('Bug 1: markForReview advances to next card in normal mode', () => {
    const app = new FlashcardApp();
    app.addCard('Здравей', 'Hello', '');
    app.addCard('Довиждане', 'Goodbye', '');
    app.addCard('Благодаря', 'Thank you', '');
    
    assertEquals(app.currentCardIndex, 0, 'Should start at card 0');
    
    const firstCardId = app.cards[0].id;
    app.markForReview();
    
    // Should have moved to next card (index 1)
    assertEquals(app.currentCardIndex, 1, 'Should advance to card 1 after marking for review');
    assert(app.reviewQueue.includes(firstCardId), 'First card should be in review queue');
});

// Test 3: Bug Fix - Easy and Review buttons should NOT be disabled on last card
test('Bug 2: Easy and Review buttons enabled on last card', () => {
    const app = new FlashcardApp();
    app.addCard('Здравей', 'Hello', '');
    app.addCard('Довиждане', 'Goodbye', '');
    
    app.startSession();
    
    // Go to the last card
    app.currentCardIndex = 1;
    app.updateUI();
    
    // Check that easy and review buttons are NOT disabled
    // (They may be hidden if not flipped, but should not be disabled)
    assert(!mockDOM['easy-btn'].disabled, 'Easy button should not be disabled on last card');
    assert(!mockDOM['review-btn'].disabled, 'Review button should not be disabled on last card');
});

// Test 4: markEasy on last card marks it as reviewed
test('Bug 2: markEasy on last card completes session', () => {
    const app = new FlashcardApp();
    app.addCard('Здравей', 'Hello', '');
    app.addCard('Довиждане', 'Goodbye', '');
    
    app.startSession();
    
    // Mark first card as easy
    app.currentCardIndex = 0;
    app.markEasy();
    
    // Now at second card - mark it as easy too
    assertEquals(app.currentCardIndex, 1, 'Should be at second card');
    const secondCardId = app.sessionCards[1].id;
    app.markEasy();
    
    // Session should be complete
    assert(app.sessionReviewedCards.has(secondCardId), 'Second card should be marked as reviewed');
});

// Test 5: markForReview on last card adds it to queue
test('Bug 2: markForReview on last card adds to queue and allows review', () => {
    const app = new FlashcardApp();
    app.addCard('Здравей', 'Hello', '');
    app.addCard('Довиждане', 'Goodbye', '');
    
    app.startSession();
    
    // Mark first card as easy to advance
    app.currentCardIndex = 0;
    app.markEasy();
    
    // Now at second (last) card - mark for review
    assertEquals(app.currentCardIndex, 1, 'Should be at second card');
    const secondCardId = app.sessionCards[1].id;
    app.markForReview();
    
    // Card should be in review queue
    assert(app.reviewQueue.includes(secondCardId), 'Last card should be in review queue');
    assert(app.sessionReviewedCards.has(secondCardId), 'Last card should be marked as reviewed');
});

// Test 6: Skip cards with Next, then markEasy on last card should end session
test('Bug 3: Skip cards with Next, markEasy on last card ends session', () => {
    localStorage.clear(); // Clear state from previous tests
    const app = new FlashcardApp();
    app.addCard('Здравей', 'Hello', '');
    app.addCard('Довиждане', 'Goodbye', '');
    app.addCard('Благодаря', 'Thank you', '');
    
    app.startSession();
    assert(app.inSession, 'Session should be active');
    
    // Skip first card using nextCard (simulating Next button)
    app.nextCard();
    assertEquals(app.currentCardIndex, 1, 'Should be at card 1');
    
    // Skip second card
    app.nextCard();
    assertEquals(app.currentCardIndex, 2, 'Should be at card 2 (last card)');
    
    // Now mark the last card as easy - should end the session
    app.markEasy();
    
    // Session should have ended
    assert(!app.inSession, 'Session should have ended after marking last card as easy');
});

// Test 7: Skip cards with Next, then markForReview on last card should end session
test('Bug 3: Skip cards with Next, markForReview on last card ends session', () => {
    localStorage.clear(); // Clear state from previous tests
    const app = new FlashcardApp();
    app.addCard('Здравей', 'Hello', '');
    app.addCard('Довиждане', 'Goodbye', '');
    app.addCard('Благодаря', 'Thank you', '');
    
    app.startSession();
    assert(app.inSession, 'Session should be active');
    
    // Skip first card
    app.nextCard();
    assertEquals(app.currentCardIndex, 1, 'Should be at card 1');
    
    // Skip second card
    app.nextCard();
    assertEquals(app.currentCardIndex, 2, 'Should be at card 2 (last card)');
    
    // Now mark the last card for review - should end the session
    app.markForReview();
    
    // Session should have ended
    assert(!app.inSession, 'Session should have ended after marking last card for review');
});

// Test 8: Skip some cards, review others, markEasy on last card should end session
test('Bug 3: Mixed skip and review, markEasy on last card ends session', () => {
    localStorage.clear(); // Clear state from previous tests
    const app = new FlashcardApp();
    app.addCard('Здравей', 'Hello', '');
    app.addCard('Довиждане', 'Goodbye', '');
    app.addCard('Благодаря', 'Thank you', '');
    
    app.startSession();
    
    // Review first card
    app.markEasy();
    assertEquals(app.currentCardIndex, 1, 'Should be at card 1');
    
    // Skip second card
    app.nextCard();
    assertEquals(app.currentCardIndex, 2, 'Should be at card 2 (last card)');
    
    // Review last card - should end session
    app.markEasy();
    
    // Session should have ended
    assert(!app.inSession, 'Session should have ended after marking last card as easy');
});

// Restore setTimeout
global.setTimeout = originalSetTimeout;

// Summary
console.log('\n=================================');
console.log(`Tests run: ${testsRun}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsRun - testsPassed}`);

if (testsPassed === testsRun) {
    console.log('\n✅ All bug fix tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
}
