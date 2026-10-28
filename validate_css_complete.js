const fs = require('fs');

console.log('=== CSS Validation: Complete Check ===\n');

const css = fs.readFileSync('styles.css', 'utf8');

let allPassed = true;

// Check 1: Basic CSS syntax
console.log('1. Basic CSS Syntax');
if (css.includes('{') && css.includes('}') && css.includes(';')) {
    console.log('   ✓ CSS has valid basic syntax');
} else {
    console.log('   ✗ CSS syntax issues detected');
    allPassed = false;
}

// Check 2: All button classes exist
console.log('\n2. Button Classes');
const buttonClasses = ['.btn', '.btn-primary', '.btn-secondary', '.btn-bury', '.btn-unbury', '.btn-easy', '.btn-review'];
buttonClasses.forEach(cls => {
    const regex = new RegExp(`\\${cls}\\s*\\{`, 'm');
    if (regex.test(css)) {
        console.log(`   ✓ ${cls} exists`);
    } else {
        console.log(`   ✗ ${cls} missing`);
        allPassed = false;
    }
});

// Check 3: Buried card classes
console.log('\n3. Buried Card Classes');
if (/\.card-item-buried\s*\{/.test(css)) {
    console.log('   ✓ .card-item-buried exists');
    const buriedMatch = css.match(/\.card-item-buried\s*\{[^}]+\}/s);
    if (buriedMatch && !/opacity/.test(buriedMatch[0])) {
        console.log('   ✓ .card-item-buried has NO opacity (correct)');
    } else {
        console.log('   ✗ .card-item-buried should not have opacity');
        allPassed = false;
    }
} else {
    console.log('   ✗ .card-item-buried missing');
    allPassed = false;
}

if (/\.card-item-buried\s+\.card-item-content\s*\{/.test(css)) {
    console.log('   ✓ .card-item-buried .card-item-content exists');
    const contentMatch = css.match(/\.card-item-buried\s+\.card-item-content\s*\{[^}]+\}/s);
    if (contentMatch && /opacity:\s*0\.5/.test(contentMatch[0])) {
        console.log('   ✓ .card-item-buried .card-item-content has opacity: 0.5');
    } else {
        console.log('   ✗ .card-item-buried .card-item-content missing opacity: 0.5');
        allPassed = false;
    }
} else {
    console.log('   ✗ .card-item-buried .card-item-content missing');
    allPassed = false;
}

// Check 4: Unbury button specifics
console.log('\n4. Unbury Button Properties');
const unburyMatch = css.match(/\.btn-unbury\s*\{[^}]+\}/s);
if (unburyMatch) {
    const props = unburyMatch[0];
    
    if (/background:\s*#2196f3/.test(props)) {
        console.log('   ✓ Background color #2196f3');
    } else {
        console.log('   ✗ Missing or wrong background color');
        allPassed = false;
    }
    
    if (/color:\s*white/.test(props)) {
        console.log('   ✓ Text color white');
    }
    
    if (!/opacity:\s*1/.test(props)) {
        console.log('   ✓ No opacity override (correct)');
    }
}

const unburyHoverMatch = css.match(/\.btn-unbury:hover\s*\{[^}]+\}/s);
if (unburyHoverMatch) {
    console.log('   ✓ .btn-unbury:hover exists');
    const hoverProps = unburyHoverMatch[0];
    
    if (/transform:\s*translateY/.test(hoverProps)) {
        console.log('   ✓ Hover transform effect');
    }
    
    if (/box-shadow:/.test(hoverProps)) {
        console.log('   ✓ Hover box-shadow effect');
    }
}

// Check 5: No syntax errors
console.log('\n5. CSS Syntax Validation');
const openBraces = (css.match(/\{/g) || []).length;
const closeBraces = (css.match(/\}/g) || []).length;
if (openBraces === closeBraces) {
    console.log(`   ✓ Balanced braces (${openBraces} pairs)`);
} else {
    console.log(`   ✗ Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
    allPassed = false;
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
    console.log('✅ ALL CSS VALIDATION CHECKS PASSED');
    process.exit(0);
} else {
    console.log('❌ SOME CSS VALIDATION CHECKS FAILED');
    process.exit(1);
}
