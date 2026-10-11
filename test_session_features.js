// Node.js tests for session features: timer, shuffle, and card limit
// Run with: node test_session_features.js

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
    removeChild: () => {}
});

global.document = {
    getElementById: () => createMockElement(),
    querySelectorAll: () => [],
    querySelector: () => ({ id: 'study-tab' }),
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
global.URL = { createObjectURL: () => '' };

// Load the app
const fs = require('fs');
let appJs = fs.readFileSync('./app.js', 'utf8');
// Remove the auto-initialization at the end
appJs = appJs.replace('const app = new FlashcardApp();', '');
// Make FlashcardApp global
appJs = appJs.replace('class FlashcardApp {', 'global.FlashcardApp = class FlashcardApp {');
eval(appJs);

const FlashcardApp = global.FlashcardApp;

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        console.log(`✓ ${message}`);
        testsPassed++;
        return true;
    } else {
        console.log(`✗ ${message}`);
        console.log(`  Expected: ${JSON.stringify(expected)}`);
        console.log(`  Actual: ${JSON.stringify(actual)}`);
        testsFailed++;
        return false;
    }
}

function assertTrue(condition, message) {
    return assertEquals(condition, true, message);
}

function assertFalse(condition, message) {
    return assertEquals(condition, false, message);
}

function clearStorage() {
    localStorage.clear();
}

console.log('\n=== Session Features Tests ===\n');

// Test 1: Session timer tracking
console.log('Test 1: Session timer tracking');
clearStorage();
const app1 = new FlashcardApp();
app1.cards = [
    { id: 1, bulgarian: 'здравей', english: 'hello', category: '' },
    { id: 2, bulgarian: 'довиждане', english: 'goodbye', category: '' }
];
app1.startSession();
assertTrue(app1.sessionStartTime !== null, 'Session start time should be recorded');
assertTrue(app1.sessionStartTime > 0, 'Session start time should be a valid timestamp');
const startTime = app1.sessionStartTime;
setTimeout(() => {
    const elapsed = Date.now() - startTime;
    assertTrue(elapsed >= 0, 'Elapsed time should be non-negative');
}, 10);

// Test 2: Format time helper
console.log('\nTest 2: Format time helper');
clearStorage();
const app2 = new FlashcardApp();
assertEquals(app2.formatTime(30), '30 sec', 'Should format seconds under 60');
assertEquals(app2.formatTime(60), '1 min', 'Should format exactly 60 seconds');
assertEquals(app2.formatTime(90), '1 min 30 sec', 'Should format minutes and seconds');
assertEquals(app2.formatTime(3600), '1 hr', 'Should format exactly 1 hour');
assertEquals(app2.formatTime(3660), '1 hr 1 min', 'Should format hours and minutes');
assertEquals(app2.formatTime(0), '0 sec', 'Should handle 0 seconds');

// Test 3: Total time today accumulation
console.log('\nTest 3: Total time today accumulation');
clearStorage();
const today = new Date().toDateString();
localStorage.setItem('reviewDate', today);
localStorage.setItem('totalTimeToday', '120'); // 2 minutes
const app3 = new FlashcardApp();
assertEquals(app3.totalTimeToday, 120, 'Should load existing total time');
app3.cards = [{ id: 1, bulgarian: 'тест', english: 'test', category: '' }];
app3.startSession();
app3.sessionStartTime = Date.now() - 30000; // Simulate 30 seconds ago
app3.showSessionComplete();
assertTrue(app3.totalTimeToday >= 150, 'Should add session time to total');

// Test 4: Daily time reset
console.log('\nTest 4: Daily time reset');
clearStorage();
const yesterday = new Date(Date.now() - 86400000).toDateString();
localStorage.setItem('reviewDate', yesterday);
localStorage.setItem('totalTimeToday', '300');
const app4 = new FlashcardApp();
assertEquals(app4.totalTimeToday, 0, 'Should reset time for new day');

// Test 5: Shuffle functionality
console.log('\nTest 5: Shuffle functionality');
clearStorage();
const app5 = new FlashcardApp();
const original = [
    { id: 1, bulgarian: 'а', english: 'a', category: '' },
    { id: 2, bulgarian: 'б', english: 'b', category: '' },
    { id: 3, bulgarian: 'в', english: 'c', category: '' },
    { id: 4, bulgarian: 'г', english: 'd', category: '' },
    { id: 5, bulgarian: 'д', english: 'e', category: '' }
];
const shuffled = app5.shuffleArray(original);
assertEquals(shuffled.length, original.length, 'Shuffled array should have same length');
assertTrue(original.every(card => shuffled.includes(card)), 'Shuffled array should contain all original cards');
// Note: There's a tiny chance shuffle returns same order, but with 5 cards it's unlikely

