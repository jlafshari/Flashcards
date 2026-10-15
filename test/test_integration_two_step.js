// Integration test for one-step session flow
// Run with: node test_integration_two_step.js

// Mock DOM and browser APIs
const createMockDocument = () => {
    const elements = new Map();
    
    return {
        getElementById: (id) => {
            if (!elements.has(id)) {
                elements.set(id, {
                    textContent: '',
                    innerHTML: '',
                    value: '',
                    style: { display: '' },
                    classList: {
                        add: function() {},
                        remove: function() {},
                        toggle: function() {},
                        contains: function() { return false; }
                    },
                    disabled: false,
                    addEventListener: function() {},
                    querySelectorAll: function() { return []; }
                });
            }
            return elements.get(id);
        },
        querySelectorAll: () => [],
        addEventListener: () => {},
        createElement: () => ({ 
            textContent: '', 
            innerHTML: '',
            addEventListener: () => {}
        })
    };
};

const createMockWindow = () => {
    const alerts = [];
    return {
        alert: (msg) => alerts.push(msg),
        getAlerts: () => alerts
    };
};

const createMockLocalStorage = () => {
    const data = {};
    return {
        getItem: (key) => data[key] || null,
        setItem: (key, value) => { data[key] = value; },
        removeItem: (key) => { delete data[key]; },
        clear: () => Object.keys(data).forEach(k => delete data[k])
    };
};

// Setup global mocks
global.document = createMockDocument();
global.window = createMockWindow();
global.localStorage = createMockLocalStorage();

// Load the app
const fs = require('fs');
const appCode = fs.readFileSync('../app.js', 'utf8');
eval(appCode);

// Test runner
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

console.log('=== One-Step Session Flow Integration Tests ===\n');

// Test 1: Initial state
console.log('Test 1: Initial state');
const app1 = new FlashcardApp();
app1.addCard('Здравей', 'Hello', 'Greetings');
app1.addCard('Довиждане', 'Goodbye', 'Greetings');
assert(app1.inSession === false, 'inSession should be false initially');
assert(app1.sessionCards.length === 0, 'sessionCards should be empty');
console.log('✅ PASSED\n');

// Test 2: Start session immediately
console.log('Test 2: Start session immediately');
const app2 = new FlashcardApp();
app2.addCard('Здравей', 'Hello', 'Greetings');
app2.addCard('Довиждане', 'Goodbye', 'Greetings');
app2.startSession();
assert(app2.inSession === true, 'inSession should be true after click');
assert(app2.sessionCards.length === 2, 'sessionCards should have 2 cards');
assert(app2.currentCardIndex === 0, 'currentCardIndex should be 0');
console.log('✅ PASSED\n');

// Test 3: (Removed - no longer applicable)

// Test 4: End session returns to initial state
console.log('Test 3: End session returns to initial state');
const app3 = new FlashcardApp();
app3.addCard('Здравей', 'Hello', 'Greetings');
app3.startSession();
app3.endSession();
assert(app3.inSession === false, 'inSession should be false after end');
assert(app3.sessionCards.length === 0, 'sessionCards should be empty after end');
console.log('✅ PASSED\n');

// Test 5: No cards with selected categories
console.log('Test 4: Alert when no cards match selected categories');
const mockWindow4 = createMockWindow();
global.window = mockWindow4;
const app4 = new FlashcardApp();
app4.addCard('Здравей', 'Hello', 'Greetings');
app4.setActiveCategories(['NonExistent']); // Filter to non-existent category
app4.startSession(); // Should alert
const alerts = mockWindow4.getAlerts();
assert(alerts.length > 0, 'Should show alert when no cards match');
assert(alerts[0].includes('No cards'), 'Alert should mention no cards');
assert(app4.inSession === false, 'Should not start session when no cards match');
console.log('✅ PASSED\n');

// Test 6: Category filtering works in session
console.log('Test 5: Category filtering in session');
const app5 = new FlashcardApp();
app5.addCard('Здравей', 'Hello', 'Greetings');
app5.addCard('Довиждане', 'Goodbye', 'Greetings');
app5.addCard('Хляб', 'Bread', 'Food');
app5.addCard('Вода', 'Water', 'Food');
app5.setActiveCategories(['Food']);
app5.startSession();
assert(app5.sessionCards.length === 2, 'Should only have Food category cards');
assert(app5.sessionCards.every(card => card.category === 'Food'), 'All cards should be Food category');
console.log('✅ PASSED\n');

// Test 7: Direction locked during session
console.log('Test 6: Direction changes blocked during session');
const app6 = new FlashcardApp();
app6.addCard('Здравей', 'Hello', 'Greetings');
app6.direction = 'bg-en';
app6.startSession();
app6.setDirection('en-bg'); // Try to change during session
assert(app6.direction === 'bg-en', 'Direction should not change during session');
app6.endSession();
app6.setDirection('en-bg'); // Should work now
assert(app6.direction === 'en-bg', 'Direction should change after session ends');
console.log('✅ PASSED\n');

// Test 8: Direction can change before session
console.log('Test 7: Direction can change before session');
const app7 = new FlashcardApp();
app7.addCard('Здравей', 'Hello', 'Greetings');
app7.direction = 'bg-en';
app7.setDirection('en-bg'); // Should work before session
assert(app7.direction === 'en-bg', 'Direction should change before session');
console.log('✅ PASSED\n');

// Test 9: State values are correct throughout lifecycle
console.log('Test 8: Complete lifecycle state verification');
const app8 = new FlashcardApp();
app8.addCard('Здравей', 'Hello', 'Greetings');

// Initial
assert(app8.inSession === false, 'Initial: inSession false');

// After start
app8.startSession();
assert(app8.inSession === true, 'Active: inSession true');

// After end
app8.endSession();
assert(app8.inSession === false, 'After end: inSession false');

console.log('✅ PASSED\n');

console.log('===========================================');
console.log('✅ All 8 integration tests PASSED!');
console.log('===========================================');
