// Test for review queue navigation consistency fix
console.log('Testing Review Queue Navigation Consistency Fix\n');
console.log('===============================================\n');

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

test('nextCard() uses getFilteredCards() during session', () => {
    localStorage.clear();
    app = new FlashcardApp();
    
    // Add 5 cards
    app.cards = [
        { id: 1, bulgarian: 'Card1_BG', english: 'Card1_EN', category: '' },
        { id: 2, bulgarian: 'Card2_BG', english: 'Card2_EN', category: '' },
        { id: 3, bulgarian: 'Card3_BG', english: 'Card3_EN', category: '' },
        { id: 4, bulgarian: 'Card4_BG', english: 'Card4_EN', category: '' },
        { id: 5, bulgarian: 'Card5_BG', english: 'Card5_EN', category: '' }
    ];
    
    app.shuffleEnabled = false;
    app.startSession();
    
    // At index 0 (Card1)
    assertEquals(app.currentCardIndex, 0, 'Should start at index 0');
    
    // Mark card 1 for review
    app.reviewQueue.push(1);
    
    // After reordering, cards should be: [Card2, Card3, Card4, Card5, Card1]
    const filtered = app.getFilteredCards();
    assertEquals(filtered[0].id, 2, 'First card should be Card2 after reordering');
    assertEquals(filtered[4].id, 1, 'Last card should be Card1 after reordering');
    
    // Call nextCard() - it should navigate to index 1 in the reordered list
    app.nextCard();
    assertEquals(app.currentCardIndex, 1, 'Should move to index 1');
    
    // Verify we're now on Card3 (index 1 in reordered list)
    const currentCard = filtered[app.currentCardIndex];
    assertEquals(currentCard.id, 3, 'Should be on Card3 after nextCard()');
});

test('Navigation works correctly with card limit and review queue', () => {
    localStorage.clear();
    app = new FlashcardApp();
    
    // Clear and add 10 cards
    app.cards = [];
    for (let i = 1; i <= 10; i++) {
        app.cards.push({ id: i, bulgarian: `Card${i}_BG`, english: `Card${i}_EN`, category: '' });
    }
    
    // Set card limit to 5 and start session
    app.cardLimit = 5;
    app.shuffleEnabled = false;
    app.startSession();
    
    // Session has cards 1-5
    assertEquals(app.sessionCards.length, 5, 'Should have 5 cards in session');
    
    // Mark card 1 for review
    app.currentCardIndex = 0;
    app.reviewQueue.push(1);
    
    // Get reordered cards: [Card2, Card3, Card4, Card5, Card1]
    const filtered = app.getFilteredCards();
    assertEquals(filtered.length, 5, 'Filtered should still have 5 cards');
    assertEquals(filtered[0].id, 2, 'First card should be Card2');
    assertEquals(filtered[4].id, 1, 'Last card should be Card1');
    
    // Navigate through all cards
    app.currentCardIndex = 0;
    
    // Card2 at index 0
    assertEquals(filtered[app.currentCardIndex].id, 2, 'Index 0 should be Card2');
    
    app.nextCard();
    // Card3 at index 1
    assertEquals(app.currentCardIndex, 1, 'Should be at index 1');
    assertEquals(filtered[app.currentCardIndex].id, 3, 'Index 1 should be Card3');
    
    app.nextCard();
    // Card4 at index 2
    assertEquals(app.currentCardIndex, 2, 'Should be at index 2');
    assertEquals(filtered[app.currentCardIndex].id, 4, 'Index 2 should be Card4');
    
    app.nextCard();
    // Card5 at index 3
    assertEquals(app.currentCardIndex, 3, 'Should be at index 3');
    assertEquals(filtered[app.currentCardIndex].id, 5, 'Index 3 should be Card5');
    
    app.nextCard();
    // Card1 at index 4 (the queued card)
    assertEquals(app.currentCardIndex, 4, 'Should be at index 4');
    assertEquals(filtered[app.currentCardIndex].id, 1, 'Index 4 should be Card1 (queued)');
    
    // Should not be able to go further
    const prevIndex = app.currentCardIndex;
    app.nextCard();
    assertEquals(app.currentCardIndex, prevIndex, 'Should not advance beyond last card');
});

