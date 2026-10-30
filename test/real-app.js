// Loads the real FlashcardApp from ../app.js (it declares the class but does not export it)
// and provides helpers for tests that exercise it with the shared DOM mock.
const fs = require('fs');
const path = require('path');
const { mockDOM, MockElement } = require('./dom-mock.js');

eval(fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8') + '; global.FlashcardApp = FlashcardApp;');

// Run timers immediately so animated actions (markEasy, markBuried, ...) finish synchronously
global.setTimeout = (fn) => fn();

// Creates an app after resetting storage. `cards` seeds the saved deck; by default the deck
// starts empty rather than with the 10 sample cards.
function createApp(cards = []) {
    localStorage.clear();
    localStorage.setItem('flashcards', JSON.stringify(cards));
    return new FlashcardApp();
}

// Records alert() calls
function captureAlerts() {
    const alerts = [];
    global.alert = (msg) => alerts.push(msg);
    return alerts;
}

// Minimal test harness: unlike console.assert, a failure makes the process exit non-zero
let passed = 0;
let failed = 0;
function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`✓ ${name}`);
    } catch (error) {
        failed++;
        console.log(`✗ ${name}\n  ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message || 'Values differ'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function finish() {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
}

module.exports = { createApp, captureAlerts, test, assert, assertEquals, finish, mockDOM, MockElement };
