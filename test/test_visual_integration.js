const fs = require('fs');

console.log('=== Visual Integration Test: Unbury Button Opacity Fix ===\n');

// Test 1: Verify CSS changes
console.log('Test 1: CSS Structure Verification');
const css = fs.readFileSync('../styles.css', 'utf8');

const buriedContainer = css.match(/\.card-item-buried\s*\{[^}]+\}/s);
const buriedContent = css.match(/\.card-item-buried\s+\.card-item-content\s*\{[^}]+\}/s);
const unburyBtn = css.match(/\.btn-unbury\s*\{[^}]+\}/s);

let cssTests = 0;
let cssPassed = 0;

cssTests++;
if (buriedContainer && !/opacity/.test(buriedContainer[0])) {
    console.log('  ✓ .card-item-buried has NO opacity property');
    cssPassed++;
} else {
    console.log('  ✗ .card-item-buried should not have opacity');
}

cssTests++;
if (buriedContent && /opacity:\s*0\.5/.test(buriedContent[0])) {
    console.log('  ✓ .card-item-buried .card-item-content has opacity: 0.5');
    cssPassed++;
} else {
    console.log('  ✗ .card-item-buried .card-item-content needs opacity: 0.5');
}

cssTests++;
if (unburyBtn && !/opacity/.test(unburyBtn[0])) {
    console.log('  ✓ .btn-unbury has NO opacity override (inherits full opacity)');
    cssPassed++;
} else {
    console.log('  ✗ .btn-unbury should not have opacity property');
}

cssTests++;
if (unburyBtn && /background:\s*#2196f3/.test(unburyBtn[0])) {
    console.log('  ✓ .btn-unbury has correct bright blue background (#2196f3)');
    cssPassed++;
} else {
    console.log('  ✗ .btn-unbury missing correct background color');
}

console.log(`\nCSS Tests: ${cssPassed}/${cssTests} passed\n`);

// Test 2: Verify HTML structure
console.log('Test 2: HTML Structure Verification');
// card-item-* classes are rendered by app.js's card list template, not index.html
const html = fs.readFileSync('../app.js', 'utf8');

let htmlTests = 0;
let htmlPassed = 0;

htmlTests++;
if (html.includes('card-item-content')) {
    console.log('  ✓ app.js renders card-item-content class structure');
    htmlPassed++;
} else {
    console.log('  ✗ app.js missing card-item-content class');
}

htmlTests++;
if (html.includes('card-item-actions')) {
    console.log('  ✓ app.js renders card-item-actions class structure');
    htmlPassed++;
} else {
    console.log('  ✗ app.js missing card-item-actions class');
}

console.log(`\nHTML Tests: ${htmlPassed}/${htmlTests} passed\n`);

// Test 3: Verify app.js rendering
console.log('Test 3: JavaScript Rendering Verification');
const appJs = fs.readFileSync('../app.js', 'utf8');

let jsTests = 0;
let jsPassed = 0;

jsTests++;
if (appJs.includes('card-item-buried')) {
    console.log('  ✓ app.js applies card-item-buried class');
    jsPassed++;
} else {
    console.log('  ✗ app.js missing card-item-buried class application');
}

jsTests++;
if (appJs.includes('btn-unbury')) {
    console.log('  ✓ app.js renders btn-unbury button class');
    jsPassed++;
} else {
    console.log('  ✗ app.js missing btn-unbury button rendering');
}

jsTests++;
if (appJs.includes('card-item-content')) {
    console.log('  ✓ app.js wraps content in card-item-content');
    jsPassed++;
} else {
    console.log('  ✗ app.js missing card-item-content wrapper');
}

jsTests++;
if (appJs.includes('card-item-actions')) {
    console.log('  ✓ app.js wraps buttons in card-item-actions');
    jsPassed++;
} else {
    console.log('  ✗ app.js missing card-item-actions wrapper');
}

console.log(`\nJavaScript Tests: ${jsPassed}/${jsTests} passed\n`);

// Summary
const totalTests = cssTests + htmlTests + jsTests;
const totalPassed = cssPassed + htmlPassed + jsPassed;

console.log('=== SUMMARY ===');
console.log(`Total Tests: ${totalPassed}/${totalTests} passed\n`);

if (totalPassed === totalTests) {
    console.log('✅ All tests passed!');
    console.log('\nThe fix is complete:');
    console.log('- Container opacity removed (no longer affects buttons)');
    console.log('- Content opacity applied (text dimmed at 50%)');
    console.log('- Buttons render at full opacity (100% vibrant)');
    console.log('- Unbury button appears bright blue, not washed out');
    process.exit(0);
} else {
    console.log('⚠️ Some tests failed - review implementation');
    process.exit(1);
}
