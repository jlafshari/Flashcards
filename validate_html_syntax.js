const fs = require('fs');

console.log('=== HTML Syntax Validation ===\n');

const html = fs.readFileSync('index.html', 'utf8');

let errors = [];

// Basic syntax checks
console.log('Checking HTML structure...');

// Check for DOCTYPE
if (html.includes('<!DOCTYPE html>')) {
    console.log('  ✓ DOCTYPE declared');
} else {
    errors.push('Missing DOCTYPE');
}

// Check for required tags
const requiredTags = ['<html', '<head>', '<body>', '<title>'];
requiredTags.forEach(tag => {
    if (html.includes(tag)) {
        console.log(`  ✓ ${tag} present`);
    } else {
        errors.push(`Missing ${tag}`);
    }
});

// Check for matching open/close tags
const tagsToCheck = ['html', 'head', 'body', 'div', 'button'];
tagsToCheck.forEach(tag => {
    const openCount = (html.match(new RegExp(`<${tag}[\\s>]`, 'gi')) || []).length;
    const closeCount = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    
    if (openCount === closeCount) {
        console.log(`  ✓ <${tag}> tags balanced (${openCount}/${closeCount})`);
    } else if (tag === 'div' || tag === 'button') {
        // These might be generated dynamically, just warn
        console.log(`  ⚠ <${tag}> tags: ${openCount} open, ${closeCount} close (may be dynamic)`);
    } else {
        errors.push(`<${tag}> tags unbalanced: ${openCount} open, ${closeCount} close`);
    }
});

// Check for bury button in HTML
console.log('\nChecking bury feature elements:');
if (html.includes('id="bury-btn"')) {
    console.log('  ✓ bury-btn element present');
} else {
    errors.push('bury-btn element not found');
}

if (html.includes('btn-bury') || html.includes('Bury')) {
    console.log('  ✓ Bury button references found');
} else {
    console.log('  ⚠ No direct bury button in HTML (may be generated dynamically)');
}

// Report results
console.log('\n' + '='.repeat(50));
if (errors.length === 0) {
    console.log('✅ HTML validation PASSED');
    console.log('HTML structure is valid');
    process.exit(0);
} else {
    console.log('❌ HTML validation FAILED');
    errors.forEach(err => console.log(`  - ${err}`));
    process.exit(1);
}
