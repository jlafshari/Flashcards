// Test: Stats Section Visibility During Session
// Verifies that the stats section (Total Cards and Reviewed Today) is hidden during an active session

const fs = require('fs');

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

// Track stats section to verify visibility changes
let statsSection = createMockElement();

global.document = {
    getElementById: () => createMockElement(),
    querySelectorAll: () => [],
    querySelector: (selector) => {
        if (selector === '.stats') {
            return statsSection;
        }
        return { id: 'study-tab' };
    },
    createElement: () => createMockElement(),
    body: createMockElement(),
    addEventListener: () => {}
};

// Read and execute app.js
let appJs = fs.readFileSync('../source/app.js', 'utf8');
// Remove the auto-initialization at the end
appJs = appJs.replace('const app = new FlashcardApp();', '');
// Make FlashcardApp global
appJs = appJs.replace('class FlashcardApp {', 'global.FlashcardApp = class FlashcardApp {');
eval(appJs);

const FlashcardApp = global.FlashcardApp;

// Now run the tests
console.log('Stats Section Visibility Tests');
console.log('================================\n');

// Test 1: Stats section is visible before session starts
console.log('Test 1: Stats section is visible before session starts');
localStorage.clear();
statsSection = createMockElement();
const app1 = new FlashcardApp();
app1.addCard('здравей', 'hello', 'Greetings');
app1.addCard('довиждане', 'goodbye', 'Greetings');
app1.addCard('благодаря', 'thank you', 'Greetings');
app1.updateStudyTab();
console.assert(statsSection.style.display === 'flex', `Stats section should be visible (got display: ${statsSection.style.display})`);
console.log('✓ Test 1 passed\n');

// Test 2: Stats section is hidden during active session
console.log('Test 2: Stats section is hidden during active session');
localStorage.clear();
statsSection = createMockElement();
const app2 = new FlashcardApp();
app2.addCard('здравей', 'hello', 'Greetings');
app2.addCard('довиждане', 'goodbye', 'Greetings');
app2.addCard('благодаря', 'thank you', 'Greetings');
app2.startSession();
app2.updateStudyTab();
console.assert(statsSection.style.display === 'none', `Stats section should be hidden (got display: ${statsSection.style.display})`);
console.log('✓ Test 2 passed\n');

// Test 3: Stats section is visible again after session ends
console.log('Test 3: Stats section is visible again after session ends');
localStorage.clear();
statsSection = createMockElement();
const app3 = new FlashcardApp();
app3.addCard('здравей', 'hello', 'Greetings');
app3.addCard('довиждане', 'goodbye', 'Greetings');
app3.addCard('благодаря', 'thank you', 'Greetings');
app3.startSession();
app3.updateStudyTab();
app3.endSession();
console.assert(statsSection.style.display === 'flex', `Stats section should be visible after session ends (got display: ${statsSection.style.display})`);
console.log('✓ Test 3 passed\n');

// Test 4: Stats section is visible when no cards exist
console.log('Test 4: Stats section is visible when no cards exist');
localStorage.clear();
statsSection = createMockElement();
const app4 = new FlashcardApp();
app4.updateStudyTab();
console.assert(statsSection.style.display === 'flex', `Stats section should be visible when no cards exist (got display: ${statsSection.style.display})`);
console.log('✓ Test 4 passed\n');

// Test 5: Stats section is hidden during session with card limit
console.log('Test 5: Stats section is hidden during session with card limit');
localStorage.clear();
statsSection = createMockElement();
const app5 = new FlashcardApp();
for (let i = 1; i <= 10; i++) {
    app5.addCard(`word${i}`, `translation${i}`, 'Test');
}
app5.cardLimit = 3;
app5.startSession();
app5.updateStudyTab();
console.assert(statsSection.style.display === 'none', `Stats section should be hidden during session with card limit (got display: ${statsSection.style.display})`);
console.log('✓ Test 5 passed\n');

console.log('================================');
console.log('All tests passed!');
