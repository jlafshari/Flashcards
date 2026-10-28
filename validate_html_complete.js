const fs = require('fs');

console.log('=== HTML Validation: Complete Check ===\n');

const html = fs.readFileSync('index.html', 'utf8');

let allPassed = true;

// Check 1: Basic HTML structure
console.log('1. Basic HTML Structure');
if (html.includes('<!DOCTYPE html>')) {
    console.log('   ✓ DOCTYPE declaration');
} else {
    console.log('   ✗ Missing DOCTYPE');
    allPassed = false;
}

if (html.includes('<html') && html.includes('</html>')) {
    console.log('   ✓ HTML root element');
} else {
    console.log('   ✗ Missing HTML root');
    allPassed = false;
}

if (html.includes('<head>') && html.includes('</head>')) {
    console.log('   ✓ HEAD section');
} else {
    console.log('   ✗ Missing HEAD');
    allPassed = false;
}

if (html.includes('<body>') && html.includes('</body>')) {
    console.log('   ✓ BODY section');
} else {
    console.log('   ✗ Missing BODY');
    allPassed = false;
}

// Check 2: Required resources
console.log('\n2. Required Resources');
if (html.includes('styles.css')) {
    console.log('   ✓ Links to styles.css');
} else {
    console.log('   ✗ Missing styles.css link');
    allPassed = false;
}

if (html.includes('app.js')) {
    console.log('   ✓ Links to app.js');
} else {
    console.log('   ✗ Missing app.js script');
    allPassed = false;
}

// Check 3: Study tab elements
console.log('\n3. Study Tab Elements');
const studyElements = ['study-tab', 'start-session-btn', 'card-container', 'flip-btn', 'easy-btn', 'review-btn', 'bury-btn'];
studyElements.forEach(id => {
    if (html.includes(`id="${id}"`)) {
        console.log(`   ✓ #${id} exists`);
    } else {
        console.log(`   ✗ #${id} missing`);
        allPassed = false;
    }
});

// Check 4: Manage tab elements
console.log('\n4. Manage Tab Elements');
const manageElements = ['manage-tab', 'bulgarian-input', 'english-input', 'category-input', 'add-card-btn', 'cards-list'];
manageElements.forEach(id => {
    if (html.includes(`id="${id}"`)) {
        console.log(`   ✓ #${id} exists`);
    } else {
        console.log(`   ✗ #${id} missing`);
        allPassed = false;
    }
});

// Check 5: Bury button in study session
console.log('\n5. Bury Feature Elements');
if (html.includes('bury-btn')) {
    console.log('   ✓ Bury button in study session');
} else {
    console.log('   ✗ Missing bury button');
    allPassed = false;
}

if (html.includes('btn-bury')) {
    console.log('   ✓ btn-bury class referenced');
} else {
    console.log('   ✗ btn-bury class not found');
    allPassed = false;
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
    console.log('✅ ALL HTML VALIDATION CHECKS PASSED');
    process.exit(0);
} else {
    console.log('❌ SOME HTML VALIDATION CHECKS FAILED');
    process.exit(1);
}
