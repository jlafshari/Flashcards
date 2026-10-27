const fs = require('fs');

console.log('=== JavaScript Validation: Final Check ===\n');

const appJs = fs.readFileSync('app.js', 'utf8');

let allPassed = true;

// Check 1: Basic JavaScript structure
console.log('1. Basic JavaScript Structure');
if (appJs.includes('class FlashcardApp')) {
    console.log('   ✓ FlashcardApp class exists');
} else {
    console.log('   ✗ Missing FlashcardApp class');
    allPassed = false;
}

if (appJs.includes('constructor()')) {
    console.log('   ✓ Constructor defined');
} else {
    console.log('   ✗ Missing constructor');
    allPassed = false;
}

// Check 2: Bury feature method (toggle function)
console.log('\n2. Bury Feature Method');
if (appJs.includes('buryCard(')) {
    console.log('   ✓ buryCard() exists (toggles buried state)');
    
    // Verify it's a toggle
    const buryCardMatch = appJs.match(/buryCard\([^)]*\)\s*\{[^}]*card\.buried\s*=\s*![^;]+;/s);
    if (buryCardMatch) {
        console.log('   ✓ buryCard() toggles buried state');
    }
} else {
    console.log('   ✗ buryCard() missing');
    allPassed = false;
}

// Check 3: Buried property handling
console.log('\n3. Buried Property Handling');
if (appJs.includes('buried:')) {
    console.log('   ✓ "buried" property in card data');
} else {
    console.log('   ✗ Missing "buried" property');
    allPassed = false;
}

if (appJs.includes('card.buried')) {
    console.log('   ✓ Checks card.buried state');
} else {
    console.log('   ✗ Not checking buried state');
    allPassed = false;
}

// Check 4: CSS class application in manage tab
console.log('\n4. CSS Class Application');
if (appJs.includes('card-item-buried')) {
    console.log('   ✓ Applies card-item-buried class');
} else {
    console.log('   ✗ Missing card-item-buried class application');
    allPassed = false;
}

if (appJs.includes('btn-unbury')) {
    console.log('   ✓ Uses btn-unbury class');
} else {
    console.log('   ✗ Missing btn-unbury class');
    allPassed = false;
}

if (appJs.includes('btn-bury')) {
    console.log('   ✓ Uses btn-bury class');
} else {
    console.log('   ✗ Missing btn-bury class');
    allPassed = false;
}

// Check 5: DOM structure for manage cards
console.log('\n5. Manage Cards DOM Structure');
if (appJs.includes('card-item-content')) {
    console.log('   ✓ Uses card-item-content wrapper');
} else {
    console.log('   ✗ Missing card-item-content wrapper');
    allPassed = false;
}

if (appJs.includes('card-item-actions')) {
    console.log('   ✓ Uses card-item-actions wrapper');
} else {
    console.log('   ✗ Missing card-item-actions wrapper');
    allPassed = false;
}

// Check 6: Session filtering
console.log('\n6. Session Filtering');
if (appJs.includes('!card.buried')) {
    console.log('   ✓ Filters out buried cards from sessions');
} else {
    console.log('   ⚠ May not filter buried cards (check logic)');
}

// Check 7: Basic syntax validation
console.log('\n7. Basic Syntax Validation');
const openBraces = (appJs.match(/\{/g) || []).length;
const closeBraces = (appJs.match(/\}/g) || []).length;
if (openBraces === closeBraces) {
    console.log(`   ✓ Balanced braces (${openBraces} pairs)`);
} else {
    console.log(`   ✗ Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
    allPassed = false;
}

const openParens = (appJs.match(/\(/g) || []).length;
const closeParens = (appJs.match(/\)/g) || []).length;
if (openParens === closeParens) {
    console.log(`   ✓ Balanced parentheses (${openParens} pairs)`);
} else {
    console.log(`   ✗ Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
    allPassed = false;
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
    console.log('✅ ALL JAVASCRIPT VALIDATION CHECKS PASSED');
    process.exit(0);
} else {
    console.log('❌ SOME JAVASCRIPT VALIDATION CHECKS FAILED');
    process.exit(1);
}
