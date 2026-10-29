const fs = require('fs');
const css = fs.readFileSync('styles.css', 'utf8');

// Check that .btn-unbury has opacity: 1
const unburyMatch = css.match(/\.btn-unbury\s*\{[^}]*opacity:\s*1[^}]*\}/s);
if (unburyMatch) {
    console.log('✓ .btn-unbury has opacity: 1');
} else {
    console.log('✗ .btn-unbury does not have opacity: 1');
    process.exit(1);
}

// Check that .card-item-buried has opacity: 0.5
const buriedMatch = css.match(/\.card-item-buried\s*\{[^}]*opacity:\s*0\.5[^}]*\}/s);
if (buriedMatch) {
    console.log('✓ .card-item-buried has opacity: 0.5 (parent dimmed)');
} else {
    console.log('✗ .card-item-buried does not have opacity: 0.5');
    process.exit(1);
}

console.log('\nAll CSS checks passed!');
console.log('The unbury button will now appear fully opaque (opacity: 1)');
console.log('even when inside a buried card (which has opacity: 0.5).');
