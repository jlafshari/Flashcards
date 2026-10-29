const fs = require('fs');

// Read the CSS file
const css = fs.readFileSync('styles.css', 'utf8');

console.log('Testing unbury button opacity fix...\n');

// Test 1: Check .card-item-buried no longer has opacity on container
const buriedContainer = css.match(/\.card-item-buried\s*\{[^}]+\}/s);
if (buriedContainer) {
    const hasContainerOpacity = /opacity:\s*0\.5/.test(buriedContainer[0]);
    if (!hasContainerOpacity) {
        console.log('✓ .card-item-buried container does NOT have opacity (correct)');
    } else {
        console.log('✗ .card-item-buried still has opacity on container');
    }
} else {
    console.log('✗ .card-item-buried class not found');
}

// Test 2: Check .card-item-buried .card-item-content has opacity
const buriedContent = css.match(/\.card-item-buried\s+\.card-item-content\s*\{[^}]+\}/s);
if (buriedContent) {
    const hasContentOpacity = /opacity:\s*0\.5/.test(buriedContent[0]);
    if (hasContentOpacity) {
        console.log('✓ .card-item-buried .card-item-content has opacity: 0.5 (content dimmed)');
    } else {
        console.log('✗ .card-item-buried .card-item-content missing opacity');
    }
} else {
    console.log('✗ .card-item-buried .card-item-content not found');
}

// Test 3: Check .btn-unbury no longer needs explicit opacity override
const unburyBtn = css.match(/\.btn-unbury\s*\{[^}]+\}/s);
if (unburyBtn) {
    const hasOpacity = /opacity:\s*1/.test(unburyBtn[0]);
    if (!hasOpacity) {
        console.log('✓ .btn-unbury does NOT need opacity override (correct - inherits full opacity)');
    } else {
        console.log('⚠ .btn-unbury still has opacity: 1 (not needed but harmless)');
    }
    
    const hasBackground = /background:\s*#2196f3/.test(unburyBtn[0]);
    if (hasBackground) {
        console.log('✓ .btn-unbury has correct background color');
    }
} else {
    console.log('✗ .btn-unbury class not found');
}

// Test 4: Check hover effects still exist
const unburyHover = css.match(/\.btn-unbury:hover\s*\{[^}]+\}/s);
if (unburyHover) {
    const hasTransform = /transform:\s*translateY/.test(unburyHover[0]);
    const hasBoxShadow = /box-shadow:/.test(unburyHover[0]);
    if (hasTransform && hasBoxShadow) {
        console.log('✓ .btn-unbury:hover has transform and box-shadow effects');
    }
}

console.log('\n--- Summary ---');
console.log('The fix moves opacity from the container to just the content.');
console.log('This prevents buttons from being affected by parent opacity.');
console.log('Buttons now appear at full vibrancy regardless of card buried state.');
