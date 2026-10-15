// Test for UI bug fixes: direction button state and filtered card count
const fs = require('fs');

// Mock DOM
const mockElements = {};
const statsSection = {
    textContent: '',
    value: '',
    innerHTML: '',
    style: { display: '' },
    classList: {
        states: {},
        add: function(className) { this.states[className] = true; },
        remove: function(className) { this.states[className] = false; },
        toggle: function(className, force) {
            if (force !== undefined) {
                this.states[className] = force;
            } else {
                this.states[className] = !this.states[className];
            }
        }
    },
    disabled: false,
    dataset: {},
    addEventListener: () => {},
    querySelectorAll: () => []
};

global.document = {
    getElementById: (id) => {
        if (!mockElements[id]) {
            mockElements[id] = {
                textContent: '',
                value: '',
                innerHTML: '',
                style: { display: '' },
                classList: {
                    states: {},
                    add: function(className) { this.states[className] = true; },
                    remove: function(className) { this.states[className] = false; },
                    toggle: function(className, force) {
                        if (force !== undefined) {
                            this.states[className] = force;
                        } else {
                            this.states[className] = !this.states[className];
                        }
                    }
                },
                disabled: false,
                dataset: {},
                addEventListener: () => {},
                querySelectorAll: () => []
            };
        }
        return mockElements[id];
    },
    querySelector: (selector) => {
        if (selector === '.stats') {
            return statsSection;
        }
        return null;
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: (tag) => ({
        textContent: '',
        innerHTML: '',
        appendChild: () => {},
        setAttribute: () => {},
        getAttribute: () => null
    })
};

global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = value; },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};

global.window = { alert: () => {} };

// Load the app
const appCode = fs.readFileSync('../app.js', 'utf-8')
    .replace(/\nconst app = new FlashcardApp\(\);?\s*$/, '')
    .replace('class FlashcardApp', 'global.FlashcardApp = class FlashcardApp');

eval(appCode);
const FlashcardApp = global.FlashcardApp;

console.log('=== UI Bug Fixes Test ===\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log('✓', message);
        testsPassed++;
    } else {
        console.log('✗', message);
        testsFailed++;
    }
}

// Test 1: Direction button shows active state when not in session
console.log('Test 1: Direction button active state (not in session)');
localStorage.clear();
const app1 = new FlashcardApp();
app1.cards = [
    { id: 1, bulgarian: 'Здравей', english: 'Hello', category: 'Greetings' },
    { id: 2, bulgarian: 'Довиждане', english: 'Goodbye', category: 'Greetings' }
];

// Initially direction should be 'bg-en'
app1.updateUI();
const bgEnBtn1 = document.getElementById('direction-bg-en');
const enBgBtn1 = document.getElementById('direction-en-bg');
assert(bgEnBtn1.classList.states['active'] === true, 'Bulgarian → English button is active initially');
assert(enBgBtn1.classList.states['active'] === false, 'English → Bulgarian button is not active initially');

// Change direction to 'en-bg'
app1.setDirection('en-bg');
assert(bgEnBtn1.classList.states['active'] === false, 'Bulgarian → English button is not active after change');
assert(enBgBtn1.classList.states['active'] === true, 'English → Bulgarian button is active after change');

console.log('');

// Test 2: Total cards count shows filtered count when not in session
console.log('Test 2: Total cards count shows filtered count (not in session)');
localStorage.clear();
const app2 = new FlashcardApp();
app2.cards = [
    { id: 1, bulgarian: 'Здравей', english: 'Hello', category: 'Greetings' },
    { id: 2, bulgarian: 'Довиждане', english: 'Goodbye', category: 'Greetings' },
    { id: 3, bulgarian: 'Хляб', english: 'Bread', category: 'Food' },
    { id: 4, bulgarian: 'Вода', english: 'Water', category: 'Food' }
];

// No filter - should show all 4 cards
app2.updateUI();
const totalCardsEl1 = document.getElementById('total-cards');
assert(totalCardsEl1.textContent == '4', `Total cards shows 4 when no filter applied (actual: ${totalCardsEl1.textContent})`);

