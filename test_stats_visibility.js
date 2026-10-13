// Test: Stats Section Visibility During Session
// Verifies that the stats section (Total Cards and Reviewed Today) is hidden during an active session

const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read the HTML and JavaScript files
const html = fs.readFileSync('index.html', 'utf-8');
const appJs = fs.readFileSync('app.js', 'utf-8');

// Create a DOM environment
const dom = new JSDOM(html, { runScripts: 'outside-only' });
const { window } = dom;
const { document } = window;

// Make necessary globals available
global.window = window;
global.document = document;
global.localStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    },
    clear() {
        this.data = {};
    }
};

// Execute the app code
eval(appJs);

// Test suite
let passed = 0;
let failed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`✓ ${description}`);
        passed++;
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  ${error.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
}

// Clear localStorage before tests
localStorage.clear();

console.log('Stats Section Visibility Tests');
console.log('================================\n');

// Test 1: Stats section is visible before session starts
test('Stats section is visible before session starts', () => {
    const app = new FlashcardApp();
    
    // Add some test cards
    app.addCard('здравей', 'hello', 'Greetings');
    app.addCard('довиждане', 'goodbye', 'Greetings');
    app.addCard('благодаря', 'thank you', 'Greetings');
    
    // Update the study tab (not in session)
    app.updateStudyTab();
    
    const statsSection = document.querySelector('.stats');
    assert(statsSection, 'Stats section should exist');
    
    const displayStyle = window.getComputedStyle(statsSection).display;
    // In JSDOM, we check the inline style since computed styles may not work exactly like browsers
    assert(statsSection.style.display !== 'none', `Stats section should be visible (display: ${statsSection.style.display || 'default'})`);
});

// Test 2: Stats section is hidden during active session
test('Stats section is hidden during active session', () => {
    const app = new FlashcardApp();
    
    // Add some test cards
    app.addCard('здравей', 'hello', 'Greetings');
    app.addCard('довиждане', 'goodbye', 'Greetings');
    app.addCard('благодаря', 'thank you', 'Greetings');
    
    // Start a session
    app.startSession();
    
    // Update the study tab (in session)
    app.updateStudyTab();
    
    const statsSection = document.querySelector('.stats');
    assert(statsSection, 'Stats section should exist');
    
    assertEquals(statsSection.style.display, 'none', 'Stats section should be hidden during session');
});

// Test 3: Stats section is visible again after session ends
test('Stats section is visible again after session ends', () => {
    const app = new FlashcardApp();
    
    // Add some test cards
    app.addCard('здравей', 'hello', 'Greetings');
    app.addCard('довиждане', 'goodbye', 'Greetings');
    app.addCard('благодаря', 'thank you', 'Greetings');
    
    // Start a session
    app.startSession();
    app.updateStudyTab();
    
    // End the session
    app.endSession();
    
    const statsSection = document.querySelector('.stats');
    assert(statsSection, 'Stats section should exist');
    
    assertEquals(statsSection.style.display, 'flex', 'Stats section should be visible after session ends');
});

// Test 4: Stats section is visible when no cards exist
test('Stats section is visible when no cards exist', () => {
    const app = new FlashcardApp();
    
    // Don't add any cards
    app.updateStudyTab();
    
    const statsSection = document.querySelector('.stats');
    assert(statsSection, 'Stats section should exist');
    
    assertEquals(statsSection.style.display, 'flex', 'Stats section should be visible when no cards exist');
});

// Test 5: Stats section visibility during session with card limit
test('Stats section is hidden during session with card limit', () => {
    const app = new FlashcardApp();
    
    // Add multiple cards
    for (let i = 1; i <= 10; i++) {
        app.addCard(`word${i}`, `translation${i}`, 'Test');
    }
    
    // Set card limit
    app.cardLimit = 3;
    
    // Start a session
    app.startSession();
    app.updateStudyTab();
    
    const statsSection = document.querySelector('.stats');
    assert(statsSection, 'Stats section should exist');
    
    assertEquals(statsSection.style.display, 'none', 'Stats section should be hidden during session with card limit');
});

console.log('\n================================');
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
