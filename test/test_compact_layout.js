#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== Testing Compact Layout Structure ===\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`✓ ${description}`);
        passed++;
    } catch (e) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${e.message}`);
        failed++;
    }
}

// Read files
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

// Test 1: Verify study-options still exists
test('Check study-options container exists in HTML', () => {
    if (!htmlContent.includes('class="study-options"')) {
        throw new Error('study-options container not found');
    }
});

// Test 2: Verify HTML structure contains both elements
test('Check HTML contains category-filter and direction-selector', () => {
    if (!htmlContent.includes('class="category-filter-inline"')) {
        throw new Error('category-filter-inline not found in HTML');
    }
    if (!htmlContent.includes('class="direction-selector"')) {
        throw new Error('direction-selector not found in HTML');
    }
    // Check they appear in the correct order (category-filter before direction-selector)
    const categoryPos = htmlContent.indexOf('class="category-filter-inline"');
    const directionPos = htmlContent.indexOf('class="direction-selector"');
    if (categoryPos === -1 || directionPos === -1 || categoryPos > directionPos) {
        throw new Error('Elements should be in correct order');
    }
});

// Test 3: Verify CSS has flex-direction: row for study-options
test('Check CSS has horizontal flex layout for study-options', () => {
    const studyOptionsStyles = cssContent.match(/\.study-options\s*\{[^}]*\}/);
    if (!studyOptionsStyles) {
        throw new Error('.study-options CSS not found');
    }
    const styles = studyOptionsStyles[0];
    if (!styles.includes('flex-direction: row') && !styles.includes('flex-direction:row')) {
        throw new Error('study-options should have flex-direction: row');
    }
});

// Test 4: Verify CSS has flex-wrap for study-options
test('Check CSS has flex-wrap for study-options', () => {
    const studyOptionsStyles = cssContent.match(/\.study-options\s*\{[^}]*\}/);
    const styles = studyOptionsStyles[0];
    if (!styles.includes('flex-wrap: wrap') && !styles.includes('flex-wrap:wrap')) {
        throw new Error('study-options should have flex-wrap: wrap');
    }
});

// Test 5: Verify category-filter-inline has horizontal layout
test('Check CSS has horizontal layout for category-filter-inline', () => {
    const categoryFilterStyles = cssContent.match(/\.category-filter-inline\s*\{[^}]*\}/);
    if (!categoryFilterStyles) {
        throw new Error('.category-filter-inline CSS not found');
    }
    const styles = categoryFilterStyles[0];
    if (!styles.includes('flex-direction: row') && !styles.includes('flex-direction:row')) {
        throw new Error('category-filter-inline should have flex-direction: row');
    }
});

// Test 6: Verify category-filter-inline has flex: 1
test('Check category-filter-inline is flexible to use available space', () => {
    const categoryFilterStyles = cssContent.match(/\.category-filter-inline\s*\{[^}]*\}/);
    const styles = categoryFilterStyles[0];
    if (!styles.includes('flex: 1') && !styles.includes('flex:1')) {
        throw new Error('category-filter-inline should have flex: 1');
    }
});

// Test 7: Verify category-checkboxes has flex-wrap
test('Check category-checkboxes can wrap', () => {
    const checkboxesStyles = cssContent.match(/\.category-checkboxes\s*\{[^}]*\}/);
    if (!checkboxesStyles) {
        throw new Error('.category-checkboxes CSS not found');
    }
    const styles = checkboxesStyles[0];
    if (!styles.includes('flex-wrap: wrap') && !styles.includes('flex-wrap:wrap')) {
        throw new Error('category-checkboxes should have flex-wrap: wrap');
    }
});

// Test 8: Verify direction-selector has flex-shrink: 0
test('Check direction-selector does not shrink', () => {
    const directionStyles = cssContent.match(/\.direction-selector\s*\{[^}]*\}/);
    if (!directionStyles) {
        throw new Error('.direction-selector CSS not found');
    }
    const styles = directionStyles[0];
    if (!styles.includes('flex-shrink: 0') && !styles.includes('flex-shrink:0')) {
        throw new Error('direction-selector should have flex-shrink: 0');
    }
});

// Test 9: Verify mobile responsiveness
test('Check mobile styles stack vertically', () => {
    const mediaQuery = cssContent.match(/@media[^{]*\(max-width:\s*600px\)[^{]*\{([^}]*\{[^}]*\})*[^}]*\.study-options[^}]*\{[^}]*flex-direction:\s*column/);
    if (!mediaQuery) {
        throw new Error('Mobile styles should set study-options to flex-direction: column');
    }
});

// Test 10: Verify category heading has white-space: nowrap
test('Check category heading stays on one line', () => {
    const headingStyles = cssContent.match(/\.category-filter-inline\s+h3\s*\{[^}]*\}/);
    if (!headingStyles) {
        throw new Error('.category-filter-inline h3 CSS not found');
    }
    const styles = headingStyles[0];
    if (!styles.includes('white-space: nowrap') && !styles.includes('white-space:nowrap')) {
        throw new Error('category heading should have white-space: nowrap');
    }
});

console.log('\n=== Test Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed === 0) {
    console.log('\n✅ All layout tests passed!');
} else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
}
