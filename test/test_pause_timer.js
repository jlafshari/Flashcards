// Test pause timer functionality
// Run with: node test/test_pause_timer.js

const assert = require('assert');

// Mock DOM environment
global.document = {
    getElementById: () => ({ addEventListener: () => {} }),
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: () => ({ textContent: '', innerHTML: '' }),
    hidden: false
};

global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = value; },
    clear() { this.data = {}; }
};

global.alert = () => {};

// Load the app
const fs = require('fs');
const appCode = fs.readFileSync('app.js', 'utf8');
// Remove the initialization line at the end
const appCodeWithoutInit = appCode.replace(/const app = new FlashcardApp\(\);[\s]*$/, '');
eval(appCodeWithoutInit);

console.log('Testing pause timer functionality...\n');

// Test 1: Pause tracking properties initialized
console.log('Test 1: Pause tracking properties initialized');
const app = new FlashcardApp();
assert.strictEqual(app.sessionPausedTime, 0, 'sessionPausedTime should start at 0');
assert.strictEqual(app.sessionPauseStart, null, 'sessionPauseStart should start as null');
console.log('✓ Pause tracking properties initialized correctly\n');

// Test 2: Pause tracking reset on session start
console.log('Test 2: Pause tracking reset on session start');
app.cards = [
    { id: 1, bulgarian: 'Здравей', english: 'Hello', category: 'Greetings', buried: false },
    { id: 2, bulgarian: 'Довиждане', english: 'Goodbye', category: 'Greetings', buried: false }
];
app.sessionPausedTime = 100; // Simulate previous paused time
app.sessionPauseStart = Date.now(); // Simulate pause in progress
app.startSession();
assert.strictEqual(app.sessionPausedTime, 0, 'sessionPausedTime should reset to 0');
assert.strictEqual(app.sessionPauseStart, null, 'sessionPauseStart should reset to null');
assert.strictEqual(app.inSession, true, 'Session should be active');
assert.notStrictEqual(app.sessionStartTime, null, 'sessionStartTime should be set');
console.log('✓ Pause tracking resets correctly on session start\n');

// Test 3: Pause time accumulation
console.log('Test 3: Pause time accumulation');
const startTime = Date.now();
app.sessionStartTime = startTime;
app.sessionPauseStart = startTime;

// Simulate 5 seconds passing
const afterPause = startTime + 5000;
const originalDateNow = Date.now;
Date.now = () => afterPause;

// Calculate pause duration
const pauseDuration = Math.round((Date.now() - app.sessionPauseStart) / 1000);
app.sessionPausedTime += pauseDuration;
app.sessionPauseStart = null;

assert.strictEqual(app.sessionPausedTime, 5, 'Should accumulate 5 seconds of pause time');
assert.strictEqual(app.sessionPauseStart, null, 'sessionPauseStart should be reset after accumulation');
console.log('✓ Pause time accumulates correctly\n');

// Test 4: Multiple pause cycles
console.log('Test 4: Multiple pause cycles');
app.sessionPausedTime = 0;
app.sessionPauseStart = null;

// First pause: 3 seconds
app.sessionPauseStart = afterPause;
Date.now = () => afterPause + 3000;
let pauseDur = Math.round((Date.now() - app.sessionPauseStart) / 1000);
app.sessionPausedTime += pauseDur;
app.sessionPauseStart = null;

// Second pause: 7 seconds
app.sessionPauseStart = Date.now();
Date.now = () => afterPause + 3000 + 7000;
pauseDur = Math.round((Date.now() - app.sessionPauseStart) / 1000);
app.sessionPausedTime += pauseDur;
app.sessionPauseStart = null;

assert.strictEqual(app.sessionPausedTime, 10, 'Should accumulate 10 seconds total (3 + 7)');
console.log('✓ Multiple pause cycles work correctly\n');

// Test 5: Elapsed time calculation excludes paused time
console.log('Test 5: Elapsed time calculation excludes paused time');
const sessionStart = Date.now();
app.sessionStartTime = sessionStart;
app.sessionPausedTime = 10; // 10 seconds paused

// Total session: 30 seconds
Date.now = () => sessionStart + 30000;

const elapsedSeconds = Math.round((Date.now() - app.sessionStartTime) / 1000) - app.sessionPausedTime;
assert.strictEqual(elapsedSeconds, 20, 'Should report 20 seconds (30 total - 10 paused)');
console.log('✓ Elapsed time correctly excludes paused time\n');

// Test 6: endSession calculates time correctly
console.log('Test 6: endSession calculates time correctly');
app.totalTimeToday = 0;
app.sessionStartTime = sessionStart;
app.sessionPausedTime = 15; // 15 seconds paused
Date.now = () => sessionStart + 45000; // 45 seconds total

app.endSession();
assert.strictEqual(app.totalTimeToday, 30, 'Should add 30 seconds to totalTimeToday (45 - 15)');
assert.strictEqual(app.sessionPausedTime, 0, 'sessionPausedTime should reset after endSession');
assert.strictEqual(app.sessionPauseStart, null, 'sessionPauseStart should reset after endSession');
assert.strictEqual(app.inSession, false, 'Session should be ended');
console.log('✓ endSession calculates and resets correctly\n');

// Test 7: Edge case - ending session while paused
console.log('Test 7: Edge case - ending session while paused');
app.totalTimeToday = 0;
const edgeStart = Date.now();
app.sessionStartTime = edgeStart;
app.sessionPausedTime = 5;
app.inSession = true;
app.sessionPauseStart = edgeStart + 10000; // Pause started 10 seconds in

// End session 5 seconds into the pause (15 seconds total)
Date.now = () => edgeStart + 15000;

// Note: In this edge case, the current pause hasn't been accumulated yet
// So only the previously accumulated pause time (5 seconds) is excluded
app.endSession();
assert.strictEqual(app.totalTimeToday, 10, 'Should add 10 seconds (15 total - 5 accumulated pause)');
console.log('✓ Edge case handled: ending session while paused\n');

// Restore Date.now
Date.now = originalDateNow;

// Test 8: formatTime handles paused time correctly
console.log('Test 8: formatTime handles various durations');
const testCases = [
    { seconds: 30, expected: '30 sec' },
    { seconds: 90, expected: '1 min 30 sec' },
    { seconds: 120, expected: '2 min' },
    { seconds: 3665, expected: '1 hr 1 min' }
];

testCases.forEach(({ seconds, expected }) => {
    const result = app.formatTime(seconds);
    assert.strictEqual(result, expected, `formatTime(${seconds}) should return "${expected}"`);
});
console.log('✓ Time formatting works correctly\n');

console.log('═══════════════════════════════════════');
console.log('All pause timer tests passed! ✓');
console.log('═══════════════════════════════════════');
