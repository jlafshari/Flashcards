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
            style: {},
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
console.log('Available in context:', Object.keys(context));
const FlashcardApp = context.FlashcardApp;
console.log('FlashcardApp type:', typeof FlashcardApp);
const localStorage = context.localStorage;

// Run tests
const results = [];

function testAddToResults(name, passed, details = '') {
    results.push({ name, passed, details });
}

// Clear localStorage
localStorage.clear();

// Create app instance
const app = new FlashcardApp();

// Test 1: Add a card
const card1 = app.addCard('Здравей', 'Hello', 'Greetings');
testAddToResults('Add card', card1 && card1.id, `Card ID: ${card1?.id}`);

// Test 2: Check editingCardId is initially null
testAddToResults('Initial editingCardId is null', app.editingCardId === null);

// Test 3: Start edit
app.startEditCard(card1.id);
testAddToResults('Start edit sets editingCardId', app.editingCardId === card1.id);

// Test 4: Cancel edit
app.cancelEdit();
testAddToResults('Cancel edit clears editingCardId', app.editingCardId === null);

// Test 5: Edit card data
app.editCard(card1.id, 'Довиждане', 'Goodbye', 'Greetings');
const editedCard = app.cards.find(c => c.id === card1.id);
testAddToResults('Edit card updates data', 
    editedCard.bulgarian === 'Довиждане' && 
    editedCard.english === 'Goodbye' && 
    editedCard.category === 'Greetings',
    `Bulgarian: ${editedCard.bulgarian}, English: ${editedCard.english}`);

// Test 6: Edit with empty category
app.editCard(card1.id, 'Добър ден', 'Good day', '');
const editedCard2 = app.cards.find(c => c.id === card1.id);
testAddToResults('Edit card with empty category', 
    editedCard2.bulgarian === 'Добър ден' && 
    editedCard2.english === 'Good day' && 
    editedCard2.category === '',
    `Category: "${editedCard2.category}"`);

// Test 7: Verify card persists in localStorage
const storedCards = JSON.parse(localStorage.getItem('flashcards'));
const storedCard = storedCards.find(c => c.id === card1.id);
testAddToResults('Edited card persists in localStorage',
    storedCard.bulgarian === 'Добър ден' && storedCard.english === 'Good day');

// Display results
console.log('\n=== Edit Feature Test Results ===');
let passedCount = 0;
results.forEach((result, index) => {
    if (result.passed) passedCount++;
    console.log(`${result.passed ? '✓' : '✗'} Test ${index + 1}: ${result.name}`);
    if (result.details) console.log(`  ${result.details}`);
});
console.log(`\nSummary: ${passedCount}/${results.length} tests passed\n`);

// Exit with error code if any test failed
process.exit(passedCount === results.length ? 0 : 1);
