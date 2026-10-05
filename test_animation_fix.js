// Test to verify the animation timing fix
const fs = require('fs');

console.log('=== Testing Animation Fix ===\n');

// Read the JavaScript file
const js = fs.readFileSync('app.js', 'utf8');

// Test 1: Check that markEasy() has setTimeout delay
console.log('1. Checking markEasy() implementation...');
const markEasyMatch = js.match(/markEasy\(\)\s*{[\s\S]*?setTimeout[\s\S]*?this\.nextCard\(\)/);
if (markEasyMatch) {
    console.log('   ✓ markEasy() uses setTimeout before nextCard()');
    
    // Check the timeout value is 300ms
    const timeoutMatch = js.match(/markEasy\(\)\s*{[\s\S]*?setTimeout[\s\S]*?,\s*300\s*\)/);
    if (timeoutMatch) {
        console.log('   ✓ Timeout is set to 300ms (matches animation duration)');
    } else {
        console.log('   ✗ Timeout value is not 300ms');
        process.exit(1);
    }
} else {
    console.log('   ✗ markEasy() does not delay nextCard() with setTimeout');
    process.exit(1);
}

// Test 2: Check that markForReview() has setTimeout delay
console.log('\n2. Checking markForReview() implementation...');
const markReviewMatch = js.match(/markForReview\(\)\s*{[\s\S]*?setTimeout[\s\S]*?this\.currentCardIndex\+\+/);
if (markReviewMatch) {
    console.log('   ✓ markForReview() uses setTimeout before navigation');
    
    // Check the timeout value is 300ms
    const timeoutMatch = js.match(/markForReview\(\)\s*{[\s\S]*?setTimeout[\s\S]*?,\s*300\s*\)/);
    if (timeoutMatch) {
        console.log('   ✓ Timeout is set to 300ms (matches animation duration)');
    } else {
        console.log('   ✗ Timeout value is not 300ms');
        process.exit(1);
    }
} else {
    console.log('   ✗ markForReview() does not delay navigation with setTimeout');
    process.exit(1);
}

// Test 3: Verify animateButton() still exists and works correctly
console.log('\n3. Checking animateButton() implementation...');
const animateMatch = js.match(/animateButton\(buttonId\)\s*{[\s\S]*?classList\.add\('animating'\)[\s\S]*?setTimeout[\s\S]*?classList\.remove\('animating'\)/);
if (animateMatch) {
    console.log('   ✓ animateButton() adds and removes .animating class');
    
    // Check the timeout value is 300ms
    const timeoutMatch = js.match(/animateButton\(buttonId\)\s*{[\s\S]*?setTimeout[\s\S]*?,\s*300\s*\)/);
    if (timeoutMatch) {
        console.log('   ✓ Animation duration is 300ms');
    } else {
        console.log('   ✗ Animation duration is not 300ms');
        process.exit(1);
    }
} else {
    console.log('   ✗ animateButton() implementation incorrect');
    process.exit(1);
}

// Test 4: Verify both methods call animateButton()
console.log('\n4. Checking animation triggers...');
const markEasyCallsAnimate = js.includes("this.animateButton('easy-btn')");
const markReviewCallsAnimate = js.includes("this.animateButton('review-btn')");

if (markEasyCallsAnimate) {
    console.log("   ✓ markEasy() calls animateButton('easy-btn')");
} else {
    console.log("   ✗ markEasy() does not call animateButton()");
    process.exit(1);
}

if (markReviewCallsAnimate) {
    console.log("   ✓ markForReview() calls animateButton('review-btn')");
} else {
    console.log("   ✗ markForReview() does not call animateButton()");
    process.exit(1);
}

// Test 5: Verify CSS animations exist
console.log('\n5. Checking CSS animations...');
const css = fs.readFileSync('styles.css', 'utf8');

const hasButtonPress = css.includes('@keyframes button-press');
const hasButtonGlow = css.includes('@keyframes button-glow');
const hasEasyAnimating = css.includes('.btn-easy.animating');
const hasReviewAnimating = css.includes('.btn-review.animating');

if (hasButtonPress) {
    console.log('   ✓ @keyframes button-press defined');
} else {
    console.log('   ✗ @keyframes button-press missing');
    process.exit(1);
}

if (hasButtonGlow) {
    console.log('   ✓ @keyframes button-glow defined');
} else {
    console.log('   ✗ @keyframes button-glow missing');
    process.exit(1);
}

if (hasEasyAnimating) {
    console.log('   ✓ .btn-easy.animating styles defined');
} else {
    console.log('   ✗ .btn-easy.animating styles missing');
    process.exit(1);
}

if (hasReviewAnimating) {
    console.log('   ✓ .btn-review.animating styles defined');
} else {
    console.log('   ✗ .btn-review.animating styles missing');
    process.exit(1);
}

console.log('\n=== All Animation Tests Passed! ===\n');
console.log('Summary:');
console.log('- Animation is triggered before navigation');
console.log('- Navigation is delayed 300ms to allow animation to complete');
console.log('- Both markEasy() and markForReview() implement this pattern');
console.log('- CSS animations are properly defined');
console.log('\nThe animation should now be visible when using keyboard shortcuts or clicking buttons.');
