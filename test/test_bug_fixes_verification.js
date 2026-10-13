#!/usr/bin/env node

// Verification test for bug fixes:
// 1. Save button requiring two presses
// 2. Hover animation moving cards

const fs = require('fs');
const path = require('path');

console.log('=== Bug Fix Verification ===\n');

let passCount = 0;
let failCount = 0;

function test(name, condition, details = '') {
    if (condition) {
        console.log(`✓ ${name}`);
        if (details) console.log(`  ${details}`);
        passCount++;
    } else {
        console.log(`✗ ${name}`);
        if (details) console.log(`  ${details}`);
        failCount++;
    }
}

// Read app.js
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

// Test 1: saveEdit method includes updateManageTab call
const saveEditMatch = appJs.match(/saveEdit\(id\)\s*\{[\s\S]*?^\s{4}\}/m);
const hasSaveEdit = !!saveEditMatch;
const saveEditBody = saveEditMatch ? saveEditMatch[0] : '';
const callsUpdateManageTab = saveEditBody.includes('this.updateManageTab()');
const callsAfterClearingEditId = saveEditBody.indexOf('this.updateManageTab()') > saveEditBody.indexOf('this.editingCardId = null');

test('Test 1: saveEdit method exists', hasSaveEdit);
test('Test 2: saveEdit calls updateManageTab()', callsUpdateManageTab,
    'This ensures the UI updates immediately after saving, fixing the double-click bug');
test('Test 3: updateManageTab is called after clearing editingCardId', callsAfterClearingEditId,
    'Ensures proper order of operations');

// Read styles.css
const stylesCSS = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

// Test 4: No hover animation on card-item
const hasCardItemHover = stylesCSS.includes('.card-item:hover');
const hasTransformTranslateX = stylesCSS.match(/\.card-item:hover[^}]*transform:\s*translateX/);

test('Test 4: .card-item:hover rule removed', !hasCardItemHover,
    'The hover animation that moved cards has been removed');
test('Test 5: No translateX transform on card-item hover', !hasTransformTranslateX,
    'Ensures cards do not move when hovered');

// Test 6: card-item still has basic styles
const hasCardItemStyle = stylesCSS.match(/\.card-item\s*\{[\s\S]*?\}/);
test('Test 6: .card-item styles still exist', !!hasCardItemStyle,
    'Basic card item styles are preserved');

console.log(`\n=== Summary ===`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount === 0) {
    console.log('\n✅ All bug fix verification tests passed!');
    process.exit(0);
} else {
    console.log(`\n❌ ${failCount} test(s) failed`);
    process.exit(1);
}
