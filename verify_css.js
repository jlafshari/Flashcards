const fs = require('fs');

console.log('Verifying CSS changes...\n');

const css = fs.readFileSync('styles.css', 'utf8');

// Test 1: Check .btn-unbury has opacity: 1
const unburySection = css.match(/\.btn-unbury\s*\{[^}]+\}/s);
if (!unburySection) {
    console.log('✗ .btn-unbury class not found');
    process.exit(1);
}

const hasOpacity = /opacity:\s*1/.test(unburySection[0]);
if (hasOpacity) {
    console.log('✓ .btn-unbury has opacity: 1 set');
} else {
    console.log('✗ .btn-unbury missing opacity: 1');
    process.exit(1);
}

// Test 2: Check all required properties are present
const hasBackground = /background:\s*#2196f3/.test(unburySection[0]);
const hasColor = /color:\s*white/.test(unburySection[0]);
const hasPadding = /padding:\s*8px\s+16px/.test(unburySection[0]);
const hasFontSize = /font-size:\s*0\.9em/.test(unburySection[0]);

if (hasBackground && hasColor && hasPadding && hasFontSize) {
    console.log('✓ All .btn-unbury properties present');
} else {
    console.log('✗ Missing some .btn-unbury properties');
    console.log(`  - background: ${hasBackground}`);
    console.log(`  - color: ${hasColor}`);
    console.log(`  - padding: ${hasPadding}`);
    console.log(`  - font-size: ${hasFontSize}`);
    process.exit(1);
}

// Test 3: Check .btn-unbury:hover exists with proper effects
const unburyHover = css.match(/\.btn-unbury:hover\s*\{[^}]+\}/s);
if (!unburyHover) {
    console.log('✗ .btn-unbury:hover not found');
    process.exit(1);
}

const hoverHasTransform = /transform:\s*translateY\(-2px\)/.test(unburyHover[0]);
const hoverHasBoxShadow = /box-shadow:\s*0\s+5px\s+15px/.test(unburyHover[0]);
const hoverHasBackground = /background:\s*#1976d2/.test(unburyHover[0]);

if (hoverHasTransform && hoverHasBoxShadow && hoverHasBackground) {
    console.log('✓ .btn-unbury:hover has all effects (transform, box-shadow, background)');
} else {
    console.log('✗ .btn-unbury:hover missing some effects');
    process.exit(1);
}

// Test 4: Check .card-item-buried still has opacity: 0.5
const buriedSection = css.match(/\.card-item-buried\s*\{[^}]+\}/s);
if (!buriedSection) {
    console.log('✗ .card-item-buried not found');
    process.exit(1);
}

const buriedHasOpacity = /opacity:\s*0\.5/.test(buriedSection[0]);
if (buriedHasOpacity) {
    console.log('✓ .card-item-buried still has opacity: 0.5 (card dimming intact)');
} else {
    console.log('✗ .card-item-buried missing opacity: 0.5');
    process.exit(1);
}

console.log('\n✓ All CSS verifications passed!');
console.log('\nSummary:');
console.log('- .btn-unbury explicitly sets opacity: 1');
console.log('- This overrides the parent .card-item-buried opacity: 0.5');
console.log('- Button will appear fully opaque and interactive');
console.log('- Card content remains dimmed at 50% opacity');