// Test 6: Shuffle enabled in session
console.log('\nTest 6: Shuffle enabled in session');
clearStorage();
const app6 = new FlashcardApp();
app6.cards = [
    { id: 1, bulgarian: 'а', english: 'a', category: '' },
    { id: 2, bulgarian: 'б', english: 'b', category: '' },
    { id: 3, bulgarian: 'в', english: 'c', category: '' }
];
app6.shuffleEnabled = true;
app6.startSession();
assertEquals(app6.sessionCards.length, 3, 'Should have all cards in session');
assertTrue(app6.sessionCards.every(card => app6.cards.includes(card)), 'Session should contain all original cards');

// Test 7: Card limit application
console.log('\nTest 7: Card limit application');
clearStorage();
const app7 = new FlashcardApp();
app7.cards = [
    { id: 1, bulgarian: 'а', english: 'a', category: '' },
    { id: 2, brasileiro: 'б', english: 'b', category: '' },
    { id: 3, bulgarian: 'в', english: 'c', category: '' },
    { id: 4, bulgarian: 'г', english: 'd', category: '' },
    { id: 5, bulgarian: 'д', english: 'e', category: '' }
];
app7.cardLimit = 3;
app7.startSession();
assertEquals(app7.sessionCards.length, 3, 'Should limit session to 3 cards');

// Test 8: Card limit with shuffle
console.log('\nTest 8: Card limit with shuffle');
clearStorage();
const app8 = new FlashcardApp();
app8.cards = [
    { id: 1, bulgarian: 'а', english: 'a', category: '' },
    { id: 2, bulgarian: 'б', english: 'b', category: '' },
    { id: 3, bulgarian: 'в', english: 'c', category: '' },
    { id: 4, bulgarian: 'г', english: 'd', category: '' },
    { id: 5, bulgarian: 'д', english: 'e', category: '' }
];
app8.cardLimit = 2;
app8.shuffleEnabled = true;
app8.startSession();
assertEquals(app8.sessionCards.length, 2, 'Should limit to 2 cards even with shuffle');

// Test 9: Save and load shuffle preference
console.log('\nTest 9: Save and load shuffle preference');
clearStorage();
const app9a = new FlashcardApp();
app9a.shuffleEnabled = true;
app9a.saveSessionPreferences();
const app9b = new FlashcardApp();
assertEquals(app9b.shuffleEnabled, true, 'Should load shuffle preference');

// Test 10: Save and load card limit preference
console.log('\nTest 10: Save and load card limit preference');
clearStorage();
const app10a = new FlashcardApp();
app10a.cardLimit = 5;
app10a.saveSessionPreferences();
const app10b = new FlashcardApp();
assertEquals(app10b.cardLimit, 5, 'Should load card limit preference');

// Test 11: Card limit null handling
console.log('\nTest 11: Card limit null handling');
clearStorage();
const app11 = new FlashcardApp();
app11.cards = [
    { id: 1, bulgarian: 'а', english: 'a', category: '' },
    { id: 2, bulgarian: 'б', english: 'b', category: '' }
];
app11.cardLimit = null;
app11.startSession();
assertEquals(app11.sessionCards.length, 2, 'Should use all cards when limit is null');

// Test 12: Card limit exceeding available cards
console.log('\nTest 12: Card limit exceeding available cards');
clearStorage();
const app12 = new FlashcardApp();
app12.cards = [
    { id: 1, bulgarian: 'а', english: 'a', category: '' },
    { id: 2, bulgarian: 'б', english: 'b', category: '' }
];
app12.cardLimit = 10;
app12.startSession();
assertEquals(app12.sessionCards.length, 2, 'Should use all available cards when limit exceeds count');

// Test 13: Shuffle preserves original array
console.log('\nTest 13: Shuffle preserves original array');
clearStorage();
const app13 = new FlashcardApp();
const original13 = [
    { id: 1, bulgarian: 'а', english: 'a', category: '' },
    { id: 2, bulgarian: 'б', english: 'b', category: '' }
];
app13.cards = [...original13];
app13.shuffleEnabled = true;
app13.startSession();
assertEquals(app13.cards.length, original13.length, 'Original cards array should not be modified');
assertTrue(app13.cards[0].id === 1 || app13.cards[0].id === 2, 'Original cards should still exist');

// Test 14: Session timer cleared on end
console.log('\nTest 14: Session timer cleared on end');
clearStorage();
const app14 = new FlashcardApp();
app14.cards = [{ id: 1, bulgarian: 'тест', english: 'test', category: '' }];
app14.startSession();
assertTrue(app14.sessionStartTime !== null, 'Session start time should be set');
app14.endSession();
assertEquals(app14.sessionStartTime, null, 'Session start time should be cleared');

// Test 15: Time format for very short sessions
console.log('\nTest 15: Time format for very short sessions');
clearStorage();
const app15 = new FlashcardApp();
assertEquals(app15.formatTime(1), '1 sec', 'Should handle 1 second');
assertEquals(app15.formatTime(59), '59 sec', 'Should handle 59 seconds');

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
} else {
    console.log(`\n✗ ${testsFailed} test(s) failed`);
    process.exit(1);
}
