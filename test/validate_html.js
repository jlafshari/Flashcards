// Basic validation of HTML, CSS, and JS files
const fs = require('fs');

console.log('=== Validating Flashcard App Files ===\n');

// Check HTML structure
console.log('1. Checking index.html...');
const html = fs.readFileSync('../index.html', 'utf8');

const htmlChecks = [
    { test: /<html[^>]*lang="en"/, name: 'Has lang attribute' },
    { test: /<meta[^>]*charset="UTF-8"/, name: 'Has UTF-8 charset' },
    { test: /<meta[^>]*viewport/, name: 'Has viewport meta tag' },
    { test: /<link[^>]*href="styles\.css"/, name: 'Links to styles.css' },
    { test: /<script[^>]*src="app\.js"/, name: 'Links to app.js' },
    { test: /<div[^>]*id="study-tab"/, name: 'Has study tab' },
    { test: /<div[^>]*id="manage-tab"/, name: 'Has manage tab' },
    { test: /<div[^>]*id="flashcard"/, name: 'Has flashcard element' }
];

htmlChecks.forEach(check => {
    if (check.test.test(html)) {
        console.log(`   ✓ ${check.name}`);
    } else {
        console.log(`   ✗ ${check.name}`);
        process.exitCode = 1;
    }
});

// Check CSS
console.log('\n2. Checking styles.css...');
const css = fs.readFileSync('../styles.css', 'utf8');

const cssChecks = [
    { test: /\.flashcard/, name: 'Has flashcard styles' },
    { test: /\.card-front/, name: 'Has card-front styles' },
    { test: /\.card-back/, name: 'Has card-back styles' },
    { test: /\.btn/, name: 'Has button styles' },
    { test: /@media.*max-width/, name: 'Has responsive media queries' },
    { test: /\.flipped/, name: 'Has flip animation styles' }
];

cssChecks.forEach(check => {
    if (check.test.test(css)) {
        console.log(`   ✓ ${check.name}`);
    } else {
        console.log(`   ✗ ${check.name}`);
        process.exitCode = 1;
    }
});

// Check JavaScript
console.log('\n3. Checking app.js...');
const js = fs.readFileSync('../app.js', 'utf8');

const jsChecks = [
    { test: /class FlashcardApp/, name: 'Has FlashcardApp class' },
    { test: /addCard\([^)]*bulgarian[^)]*english/, name: 'Has addCard method' },
    { test: /deleteCard/, name: 'Has deleteCard method' },
    { test: /nextCard/, name: 'Has nextCard method' },
    { test: /previousCard/, name: 'Has previousCard method' },
    { test: /flipCard/, name: 'Has flipCard method' },
    { test: /localStorage/, name: 'Uses localStorage for persistence' },
    { test: /addEventListener/, name: 'Sets up event listeners' }
];

jsChecks.forEach(check => {
    if (check.test.test(js)) {
        console.log(`   ✓ ${check.name}`);
    } else {
        console.log(`   ✗ ${check.name}`);
        process.exitCode = 1;
    }
});

// File size check
console.log('\n4. Checking file sizes...');
const htmlSize = fs.statSync('../index.html').size;
const cssSize = fs.statSync('../styles.css').size;
const jsSize = fs.statSync('../app.js').size;

console.log(`   index.html: ${htmlSize} bytes`);
console.log(`   styles.css: ${cssSize} bytes`);
console.log(`   app.js: ${jsSize} bytes`);

if (htmlSize > 0 && cssSize > 0 && jsSize > 0) {
    console.log('   ✓ All files have content');
} else {
    console.log('   ✗ Some files are empty');
    process.exitCode = 1;
}

console.log('\n=== Validation Complete ===');
if (process.exitCode === 1) {
    console.log('❌ Some checks failed');
} else {
    console.log('✅ All checks passed!');
}
