// Test to verify that queued cards appear at the end in correct order
console.log('Testing Review Queue Ordering\n');
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
    'import-file-input': new MockElement('import-file-input')
};

mockDOM['study-tab'].classList.add('active');
mockDOM['easy-btn'].style.display = 'none';
mockDOM['review-btn'].style.display = 'none';
mockDOM['category-checkboxes'].querySelectorAll = function(selector) {
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

global.FileReader = function() {};
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
localStorage.clear();

let app;

test('Card marked for review moves to end of deck', () => {
    app = new FlashcardApp();
    
    // Add 5 cards
    const card1 = app.addCard('Едно', 'One', '');
    const card2 = app.addCard('Две', 'Two', '');
    const card3 = app.addCard('Три', 'Three', '');
    const card4 = app.addCard('Четири', 'Four', '');
    const card5 = app.addCard('Пет', 'Five', '');
    
    // Mock setTimeout to execute immediately
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => fn();
    
    // Mark the first card (card1) for review
    app.currentCardIndex = 0;
    app.markForReview();
    
    global.setTimeout = originalSetTimeout;
    
    // Get filtered cards - card1 should now be at the end
    const filtered = app.getFilteredCards();
    
    assertEquals(filtered.length, 5, 'Should still have 5 cards');
    assertEquals(filtered[0].id, card2.id, 'First card should now be card2');
    assertEquals(filtered[1].id, card3.id, 'Second card should be card3');
    assertEquals(filtered[2].id, card4.id, 'Third card should be card4');
    assertEquals(filtered[3].id, card5.id, 'Fourth card should be card5');
    assertEquals(filtered[4].id, card1.id, 'Last card should be card1 (the queued one)');
});

test('Multiple cards marked for review appear at end in order they were queued', () => {
    app.reviewQueue = [];
    app.currentCardIndex = 0;
    
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => fn();
    
    // Get initial order
    const initialCards = app.getFilteredCards();
    const card1 = initialCards[0];
    const card3 = initialCards[2];
    
    // Mark card at index 0 for review
    app.currentCardIndex = 0;
    app.markForReview();
    
    // Mark card at index 2 (which is now actually at index 1 since card1 moved to end)
    // But we need to mark the original card3, so let's find its new position
    let filtered = app.getFilteredCards();
    let card3Index = filtered.findIndex(c => c.id === card3.id);
    app.currentCardIndex = card3Index;
    app.markForReview();
    
    global.setTimeout = originalSetTimeout;
    
    // Get final order
    filtered = app.getFilteredCards();
    
    assertEquals(filtered.length, 5, 'Should still have 5 cards');
    
    // card1 should be second to last (queued first)
    // card3 should be last (queued second)
    const card1Position = filtered.findIndex(c => c.id === card1.id);
    const card3Position = filtered.findIndex(c => c.id === card3.id);
    
    assert(card1Position === 3, `card1 should be at index 3 (second to last), but is at ${card1Position}`);
    assert(card3Position === 4, `card3 should be at index 4 (last), but is at ${card3Position}`);
});

test('Card already at the end stays at the end when marked for review', () => {
    app.reviewQueue = [];
    
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, delay) => fn();
    
    // Get the last card
    const filtered = app.getFilteredCards();
    const lastCard = filtered[filtered.length - 1];
    
    // Move to last card and mark it for review
    app.currentCardIndex = filtered.length - 1;
    app.markForReview();
    
    global.setTimeout = originalSetTimeout;
    
    // Get filtered cards again
    const newFiltered = app.getFilteredCards();
    
    // Last card should still be at the end
    assertEquals(newFiltered[newFiltered.length - 1].id, lastCard.id, 'Last card should remain at end');
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
