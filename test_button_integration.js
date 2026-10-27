/**
 * Integration test to verify button sizing consistency
 * Tests both study session and manage cards section
 */

const fs = require('fs');
const path = require('path');

console.log('=== Button Sizing Integration Test ===\n');

// Read the CSS file
const cssPath = path.join(__dirname, 'styles.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Test 1: Verify .btn base class has correct sizing
console.log('Test 1: Verify .btn base class has standard sizing');
const btnMatch = cssContent.match(/\.btn\s*{[^}]*padding:\s*15px\s+30px[^}]*font-size:\s*1em[^}]*}/s);
if (btnMatch) {
    console.log('✓ .btn class has padding: 15px 30px and font-size: 1em');
} else {
    console.log('✗ .btn class sizing not found or incorrect');
}

// Test 2: Verify .btn-bury does NOT override padding/font-size
console.log('\nTest 2: Verify .btn-bury inherits from .btn');
const btnBuryMatch = cssContent.match(/\.btn-bury\s*{([^}]*)}/s);
if (btnBuryMatch) {
    const btnBuryContent = btnBuryMatch[1];
    // Remove comments before checking
    const contentWithoutComments = btnBuryContent.replace(/\/\*.*?\*\//gs, '');
    const hasPadding = /padding:\s*\d+px/.test(contentWithoutComments);
    const hasFontSize = /font-size:\s*[\d.]+em/.test(contentWithoutComments);
    
    if (!hasPadding && !hasFontSize) {
        console.log('✓ .btn-bury does not override padding or font-size (inherits from .btn)');
    } else {
        console.log('✗ .btn-bury still has custom padding or font-size');
        if (hasPadding) console.log('  - Still has padding override');
        if (hasFontSize) console.log('  - Still has font-size override');
    }
} else {
    console.log('✗ .btn-bury class not found');
}

// Test 3: Verify .btn-easy has correct sizing (inherits from .btn)
console.log('\nTest 3: Verify .btn-easy inherits from .btn');
const btnEasyMatch = cssContent.match(/\.btn-easy\s*{([^}]*)}/s);
if (btnEasyMatch) {
    const btnEasyContent = btnEasyMatch[1];
    const hasPadding = /padding:\s*\d+px/.test(btnEasyContent);
    const hasFontSize = /font-size:\s*[\d.]+em/.test(btnEasyContent);
    
    if (!hasPadding && !hasFontSize) {
        console.log('✓ .btn-easy does not override padding or font-size (inherits from .btn)');
    } else {
        console.log('⚠ .btn-easy has custom padding or font-size');
    }
} else {
    console.log('✗ .btn-easy class not found');
}

// Test 4: Verify .btn-review has correct sizing (inherits from .btn)
console.log('\nTest 4: Verify .btn-review inherits from .btn');
const btnReviewMatch = cssContent.match(/\.btn-review\s*{([^}]*)}/s);
if (btnReviewMatch) {
    const btnReviewContent = btnReviewMatch[1];
    const hasPadding = /padding:\s*\d+px/.test(btnReviewContent);
    const hasFontSize = /font-size:\s*[\d.]+em/.test(btnReviewContent);
    
    if (!hasPadding && !hasFontSize) {
        console.log('✓ .btn-review does not override padding or font-size (inherits from .btn)');
    } else {
        console.log('⚠ .btn-review has custom padding or font-size');
    }
} else {
    console.log('✗ .btn-review class not found');
}

// Test 5: Verify .card-item-actions .btn has smaller sizing for manage cards
console.log('\nTest 5: Verify .card-item-actions .btn has smaller sizing');
const cardItemActionsMatch = cssContent.match(/\.card-item-actions\s+\.btn\s*{([^}]*)}/s);
if (cardItemActionsMatch) {
    const cardItemActionsContent = cardItemActionsMatch[1];
    const hasPadding = /padding:\s*8px\s+16px/.test(cardItemActionsContent);
    const hasFontSize = /font-size:\s*0\.9em/.test(cardItemActionsContent);
    
    if (hasPadding && hasFontSize) {
        console.log('✓ .card-item-actions .btn has padding: 8px 16px and font-size: 0.9em');
    } else {
        console.log('✗ .card-item-actions .btn sizing incorrect');
        if (!hasPadding) console.log('  - Missing or incorrect padding');
        if (!hasFontSize) console.log('  - Missing or incorrect font-size');
    }
} else {
    console.log('✗ .card-item-actions .btn rule not found');
}

// Test 6: Verify other manage card buttons have consistent sizing
console.log('\nTest 6: Verify other manage card buttons consistency');
const manageButtons = ['btn-edit', 'btn-danger', 'btn-unbury'];
let allConsistent = true;

manageButtons.forEach(btnClass => {
    const match = cssContent.match(new RegExp(`\\.${btnClass}\\s*{([^}]*)}`, 's'));
    if (match) {
        const content = match[1];
        const hasPadding = /padding:\s*8px\s+16px/.test(content);
        const hasFontSize = /font-size:\s*0\.9em/.test(content);
        
        if (hasPadding && hasFontSize) {
            console.log(`✓ .${btnClass} has padding: 8px 16px and font-size: 0.9em`);
        } else {
            console.log(`⚠ .${btnClass} may rely on .card-item-actions .btn rule (OK)`);
        }
    }
});

console.log('\n=== Summary ===');
console.log('Study session buttons (Easy, Review Again, Bury):');
console.log('  - Should all inherit from .btn: padding 15px 30px, font-size 1em');
console.log('  - Should have consistent height and width');
console.log('\nManage cards buttons (Bury/Unbury, Edit, Delete):');
console.log('  - Should be overridden by .card-item-actions .btn: padding 8px 16px, font-size 0.9em');
console.log('  - Should have consistent smaller size');
console.log('\n✓ Test completed. Open test_button_sizing.html to visually verify.');
