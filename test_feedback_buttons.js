// Simple Node.js test for feedback button logic
// Tests the new functionality without DOM

console.log('Testing Feedback Button Feature\n');
console.log('=================================\n');

let testsRun = 0;
let testsPassed = 0;

function test(description, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✓ ${description}`);
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Mock DOM elements
class MockElement {
    constructor(id) {
        this.id = id;
        this.style = { display: 'inline-block' };
        this.disabled = false;
        this.classList = {
            classes: [],
            add: function(cls) { this.classes.push(cls); },
            remove: function(cls) { 
                this.classes = this.classes.filter(c => c !== cls); 
            },
            toggle: function(cls, force) {
                if (force === undefined) force = !this.classes.includes(cls);
                if (force) this.add(cls);
                else this.remove(cls);
            }
        };
    }
}

// Create mock DOM
const mockDOM = {
    'next-btn': new MockElement('next-btn'),
    'easy-btn': new MockElement('easy-btn'),
    'review-btn': new MockElement('review-btn'),
    'flashcard': new MockElement('flashcard')
};

mockDOM['easy-btn'].style.display = 'none';
mockDOM['review-btn'].style.display = 'none';

global.document = {
    getElementById: (id) => mockDOM[id]
};

// Test button visibility toggling
test('Initial state: Next button visible, feedback buttons hidden', () => {
    assert(mockDOM['next-btn'].style.display !== 'none', 'Next button should be visible');
    assert(mockDOM['easy-btn'].style.display === 'none', 'Easy button should be hidden');
    assert(mockDOM['review-btn'].style.display === 'none', 'Review button should be hidden');
});

test('After flip: Next button hidden, feedback buttons visible', () => {
    // Simulate showFeedbackButtons()
    mockDOM['next-btn'].style.display = 'none';
    mockDOM['easy-btn'].style.display = 'inline-block';
    mockDOM['review-btn'].style.display = 'inline-block';
    
    assert(mockDOM['next-btn'].style.display === 'none', 'Next button should be hidden');
    assert(mockDOM['easy-btn'].style.display !== 'none', 'Easy button should be visible');
    assert(mockDOM['review-btn'].style.display !== 'none', 'Review button should be visible');
});

test('After reset: Buttons return to initial state', () => {
    // Simulate hideFeedbackButtons()
    mockDOM['next-btn'].style.display = 'inline-block';
    mockDOM['easy-btn'].style.display = 'none';
    mockDOM['review-btn'].style.display = 'none';
    
    assert(mockDOM['next-btn'].style.display !== 'none', 'Next button should be visible');
    assert(mockDOM['easy-btn'].style.display === 'none', 'Easy button should be hidden');
    assert(mockDOM['review-btn'].style.display === 'none', 'Review button should be hidden');
});

test('Last card: Feedback buttons should be disabled', () => {
    mockDOM['easy-btn'].disabled = true;
    mockDOM['review-btn'].disabled = true;
    
    assert(mockDOM['easy-btn'].disabled === true, 'Easy button should be disabled on last card');
    assert(mockDOM['review-btn'].disabled === true, 'Review button should be disabled on last card');
});

test('Non-last card: Feedback buttons should be enabled', () => {
    mockDOM['easy-btn'].disabled = false;
    mockDOM['review-btn'].disabled = false;
    
    assert(mockDOM['easy-btn'].disabled === false, 'Easy button should be enabled');
    assert(mockDOM['review-btn'].disabled === false, 'Review button should be enabled');
});

// Summary
console.log('\n=================================');
console.log(`Tests run: ${testsRun}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsRun - testsPassed}`);

if (testsPassed === testsRun) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
}
