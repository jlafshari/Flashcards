// Test: Sample Cards Initialization
// Tests that app initializes with 10 sample cards on first load

const fs = require('fs');
const vm = require('vm');

// Create a minimal DOM environment
const context = {
    window: {
        localStorage: {
            data: {},
            getItem: function(key) { return this.data[key] || null; },
            setItem: function(key, value) { this.data[key] = value; },
            removeItem: function(key) { delete this.data[key]; },
            clear: function() { this.data = {}; }
        }
    },
    console: console
};
context.localStorage = context.window.localStorage;

// Mock document object with full functionality
context.document = {
    getElementById: function(id) {
        return {
            textContent: '',
            innerHTML: '',
            value: '',
            style: { display: '' },
            disabled: false,
            classList: {
                toggle: function() {},
                add: function() {},
                remove: function() {}
            },
            querySelectorAll: function() { return []; },
            addEventListener: function() {}
        };
    },
    querySelector: function() {
        return {
            textContent: '',
            innerHTML: '',
            value: '',
            style: { display: '' },
            disabled: false,
            classList: {
                toggle: function() {},
                add: function() {},
                remove: function() {}
            },
            querySelectorAll: function() { return []; },
            addEventListener: function() {}
        };
    },
    querySelectorAll: function() { return []; },
    createElement: function(tag) {
        return {
            textContent: '',
            innerHTML: '',
            addEventListener: function() {}
        };
    },
    addEventListener: function() {}
};

// Load and evaluate app.js
const appJs = fs.readFileSync('../app.js', 'utf8');
vm.createContext(context);
vm.runInContext(appJs, context);

// Get FlashcardApp from context
console.log('Available in context:', Object.keys(context).filter(k => typeof context[k] === 'function'));
console.log('FlashcardApp type:', typeof context.FlashcardApp);

const FlashcardApp = context.FlashcardApp;
const localStorage = context.localStorage;

console.log('Testing Sample Cards Initialization...\n');

let testsFailed = 0;
let testsPassed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`✗ ${name}`);
        console.log(`  ${error.message}`);
        testsFailed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Test 1: Initialize with sample cards on first load
test('Should initialize with 10 sample cards when localStorage is empty', () => {
    localStorage.clear();
    const app = new FlashcardApp();
    assert(app.cards.length === 10, `Expected 10 cards, got ${app.cards.length}`);
});

// Test 2: Cards have correct structure
test('Sample cards should have correct structure', () => {
    localStorage.clear();
    const app = new FlashcardApp();
    const card = app.cards[0];
    assert(card.id, 'Card should have an id');
    assert(card.bulgarian, 'Card should have bulgarian text');
    assert(card.english, 'Card should have english text');
    assert(card.category, 'Card should have a category');
    assert(card.createdAt, 'Card should have createdAt timestamp');
});

// Test 3: Three categories
test('Should have sample cards in three categories', () => {
    localStorage.clear();
    const app = new FlashcardApp();
    const categories = new Set(app.cards.map(c => c.category));
    assert(categories.has('Greetings'), 'Should have Greetings category');
    assert(categories.has('Questions'), 'Should have Questions category');
    assert(categories.has('Basic Phrases'), 'Should have Basic Phrases category');
    assert(categories.size === 3, `Expected 3 categories, got ${categories.size}`);
});

// Test 4: Category distribution
test('Should have 3 Greetings cards', () => {
    localStorage.clear();
    const app = new FlashcardApp();
    const greetings = app.cards.filter(c => c.category === 'Greetings');
    assert(greetings.length === 3, `Expected 3 Greetings cards, got ${greetings.length}`);
});

test('Should have 3 Questions cards', () => {
    localStorage.clear();
    const app = new FlashcardApp();
    const questions = app.cards.filter(c => c.category === 'Questions');
    assert(questions.length === 3, `Expected 3 Questions cards, got ${questions.length}`);
});

test('Should have 4 Basic Phrases cards', () => {
    localStorage.clear();
    const app = new FlashcardApp();
    const basicPhrases = app.cards.filter(c => c.category === 'Basic Phrases');
    assert(basicPhrases.length === 4, `Expected 4 Basic Phrases cards, got ${basicPhrases.length}`);
});

// Test 5: Cards saved to localStorage
test('Should save sample cards to localStorage', () => {
    localStorage.clear();
    const app = new FlashcardApp();
    const stored = localStorage.getItem('flashcards');
    assert(stored, 'Cards should be saved to localStorage');
    
    const parsed = JSON.parse(stored);
    assert(parsed.length === 10, `Expected 10 cards in storage, got ${parsed.length}`);
});

// Test 6: Don't reinitialize if data exists
test('Should not reinitialize cards if localStorage already has data', () => {
    localStorage.clear();
    const existingCards = JSON.stringify([
        {
            id: 1,
            bulgarian: 'Тест',
            english: 'Test',
            category: 'Testing',
            createdAt: new Date().toISOString()
        }
    ]);
    localStorage.setItem('flashcards', existingCards);

    const app = new FlashcardApp();
    
    assert(app.cards.length === 1, `Expected 1 card, got ${app.cards.length}`);
    assert(app.cards[0].bulgarian === 'Тест', 'Should preserve existing card data');
});

// Test 7: Specific cards present
test('Should include specific expected sample cards', () => {
    localStorage.clear();
    const app = new FlashcardApp();
    const bulgarians = app.cards.map(c => c.bulgarian);
    assert(bulgarians.includes('Здравей'), 'Should have Hello card');
    assert(bulgarians.includes('Благодаря'), 'Should have Thank you card');
    assert(bulgarians.includes('Да'), 'Should have Yes card');
    assert(bulgarians.includes('Не'), 'Should have No card');
});

// Test 8: Unique IDs
test('All cards should have unique IDs', () => {
    localStorage.clear();
    const app = new FlashcardApp();
    const ids = app.cards.map(c => c.id);
    const uniqueIds = new Set(ids);
    assert(ids.length === uniqueIds.size, 'All card IDs should be unique');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed > 0) {
    process.exit(1);
}
