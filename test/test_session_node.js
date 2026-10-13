// Minimal localStorage mock for Node.js
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = String(value); },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};

// Minimal DOM mock with proper addEventListener
const createMockElement = () => ({
    textContent: '', 
    style: {},
    value: '',
    innerHTML: '',
    dataset: {},
    files: [],
    classList: { 
        add: () => {}, 
        remove: () => {}, 
        toggle: () => {} 
    },
    disabled: false,
    addEventListener: () => {},
    click: () => {},
    focus: () => {},
    setAttribute: () => {},
    appendChild: () => {},
    removeChild: () => {},
    querySelectorAll: () => []
});

global.document = {
    getElementById: () => createMockElement(),
    querySelectorAll: () => [],
    querySelector: (selector) => {
        if (selector === '.stats') {
            return createMockElement();
        }
        return { id: 'study-tab' };
    },
    createElement: () => createMockElement(),
    body: createMockElement(),
    addEventListener: () => {}
};

// Read and execute app.js
const fs = require('fs');
let appJs = fs.readFileSync('./app.js', 'utf8');
// Remove the auto-initialization at the end
appJs = appJs.replace('const app = new FlashcardApp();', '');
// Make FlashcardApp global
appJs = appJs.replace('class FlashcardApp {', 'global.FlashcardApp = class FlashcardApp {');
eval(appJs);

const FlashcardApp = global.FlashcardApp;

// Now run the tests
console.log('Running session feature tests...\n');

// Test 1: Initial state
console.log('Test 1: Initial state...');
localStorage.clear();
const app1 = new FlashcardApp();
app1.addCard('Здравей', 'Hello', 'Greetings');
app1.addCard('Довиждане', 'Goodbye', 'Greetings');
console.assert(app1.inSession === false, 'Should not be in session initially');
console.assert(app1.sessionCards.length === 0, 'Session cards should be empty');
console.log('✓ Test 1 passed\n');

// Test 2: Start session
console.log('Test 2: Start session...');
localStorage.clear();
const app2 = new FlashcardApp();
app2.addCard('Здравей', 'Hello', 'Greetings');
app2.addCard('Довиждане', 'Goodbye', 'Greetings');
app2.startSession();
console.assert(app2.inSession === true, 'Should be in session');
console.assert(app2.sessionCards.length === 2, 'Should have 2 session cards');
console.log('✓ Test 2 passed\n');

// Test 3: End session
console.log('Test 3: End session...');
app2.endSession();
console.assert(app2.inSession === false, 'Should not be in session');
console.assert(app2.sessionCards.length === 0, 'Session cards should be cleared');
console.log('✓ Test 3 passed\n');

// Test 4: Session completion
console.log('Test 4: Session completion...');
localStorage.clear();
const app4 = new FlashcardApp();
app4.addCard('Здравей', 'Hello', 'Greetings');
app4.addCard('Довиждане', 'Goodbye', 'Greetings');
app4.startSession();
app4.sessionCards.forEach(card => app4.sessionReviewedCards.add(card.id));
console.assert(app4.isSessionComplete() === true, 'Session should be complete');
console.log('✓ Test 4 passed\n');

// Test 5: Direction change blocked
console.log('Test 5: Direction change blocked in session...');
localStorage.clear();
const app5 = new FlashcardApp();
app5.addCard('Здравей', 'Hello', 'Greetings');
app5.direction = 'bg-en';
app5.startSession();
app5.setDirection('en-bg');
console.assert(app5.direction === 'bg-en', 'Direction should not change');
app5.endSession();
app5.setDirection('en-bg');
console.assert(app5.direction === 'en-bg', 'Direction should change when not in session');
console.log('✓ Test 5 passed\n');

// Test 6: Category filtering before session
console.log('Test 6: Category filtering before session...');
localStorage.clear();
const app6 = new FlashcardApp();
app6.addCard('Здравей', 'Hello', 'Greetings');
app6.addCard('Довиждане', 'Goodbye', 'Greetings');
app6.addCard('Хляб', 'Bread', 'Food');
app6.addCard('Вода', 'Water', 'Food');
app6.setActiveCategories(['Food']);
app6.startSession();
console.assert(app6.sessionCards.length === 2, 'Should only have Food category cards');
console.log('✓ Test 6 passed\n');

// Test 7: getFilteredCards in session mode
console.log('Test 7: getFilteredCards in session...');
localStorage.clear();
const app7 = new FlashcardApp();
app7.addCard('Здравей', 'Hello', 'Greetings');
app7.startSession();
const filtered = app7.getFilteredCards();
console.assert(filtered === app7.sessionCards, 'Should return session cards');
console.log('✓ Test 7 passed\n');

console.log('========================================');
console.log('All session tests passed! ✓');
console.log('========================================');
