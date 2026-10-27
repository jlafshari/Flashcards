/**
 * Simple CSS syntax validation
 * Checks for common CSS syntax errors
 */

const fs = require('fs');
const path = require('path');

console.log('=== CSS Syntax Validation ===\n');

const cssPath = path.join(__dirname, 'styles.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

let errors = 0;

// Check for balanced braces
const openBraces = (cssContent.match(/{/g) || []).length;
const closeBraces = (cssContent.match(/}/g) || []).length;

console.log('Checking brace balance...');
if (openBraces === closeBraces) {
    console.log(`✓ Braces balanced: ${openBraces} opening, ${closeBraces} closing`);
} else {
    console.log(`✗ Braces unbalanced: ${openBraces} opening, ${closeBraces} closing`);
    errors++;
}

// Check for basic CSS structure (selector { property: value; })
console.log('\nChecking CSS structure...');
const cssBlocks = cssContent.match(/[^}]+\{[^}]*\}/g) || [];
console.log(`✓ Found ${cssBlocks.length} CSS rule blocks`);

// Check for property without semicolon (common error)
console.log('\nChecking for missing semicolons...');
const lines = cssContent.split('\n');
let missingSemicolons = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip empty lines, comments, and closing braces
    if (line === '' || line.startsWith('/*') || line.startsWith('*') || line.startsWith('*/') || line === '}' || line.endsWith('{')) {
        continue;
    }
    // Check if line looks like a property but doesn't end with semicolon
    if (line.includes(':') && !line.endsWith(';') && !line.endsWith('{') && !line.startsWith('@')) {
        missingSemicolons++;
        console.log(`  Line ${i + 1}: ${line}`);
    }
}

if (missingSemicolons === 0) {
    console.log('✓ No obvious missing semicolons detected');
} else {
    console.log(`⚠ Found ${missingSemicolons} potential missing semicolons (may be false positives)`);
}

// Check specific rules we modified
console.log('\nChecking modified CSS rules...');

// Check .btn-bury
const btnBuryMatch = cssContent.match(/\.btn-bury\s*{([^}]*)}/s);
if (btnBuryMatch) {
    const content = btnBuryMatch[1];
    const contentWithoutComments = content.replace(/\/\*.*?\*\//gs, '').trim();
    const hasPadding = /padding:\s*\d+px/.test(contentWithoutComments);
    const hasFontSize = /font-size:\s*[\d.]+em/.test(contentWithoutComments);
    
    if (!hasPadding && !hasFontSize) {
        console.log('✓ .btn-bury correctly inherits sizing from .btn');
    } else {
        console.log('✗ .btn-bury still has custom padding or font-size');
        errors++;
    }
} else {
    console.log('✗ .btn-bury rule not found');
    errors++;
}

// Check .card-item-actions .btn
const cardItemActionsMatch = cssContent.match(/\.card-item-actions\s+\.btn\s*{([^}]*)}/s);
if (cardItemActionsMatch) {
    const content = cardItemActionsMatch[1];
    const hasPadding = /padding:\s*8px\s+16px/.test(content);
    const hasFontSize = /font-size:\s*0\.9em/.test(content);
    
    if (hasPadding && hasFontSize) {
        console.log('✓ .card-item-actions .btn has correct smaller sizing');
    } else {
        console.log('✗ .card-item-actions .btn sizing incorrect');
        errors++;
    }
} else {
    console.log('✗ .card-item-actions .btn rule not found');
    errors++;
}

console.log('\n=== Summary ===');
if (errors === 0) {
    console.log('✓ CSS validation passed - no errors detected');
    process.exit(0);
} else {
    console.log(`✗ CSS validation failed - ${errors} error(s) detected`);
    process.exit(1);
}
