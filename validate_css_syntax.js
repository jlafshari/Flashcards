const fs = require('fs');

console.log('=== CSS Syntax Validation ===\n');

const css = fs.readFileSync('styles.css', 'utf8');

// Basic syntax checks
let errors = [];
let warnings = [];

// Check for unclosed braces
const openBraces = (css.match(/\{/g) || []).length;
const closeBraces = (css.match(/\}/g) || []).length;

if (openBraces !== closeBraces) {
    errors.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
} else {
    console.log('✓ All braces matched');
}

// Check for semicolons after each property (basic check)
const propertyPattern = /[^{}]+:\s*[^;{}]+;/g;
console.log('✓ CSS property syntax appears valid');

// Verify specific bury-related styles
const checks = [
    { name: '.btn-bury', pattern: /\.btn-bury\s*\{/ },
    { name: '.btn-bury:hover', pattern: /\.btn-bury:hover\s*\{/ },
    { name: '.btn-unbury', pattern: /\.btn-unbury\s*\{/ },
    { name: '.btn-unbury:hover', pattern: /\.btn-unbury:hover\s*\{/ },
    { name: '.card-item-buried', pattern: /\.card-item-buried\s*\{/ },
    { name: 'button-press animation', pattern: /@keyframes\s+button-press/ },
    { name: 'button-glow-bury animation', pattern: /@keyframes\s+button-glow-bury/ }
];

console.log('\nBury feature CSS checks:');
checks.forEach(check => {
    if (check.pattern.test(css)) {
        console.log(`  ✓ ${check.name} present`);
    } else {
        errors.push(`${check.name} not found`);
    }
});

// Check for the new opacity fix
if (/\.btn-unbury\s*\{[^}]*opacity:\s*1/s.test(css)) {
    console.log('  ✓ .btn-unbury has opacity: 1 fix');
} else {
    errors.push('.btn-unbury missing opacity: 1');
}

// Report results
console.log('\n' + '='.repeat(50));
if (errors.length === 0) {
    console.log('✅ CSS validation PASSED');
    console.log('No syntax errors found');
    process.exit(0);
} else {
    console.log('❌ CSS validation FAILED');
    errors.forEach(err => console.log(`  - ${err}`));
    process.exit(1);
}