test('Multiple queued cards maintain order during navigation', () => {
    localStorage.clear();
    app = new FlashcardApp();
    
    // Clear and add 5 cards
    app.cards = [];
    for (let i = 1; i <= 5; i++) {
        app.cards.push({ id: i, bulgarian: `Card${i}_BG`, english: `Card${i}_EN`, category: '' });
    }
    
    app.shuffleEnabled = false;
    app.startSession();
    
    // Mark cards 1 and 3 for review
    app.reviewQueue.push(1);
    app.reviewQueue.push(3);
    
    // Expected order: [Card2, Card4, Card5, Card1, Card3]
    const filtered = app.getFilteredCards();
    assertEquals(filtered[0].id, 2, 'Position 0: Card2');
    assertEquals(filtered[1].id, 4, 'Position 1: Card4');
    assertEquals(filtered[2].id, 5, 'Position 2: Card5');
    assertEquals(filtered[3].id, 1, 'Position 3: Card1 (queued)');
    assertEquals(filtered[4].id, 3, 'Position 4: Card3 (queued)');
    
    // Navigate to the queued cards
    app.currentCardIndex = 0;
    
    app.nextCard(); // -> index 1 (Card4)
    app.nextCard(); // -> index 2 (Card5)
    app.nextCard(); // -> index 3 (Card1, first queued)
    
    assertEquals(app.currentCardIndex, 3, 'Should be at index 3');
    assertEquals(filtered[app.currentCardIndex].id, 1, 'Should be on Card1');
    
    app.nextCard(); // -> index 4 (Card3, second queued)
    
    assertEquals(app.currentCardIndex, 4, 'Should be at index 4');
    assertEquals(filtered[app.currentCardIndex].id, 3, 'Should be on Card3');
});

test('All original session cards remain accessible after marking for review', () => {
    localStorage.clear();
    app = new FlashcardApp();
    
    // Clear and add 10 cards, limit to 5
    app.cards = [];
    for (let i = 1; i <= 10; i++) {
        app.cards.push({ id: i, bulgarian: `Card${i}_BG`, english: `Card${i}_EN`, category: '' });
    }
    
    app.cardLimit = 5;
    app.shuffleEnabled = false;
    app.startSession();
    
    // Record original session card IDs
    const originalIds = app.sessionCards.map(c => c.id);
    assertEquals(originalIds.length, 5, 'Should have 5 original cards');
    
    // Mark first 2 cards for review
    app.reviewQueue.push(originalIds[0]);
    app.reviewQueue.push(originalIds[1]);
    
    // Get filtered cards
    const filtered = app.getFilteredCards();
    assertEquals(filtered.length, 5, 'Filtered should still have 5 cards');
    
    // Verify all original cards are still present
    const filteredIds = filtered.map(c => c.id);
    for (const id of originalIds) {
        assert(filteredIds.includes(id), `Original card ${id} should still be in filtered cards`);
    }
    
    // Verify no new cards were added
    for (const id of filteredIds) {
        assert(originalIds.includes(id), `Card ${id} should be from original session`);
    }
    
    console.log('  ✓ All original cards preserved, no cards added or removed');
});

test('Navigation bounds check prevents going out of range', () => {
    localStorage.clear();
    app = new FlashcardApp();
    
    // Clear and add 3 cards
    app.cards = [];
    for (let i = 1; i <= 3; i++) {
        app.cards.push({ id: i, bulgarian: `Card${i}_BG`, english: `Card${i}_EN`, category: '' });
    }
    
    app.shuffleEnabled = false;
    app.startSession();
    
    // Mark first card for review
    app.reviewQueue.push(1);
    
    const filtered = app.getFilteredCards();
    // Order: [Card2, Card3, Card1]
    
    // Navigate to last card
    app.currentCardIndex = 0;
    app.nextCard(); // index 1
    app.nextCard(); // index 2 (last card)
    
    assertEquals(app.currentCardIndex, 2, 'Should be at last index');
    
    // Try to go beyond
    app.nextCard();
    assertEquals(app.currentCardIndex, 2, 'Should still be at last index');
    
    // Verify we can go backward
    app.previousCard();
    assertEquals(app.currentCardIndex, 1, 'Should move back to index 1');
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
