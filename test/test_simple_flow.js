// Simple test to verify the one-step flow works
// Mock minimal browser APIs
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = value; },
    clear() { this.data = {}; }
};

const mockElement = {
    textContent: '',
    innerHTML: '',
    value: '',
    style: { display: '' },
    classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
    },
    disabled: false,
    addEventListener: () => {},
    querySelectorAll: () => []
};

global.document = {
    getElementById: () => mockElement,
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: () => mockElement
};

global.window = { alert: (msg) => console.log('ALERT:', msg) };
global.alert = (msg) => console.log('ALERT:', msg);

// Read app.js and extract the FlashcardApp class
const fs = require('fs');
const appCode = fs.readFileSync('../source/app.js', 'utf8');

// Use Function constructor to make the class available
const appFunc = new Function(appCode + '; return FlashcardApp;');
const FlashcardApp = appFunc();

console.log('=== Simple One-Step Flow Tests ===\n');

// Test 1: Initial state
console.log('Test 1: Initial state');
localStorage.clear();
const app1 = new FlashcardApp();
app1.addCard('Здравей', 'Hello', 'Greetings');
app1.addCard('Довиждане', 'Goodbye', 'Greetings');

if (app1.inSession !== false) {
    throw new Error('Should not be in session initially');
}
if (app1.sessionCards.length !== 0) {
    throw new Error('Session cards should be empty initially');
}
console.log('✅ PASSED\n');

// Test 2: Start session immediately
console.log('Test 2: Start session immediately');
localStorage.clear();
const app2 = new FlashcardApp();
app2.addCard('Здравей', 'Hello', 'Greetings');
app2.addCard('Довиждане', 'Goodbye', 'Greetings');
app2.startSession();

if (app2.inSession !== true) {
    throw new Error('Should be in session after startSession()');
}
if (app2.sessionCards.length !== 2) {
    throw new Error(`Should have 2 session cards, got ${app2.sessionCards.length}`);
}
if (app2.currentCardIndex !== 0) {
    throw new Error('Should start at index 0');
}
console.log('✅ PASSED\n');

// Test 3: End session
console.log('Test 3: End session');
app2.endSession();

if (app2.inSession !== false) {
    throw new Error('Should not be in session after endSession()');
}
if (app2.sessionCards.length !== 0) {
    throw new Error('Session cards should be cleared');
}
console.log('✅ PASSED\n');

// Test 4: No cards matching filter
console.log('Test 4: Alert when no cards match');
localStorage.clear();
const app4 = new FlashcardApp();
app4.addCard('Здравей', 'Hello', 'Greetings');
app4.setActiveCategories(['NonExistent']);
app4.startSession(); // Should show alert and not start

if (app4.inSession !== false) {
    throw new Error('Should not start session with no matching cards');
}
console.log('✅ PASSED\n');

// Test 5: Category filtering
console.log('Test 5: Category filtering');
localStorage.clear();
const app5 = new FlashcardApp();
app5.addCard('Здравей', 'Hello', 'Greetings');
app5.addCard('Хляб', 'Bread', 'Food');
app5.addCard('Вода', 'Water', 'Food');
app5.setActiveCategories(['Food']);
app5.startSession();

if (app5.sessionCards.length !== 2) {
    throw new Error(`Should have 2 Food cards, got ${app5.sessionCards.length}`);
}
if (!app5.sessionCards.every(c => c.category === 'Food')) {
    throw new Error('All cards should be Food category');
}
console.log('✅ PASSED\n');

console.log('===========================================');
console.log('✅ All 5 tests PASSED!');
console.log('===========================================');
