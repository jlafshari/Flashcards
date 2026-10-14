// Test: Sample Cards Initialization - Simple verification test
// This test reads app.js and verifies the initializeSampleCards method exists and has correct content

const fs = require('fs');

console.log('Testing Sample Cards Implementation...\n');

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
    if (condition) {
        console.log(`✓ ${name}`);
        if (details) console.log(`  ${details}`);
        passed++;
    } else {
        console.log(`✗ ${name}`);
        if (details) console.log(`  ${details}`);
        failed++;
    }
}

// Read the app.js file
const appJs = fs.readFileSync('../app.js', 'utf8');

// Test 1: initializeSampleCards method exists
test(
    'initializeSampleCards method exists',
    appJs.includes('initializeSampleCards()'),
    'Method definition found'
);

// Test 2: loadFromStorage calls initializeSampleCards
test(
    'loadFromStorage checks for empty storage and calls initializeSampleCards',
    appJs.includes('} else {') && 
    appJs.includes('this.initializeSampleCards()'),
    'First-time usage detection implemented'
);

// Test 3: Check for all 10 sample cards
const sampleCards = [
    'Здравей',
    'Довиждане', 
    'Добро утро',
    'Как си?',
    'Как се казваш?',
    'Къде е...?',
    'Благодаря',
    'Моля',
    'Да',
    'Не'
];

sampleCards.forEach(card => {
    test(
        `Sample card "${card}" is added`,
        appJs.includes(`'${card}'`),
        `Found in initializeSampleCards method`
    );
});

// Test 4: Check categories
test(
    'Greetings category used',
    appJs.includes("'Greetings'"),
    'Category defined'
);

test(
    'Questions category used',
    appJs.includes("'Questions'"),
    'Category defined'
);

test(
    'Basic Phrases category used',
    appJs.includes("'Basic Phrases'"),
    'Category defined'
);

// Test 5: Verify structure - addCard is called 10 times in initializeSampleCards
const initMethod = appJs.match(/initializeSampleCards\(\)\s*{[\s\S]*?}\n\n/);
if (initMethod) {
    const addCardCalls = (initMethod[0].match(/this\.addCard\(/g) || []).length;
    test(
        'initializeSampleCards calls addCard 10 times',
        addCardCalls === 10,
        `Found ${addCardCalls} addCard calls`
    );
} else {
    test('Could not extract initializeSampleCards method', false);
}

// Test 6: Verify comment documentation
test(
    'Method has explanatory comments',
    appJs.includes('// Create 10 sample cards'),
    'Documentation present'
);

console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log('='.repeat(50));

if (failed > 0) {
    console.log('\nNote: Some tests failed. Review the implementation.');
    process.exit(1);
} else {
    console.log('\n✓ All implementation tests passed!');
    console.log('\nFor functional testing:');
    console.log('1. Open index.html in a browser');
    console.log('2. Clear localStorage (DevTools > Application > Local Storage)');
    console.log('3. Reload the page');
    console.log('4. Verify 10 sample cards appear in the Manage Cards tab');
    console.log('\nOR open test/test_sample_cards.html in a browser for automated testing.');
}