// Filter by 'Greetings' category - should show 2 cards
app2.activeCategories = ['Greetings'];
app2.updateUI();
assert(totalCardsEl1.textContent == '2', `Total cards shows 2 when filtered by Greetings category (actual: ${totalCardsEl1.textContent})`);

// Filter by 'Food' category - should show 2 cards
app2.activeCategories = ['Food'];
app2.updateUI();
assert(totalCardsEl1.textContent == '2', `Total cards shows 2 when filtered by Food category (actual: ${totalCardsEl1.textContent})`);

// Filter by both categories - should show 4 cards
app2.activeCategories = ['Greetings', 'Food'];
app2.updateUI();
assert(totalCardsEl1.textContent == '4', `Total cards shows 4 when both categories selected (actual: ${totalCardsEl1.textContent})`);

console.log('');

// Test 3: Total cards count shows filtered count even when in session
console.log('Test 3: Total cards count shows filtered count (in session)');
localStorage.clear();
const app3 = new FlashcardApp();
app3.cards = [
    { id: 1, bulgarian: 'Здравей', english: 'Hello', category: 'Greetings' },
    { id: 2, bulgarian: 'Довиждане', english: 'Goodbye', category: 'Greetings' },
    { id: 3, bulgarian: 'Хляб', english: 'Bread', category: 'Food' },
    { id: 4, bulgarian: 'Вода', english: 'Water', category: 'Food' }
];

// Filter by 'Greetings' and start session
app3.activeCategories = ['Greetings'];
app3.startSession();
const totalCardsEl2 = document.getElementById('total-cards');
assert(totalCardsEl2.textContent == '2', `Total cards shows filtered count (2) when in session with Greetings filter (actual: ${totalCardsEl2.textContent})`);

console.log('');

// Test 3b: Total cards count shows filtered count even with card limit
console.log('Test 3b: Total cards count shows filtered count (with card limit)');
localStorage.clear();
const app3b = new FlashcardApp();
app3b.cards = [
    { id: 1, bulgarian: 'Здравей', english: 'Hello', category: '' },
    { id: 2, bulgarian: 'Довиждане', english: 'Goodbye', category: '' },
    { id: 3, bulgarian: 'Хляб', english: 'Bread', category: '' },
    { id: 4, boolean: 'Вода', english: 'Water', category: '' },
    { id: 5, bulgarian: 'Млеко', english: 'Milk', category: '' },
    { id: 6, bulgarian: 'Сирене', english: 'Cheese', category: '' },
    { id: 7, bulgarian: 'Масло', english: 'Butter', category: '' },
    { id: 8, bulgarian: 'Яйце', english: 'Egg', category: '' },
    { id: 9, bulgarian: 'Захар', english: 'Sugar', category: '' },
    { id: 10, bulgarian: 'Сол', english: 'Salt', category: '' }
];

// Set card limit to 3 and start session
app3b.cardLimit = 3;
app3b.startSession();
const totalCardsEl3 = document.getElementById('total-cards');
// Should show 10 (total filtered cards), not 3 (session limit)
assert(totalCardsEl3.textContent == '10', `Total cards shows filtered count (10) even when session limited to 3 cards (actual: ${totalCardsEl3.textContent})`);
assert(app3b.sessionCards.length == 3, `Session has 3 cards as per limit (actual: ${app3b.sessionCards.length})`);

console.log('');

// Test 4: Direction button state persists across updateUI calls when not in session
console.log('Test 4: Direction button state persists across updateUI calls');
localStorage.clear();
const app4 = new FlashcardApp();
app4.cards = [
    { id: 1, bulgarian: 'Здравей', english: 'Hello', category: 'Greetings' }
];
app4.setDirection('en-bg');

// Call updateUI multiple times
app4.updateUI();
app4.updateUI();
app4.updateUI();

const bgEnBtn2 = document.getElementById('direction-bg-en');
const enBgBtn2 = document.getElementById('direction-en-bg');
assert(bgEnBtn2.classList.states['active'] === false, 'Bulgarian → English button stays inactive after multiple updateUI calls');
assert(enBgBtn2.classList.states['active'] === true, 'English → Bulgarian button stays active after multiple updateUI calls');

console.log('');

console.log('=== Test Results ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log('');

if (testsFailed === 0) {
    console.log('✅ All tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some tests failed');
    process.exit(1);
}
