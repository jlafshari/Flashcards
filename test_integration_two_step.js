// Integration test for two-step session flow
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
const appCode = fs.readFileSync('app.js', 'utf8');
eval(appCode);

// Test runner
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

console.log('=== Two-Step Session Flow Integration Tests ===\n');

// Test 1: Initial state
console.log('Test 1: Initial state');
const app1 = new FlashcardApp();
app1.addCard('Здравей', 'Hello', 'Greetings');
app1.addCard('Довиждане', 'Goodbye', 'Greetings');
assert(app1.showingOptions === false, 'showingOptions should be false initially');
assert(app1.inSession === false, 'inSession should be false initially');
assert(app1.sessionCards.length === 0, 'sessionCards should be empty');
console.log('✅ PASSED\n');

// Test 2: First click - show options
console.log('Test 2: First click shows options');
const app2 = new FlashcardApp();
app2.addCard('Здравей', 'Hello', 'Greetings');
app2.addCard('Довиждане', 'Goodbye', 'Greetings');
app2.startSession(); // First click
assert(app2.showingOptions === true, 'showingOptions should be true after first click');
assert(app2.inSession === false, 'inSession should still be false after first click');
assert(app2.sessionCards.length === 0, 'sessionCards should still be empty after first click');
console.log('✅ PASSED\n');

// Test 3: Second click - start session
console.log('Test 3: Second click starts session');
const app3 = new FlashcardApp();
app3.addCard('Здравей', 'Hello', 'Greetings');
app3.addCard('Довиждане', 'Goodbye', 'Greetings');
app3.startSession(); // First click
app3.startSession(); // Second click
assert(app3.showingOptions === true, 'showingOptions should remain true during session');
assert(app3.inSession === true, 'inSession should be true after second click');
assert(app3.sessionCards.length === 2, 'sessionCards should have 2 cards');
assert(app3.currentCardIndex === 0, 'currentCardIndex should be 0');
console.log('✅ PASSED\n');

// Test 4: End session returns to initial state
console.log('Test 4: End session returns to initial state');
const app4 = new FlashcardApp();
app4.addCard('Здравей', 'Hello', 'Greetings');
app4.startSession(); // First click
app4.startSession(); // Second click
app4.endSession();
assert(app4.showingOptions === false, 'showingOptions should be false after end');
assert(app4.inSession === false, 'inSession should be false after end');
assert(app4.sessionCards.length === 0, 'sessionCards should be empty after end');
console.log('✅ PASSED\n');

// Test 5: No cards with selected categories
console.log('Test 5: Alert when no cards match selected categories');
const mockWindow5 = createMockWindow();
global.window = mockWindow5;
const app5 = new FlashcardApp();
app5.addCard('Здравей', 'Hello', 'Greetings');
app5.setActiveCategories(['NonExistent']); // Filter to non-existent category
app5.startSession(); // First click - show options
app5.startSession(); // Second click - should alert
const alerts = mockWindow5.getAlerts();
assert(alerts.length > 0, 'Should show alert when no cards match');
assert(alerts[0].includes('No cards'), 'Alert should mention no cards');
assert(app5.inSession === false, 'Should not start session when no cards match');
assert(app5.showingOptions === true, 'Should remain in configuration state');
console.log('✅ PASSED\n');

// Test 6: Category filtering works in session
console.log('Test 6: Category filtering in session');
const app6 = new FlashcardApp();
app6.addCard('Здравей', 'Hello', 'Greetings');
app6.addCard('Довиждане', 'Goodbye', 'Greetings');
app6.addCard('Хляб', 'Bread', 'Food');
app6.addCard('Вода', 'Water', 'Food');
app6.setActiveCategories(['Food']);
app6.startSession(); // First click
app6.startSession(); // Second click
assert(app6.sessionCards.length === 2, 'Should only have Food category cards');
assert(app6.sessionCards.every(card => card.category === 'Food'), 'All cards should be Food category');
console.log('✅ PASSED\n');

// Test 7: Direction locked during session
console.log('Test 7: Direction changes blocked during session');
const app7 = new FlashcardApp();
app7.addCard('Здравей', 'Hello', 'Greetings');
app7.direction = 'bg-en';
app7.startSession(); // First click
app7.startSession(); // Second click
app7.setDirection('en-bg'); // Try to change during session
assert(app7.direction === 'bg-en', 'Direction should not change during session');
app7.endSession();
app7.setDirection('en-bg'); // Should work now
assert(app7.direction === 'en-bg', 'Direction should change after session ends');
console.log('✅ PASSED\n');

// Test 8: Direction can change during configuration
console.log('Test 8: Direction can change during configuration');
const app8 = new FlashcardApp();
app8.addCard('Здравей', 'Hello', 'Greetings');
app8.direction = 'bg-en';
app8.startSession(); // First click - show options
assert(app8.showingOptions === true, 'Should be in configuration state');
app8.setDirection('en-bg'); // Should work during configuration
assert(app8.direction === 'en-bg', 'Direction should change during configuration');
console.log('✅ PASSED\n');

// Test 9: State values are correct throughout lifecycle
console.log('Test 9: Complete lifecycle state verification');
const app9 = new FlashcardApp();
app9.addCard('Здравей', 'Hello', 'Greetings');

// Initial
assert(app9.showingOptions === false && app9.inSession === false, 'Initial: both false');

// After first click
app9.startSession();
assert(app9.showingOptions === true && app9.inSession === false, 'Config: showingOptions true, inSession false');

// After second click
app9.startSession();
assert(app9.inSession === true, 'Active: inSession true');

// After end
app9.endSession();
assert(app9.showingOptions === false && app9.inSession === false, 'After end: both false');

console.log('✅ PASSED\n');

console.log('===========================================');
console.log('✅ All 9 integration tests PASSED!');
console.log('===========================================');
