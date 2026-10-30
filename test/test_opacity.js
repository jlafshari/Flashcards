const fs = require('fs');
const css = fs.readFileSync('../styles.css', 'utf8');

// Check that .btn-unbury does not dim itself (the buried card no longer has opacity,
// so the button needs no override and stays fully opaque)
const unburyRule = css.match(/\.btn-unbury\s*\{[^}]*\}/s);
if (unburyRule && !/opacity:\s*0?\.\d/.test(unburyRule[0])) {
    console.log('✓ .btn-unbury is not dimmed');
} else {
    console.log('✗ .btn-unbury is dimmed or missing');
    process.exit(1);
}

// Check that the buried card's content (not the card itself) has opacity: 0.5
const buriedMatch = css.match(/\.card-item-buried\s+\.card-item-content\s*\{[^}]*opacity:\s*0\.5[^}]*\}/s);
if (buriedMatch) {
    console.log('✓ .card-item-buried .card-item-content has opacity: 0.5');
} else {
    console.log('✗ .card-item-buried .card-item-content does not have opacity: 0.5');
    process.exit(1);
}

console.log('\nAll CSS checks passed!');
console.log('The unbury button appears fully opaque because only the card content is dimmed.');
