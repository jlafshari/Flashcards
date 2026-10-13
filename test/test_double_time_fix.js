// Test to verify double time counting bug is fixed
// This test verifies that completing a session only counts time once

// Minimal localStorage mock
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = String(value); },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};

// Minimal DOM mock
const createMockElement = () => ({
    textContent: '', 
    style: {},
    value: '',
    innerHTML: '',
    dataset: {},
    files: [],
    checked: false,
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

global.alert = () => {};
global.confirm = () => true;
global.FileReader = class {
    readAsText() {}
};
global.Blob = class {};
global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };

// Load the app
const fs = require('fs');
let appJs = fs.readFileSync('../source/app.js', 'utf8');
// Remove the auto-initialization at the end
appJs = appJs.replace('const app = new FlashcardApp();', '');
// Make FlashcardApp global
appJs = appJs.replace('class FlashcardApp {', 'global.FlashcardApp = class FlashcardApp {');
eval(appJs);

const FlashcardApp = global.FlashcardApp;

console.log('\n=== Double Time Counting Bug Fix Test ===\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`✓ ${description}`);
        passed++;
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
        failed++;
    }
}

// Test 1: Verify showSessionComplete doesn't add time (endSession does)
test('showSessionComplete should only calculate time for display', () => {
    global.localStorage.clear();
    const app = new FlashcardApp();
    
    // Add cards
    app.addCard('Здравей', 'Hello', 'Greetings');
    app.addCard('Благодаря', 'Thank you', 'Greetings');
    
    // Start session
    app.startSession();
    
    // Set start time to 5 seconds ago
    app.sessionStartTime = Date.now() - 5000;
    
    // Mark all cards as reviewed
    app.sessionCards.forEach(card => {
        app.sessionReviewedCards.add(card.id);
    });
    
    // Verify initial state
    const initialTime = app.totalTimeToday;
    if (initialTime !== 0) {
        throw new Error(`Expected initial time to be 0, got ${initialTime}`);
    }
    
    // Complete the session (this calls showSessionComplete which calls endSession)
    app.showSessionComplete();
    
    // Verify time was added only ONCE (approximately 5 seconds)
    const finalTime = app.totalTimeToday;
    if (finalTime < 4 || finalTime > 6) {
        throw new Error(`Expected time around 5 seconds, got ${finalTime}`);
    }
    
    // Verify time was saved to localStorage
    const savedTime = parseInt(global.localStorage.getItem('totalTimeToday'));
    if (savedTime !== finalTime) {
        throw new Error(`Time not saved correctly: ${savedTime} vs ${finalTime}`);
    }
});

// Test 2: Verify endSession adds time correctly when called directly
test('endSession should add time when called directly (manual end)', () => {
    global.localStorage.clear();
    const app = new FlashcardApp();
    
    // Add cards
    app.addCard('Добър ден', 'Good day', 'Greetings');
    
    // Start session
    app.startSession();
    
    // Set start time to 3 seconds ago
    app.sessionStartTime = Date.now() - 3000;
    
    // End session manually (user clicks End Session button)
    app.endSession();
    
    // Verify time was added (approximately 3 seconds)
    const finalTime = app.totalTimeToday;
    if (finalTime < 2 || finalTime > 4) {
        throw new Error(`Expected time around 3 seconds, got ${finalTime}`);
    }
});

// Test 3: Verify no double counting across multiple operations
test('Multiple session completions should not double count', () => {
    global.localStorage.clear();
    const app = new FlashcardApp();
    
    // Add cards
    app.addCard('Да', 'Yes', 'Common');
    app.addCard('Не', 'No', 'Common');
    
    // First session - complete naturally
    app.startSession();
    app.sessionStartTime = Date.now() - 2000;
    app.sessionCards.forEach(card => {
        app.sessionReviewedCards.add(card.id);
    });
    app.showSessionComplete();
    
    const timeAfterFirst = app.totalTimeToday;
    if (timeAfterFirst < 1 || timeAfterFirst > 3) {
        throw new Error(`First session: Expected ~2 seconds, got ${timeAfterFirst}`);
    }
    
    // Second session - end manually
    app.startSession();
    app.sessionStartTime = Date.now() - 3000;
    app.endSession();
    
    const timeAfterSecond = app.totalTimeToday;
    const expectedTotal = timeAfterFirst + 3;
    if (timeAfterSecond < expectedTotal - 1 || timeAfterSecond > expectedTotal + 1) {
        throw new Error(`Second session: Expected ~${expectedTotal} total, got ${timeAfterSecond}`);
    }
});

console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✓ All tests passed! Time is counted exactly once.\n');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed!\n');
    process.exit(1);
}
