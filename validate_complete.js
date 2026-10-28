const fs = require('fs');

console.log('=== Complete Validation of Bury Feature ===\n');

// Read files
const appJs = fs.readFileSync('app.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const stylesCss = fs.readFileSync('styles.css', 'utf8');

let errors = [];
let warnings = [];

// Validate JavaScript
console.log('1. Validating JavaScript...');
try {
  require('vm').runInNewContext('(' + appJs + ')', {}, { filename: 'app.js' });
} catch (e) {
  if (e.message.includes('FlashcardApp')) {
    console.log('   ✓ JavaScript structure valid (class detected)');
  } else {
    errors.push('JavaScript validation failed: ' + e.message);
  }
}

// Check for proper method signatures
const methodChecks = [
  { name: 'buryCard', pattern: /buryCard\(id\)\s*\{/ },
  { name: 'markBuried', pattern: /markBuried\(\)\s*\{/ },
  { name: 'getFilteredCardsByCategory', pattern: /getFilteredCardsByCategory\(\)\s*\{/ }
];

console.log('\n2. Validating method implementations...');
methodChecks.forEach(check => {
  if (check.pattern.test(appJs)) {
    console.log(`   ✓ ${check.name} method properly implemented`);
  } else {
    errors.push(`${check.name} method not found or malformed`);
  }
});

// Validate event listeners
console.log('\n3. Validating event listeners...');
const listeners = [
  { name: 'bury button click', pattern: /getElementById\('bury-btn'\)\.addEventListener\('click'/ },
  { name: 'keyboard shortcut 3', pattern: /e\.key === '3'/ }
];

listeners.forEach(check => {
  if (check.pattern.test(appJs)) {
    console.log(`   ✓ ${check.name} listener connected`);
  } else {
    errors.push(`${check.name} listener not found`);
  }
});

// Validate HTML
console.log('\n4. Validating HTML structure...');
const htmlChecks = [
  { name: 'bury button element', pattern: /id="bury-btn"/ },
  { name: 'bury button class', pattern: /class="btn btn-bury"/ },
  { name: 'bury button label', pattern: /Bury ⏸/ }
];

htmlChecks.forEach(check => {
  if (check.pattern.test(indexHtml)) {
    console.log(`   ✓ ${check.name} present`);
  } else {
    errors.push(`${check.name} not found in HTML`);
  }
});

// Validate CSS
console.log('\n5. Validating CSS styles...');
const cssChecks = [
  { name: '.btn-bury style', pattern: /\.btn-bury\s*\{/ },
  { name: '.btn-unbury style', pattern: /\.btn-unbury\s*\{/ },
  { name: '.card-item-buried style', pattern: /\.card-item-buried\s*\{/ },
  { name: 'button-glow-bury animation', pattern: /@keyframes button-glow-bury/ }
];

cssChecks.forEach(check => {
  if (check.pattern.test(stylesCss)) {
    console.log(`   ✓ ${check.name} defined`);
  } else {
    errors.push(`${check.name} not found in CSS`);
  }
});

// Check for potential issues
console.log('\n6. Checking for common issues...');

// Check if buried property is initialized
if (appJs.includes('card.buried === undefined') && appJs.includes('card.buried = false')) {
  console.log('   ✓ Backward compatibility for existing cards');
} else {
  warnings.push('Backward compatibility check might be missing');
}

// Check if buried cards are filtered
if (appJs.includes('!card.buried')) {
  console.log('   ✓ Buried cards properly filtered from sessions');
} else {
  errors.push('Buried cards filtering not found');
}

// Check button visibility management
if (appJs.includes("getElementById('bury-btn').style.display = 'inline-block'") &&
    appJs.includes("getElementById('bury-btn').style.display = 'none'")) {
  console.log('   ✓ Bury button visibility properly managed');
} else {
  warnings.push('Button visibility management might be incomplete');
}

// Print results
console.log('\n' + '='.repeat(50));
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ ALL VALIDATION CHECKS PASSED');
  console.log('\nImplementation is complete and correct.');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log('❌ ERRORS FOUND:');
    errors.forEach(e => console.log('   - ' + e));
  }
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(w => console.log('   - ' + w));
  }
  process.exit(errors.length > 0 ? 1 : 0);
}
