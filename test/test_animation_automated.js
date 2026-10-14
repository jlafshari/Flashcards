/**
 * Automated test for button animation on keyboard shortcuts
 * Run with: node test_animation_automated.js
 */

const fs = require('fs');

console.log('=== Button Animation Test ===\n');

// Read the CSS file to verify animation classes exist
console.log('1. Checking CSS for animation styles...');
const css = fs.readFileSync('../source/styles.css', 'utf8');

const hasButtonPressAnimation = css.includes('@keyframes button-press');
const hasButtonGlowAnimation = css.includes('@keyframes button-glow');
const hasEasyAnimating = css.includes('.btn-easy.animating');
const hasReviewAnimating = css.includes('.btn-review.animating');

console.log(`   ✓ @keyframes button-press: ${hasButtonPressAnimation ? 'FOUND' : 'MISSING'}`);
console.log(`   ✓ @keyframes button-glow: ${hasButtonGlowAnimation ? 'FOUND' : 'MISSING'}`);
console.log(`   ✓ .btn-easy.animating: ${hasEasyAnimating ? 'FOUND' : 'MISSING'}`);
console.log(`   ✓ .btn-review.animating: ${hasReviewAnimating ? 'FOUND' : 'MISSING'}`);

// Read the JS file to verify animateButton method exists
console.log('\n2. Checking JavaScript for animation logic...');
const js = fs.readFileSync('../source/app.js', 'utf8');

const hasAnimateButtonMethod = js.includes('animateButton(buttonId)');
const hasEasyAnimation = js.includes("this.animateButton('easy-btn')");
const hasReviewAnimation = js.includes("this.animateButton('review-btn')");
const hasClassAdd = js.includes("button.classList.add('animating')");
const hasClassRemove = js.includes("button.classList.remove('animating')");
const hasTimeout = js.includes('setTimeout') && js.includes('300');

console.log(`   ✓ animateButton() method: ${hasAnimateButtonMethod ? 'FOUND' : 'MISSING'}`);
console.log(`   ✓ Easy button animation call: ${hasEasyAnimation ? 'FOUND' : 'MISSING'}`);
console.log(`   ✓ Review button animation call: ${hasReviewAnimation ? 'FOUND' : 'MISSING'}`);
console.log(`   ✓ classList.add('animating'): ${hasClassAdd ? 'FOUND' : 'MISSING'}`);
console.log(`   ✓ classList.remove('animating'): ${hasClassRemove ? 'FOUND' : 'MISSING'}`);
console.log(`   ✓ 300ms timeout: ${hasTimeout ? 'FOUND' : 'MISSING'}`);

// Summary
console.log('\n3. Summary:');
const allCssChecks = hasButtonPressAnimation && hasButtonGlowAnimation && 
                     hasEasyAnimating && hasReviewAnimating;
const allJsChecks = hasAnimateButtonMethod && hasEasyAnimation && 
                    hasReviewAnimation && hasClassAdd && hasClassRemove && hasTimeout;

if (allCssChecks && allJsChecks) {
    console.log('   ✅ ALL CHECKS PASSED - Animation system is properly implemented!');
    console.log('\n4. Manual Testing:');
    console.log('   Open index.html in a browser and:');
    console.log('   - Add some flashcards');
    console.log('   - Flip a card');
    console.log('   - Press "1" or "2" on keyboard');
    console.log('   - Observe the button pulse and glow effect');
    console.log('\n   Or open test_animation.html for isolated testing.');
    process.exit(0);
} else {
    console.log('   ❌ SOME CHECKS FAILED - Review the output above');
    process.exit(1);
}
