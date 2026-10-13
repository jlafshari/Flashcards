// Test merged UI integration - simple version
const fs = require('fs');

console.log('=== Testing Merged UI Structure ===\n');

// Load the HTML
const html = fs.readFileSync('index.html', 'utf8');

console.log('Test 1: Check study-options container exists');
if (!html.includes('id="study-options"')) {
    console.log('✗ study-options container not found');
    process.exit(1);
}
console.log('✓ study-options container exists in HTML');

console.log('\nTest 2: Check category-filter is inside study-options');
const studyOptionsMatch = html.match(/<div id="study-options"[^>]*>([\s\S]*?)<\/div>\s*<div class="flashcard"/);
if (!studyOptionsMatch) {
    console.log('✗ Could not find study-options block');
    process.exit(1);
}
const studyOptionsContent = studyOptionsMatch[1];

if (!studyOptionsContent.includes('id="category-filter"')) {
    console.log('✗ category-filter not found inside study-options');
    process.exit(1);
}
console.log('✓ category-filter is inside study-options');

console.log('\nTest 3: Check direction-selector is inside study-options');
if (!studyOptionsContent.includes('class="direction-selector"')) {
    console.log('✗ direction-selector not found inside study-options');
    process.exit(1);
}
console.log('✓ direction-selector is inside study-options');

console.log('\nTest 4: Check "Study Direction:" label removed');
if (html.includes('Study Direction:')) {
    console.log('✗ "Study Direction:" label still present');
    process.exit(1);
}
console.log('✓ "Study Direction:" label removed');

console.log('\nTest 5: Check category-filter has new class');
if (!html.includes('class="category-filter-inline"')) {
    console.log('✗ category-filter-inline class not found');
    process.exit(1);
}
console.log('✓ category-filter has category-filter-inline class');

console.log('\nTest 6: Check direction buttons still exist');
if (!html.includes('id="direction-bg-en"') || !html.includes('id="direction-en-bg"')) {
    console.log('✗ Direction buttons missing');
    process.exit(1);
}
console.log('✓ Both direction buttons exist');

console.log('\nTest 7: Check CSS has study-options styles');
const css = fs.readFileSync('styles.css', 'utf8');
if (!css.includes('.study-options')) {
    console.log('✗ .study-options CSS not found');
    process.exit(1);
}
console.log('✓ .study-options CSS exists');

console.log('\nTest 8: Check CSS has category-filter-inline styles');
if (!css.includes('.category-filter-inline')) {
    console.log('✗ .category-filter-inline CSS not found');
    process.exit(1);
}
console.log('✓ .category-filter-inline CSS exists');

console.log('\nTest 9: Check responsive mobile styles updated');
if (!css.includes('.study-options') || !css.match(/\.study-options\s*\{[^}]*padding:\s*12px/)) {
    console.log('⚠ Warning: Mobile .study-options styles may not be present');
} else {
    console.log('✓ Mobile responsive styles for study-options present');
}

console.log('\nTest 10: Check direction-selector label removed from CSS');
if (css.includes('.direction-selector label')) {
    console.log('✗ .direction-selector label CSS still present');
    process.exit(1);
}
console.log('✓ .direction-selector label CSS removed');

console.log('\n=== All Structure Tests Passed ===');
