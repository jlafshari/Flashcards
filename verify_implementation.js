// Quick verification script for bury feature implementation
const fs = require('fs');

console.log('=== Verifying Bury Card Implementation ===\n');

// Check app.js
const appJs = fs.readFileSync('app.js', 'utf8');
const checks = {
  'buried property in addCard': appJs.includes('buried: false'),
  'buried property initialization in loadFromStorage': appJs.includes('card.buried === undefined'),
  'buryCard method exists': appJs.includes('buryCard(id)'),
  'markBuried method exists': appJs.includes('markBuried()'),
  'getFilteredCardsByCategory filters buried cards': appJs.includes('card => !card.buried'),
  'bury button event listener': appJs.includes("getElementById('bury-btn').addEventListener"),
  'keyboard shortcut for 3': appJs.includes("e.key === '3'"),
  'showFeedbackButtons includes bury-btn': appJs.match(/showFeedbackButtons[\s\S]*?bury-btn[\s\S]*?inline-block/),
  'hideFeedbackButtons includes bury-btn': appJs.match(/hideFeedbackButtons[\s\S]*?bury-btn[\s\S]*?none/)
};

// Check index.html
const indexHtml = fs.readFileSync('index.html', 'utf8');
checks['bury button in HTML'] = indexHtml.includes('id="bury-btn"') && indexHtml.includes('Bury ⏸');

// Check styles.css
const stylesCss = fs.readFileSync('styles.css', 'utf8');
checks['btn-bury style exists'] = stylesCss.includes('.btn-bury');
checks['btn-unbury style exists'] = stylesCss.includes('.btn-unbury');
checks['card-item-buried style exists'] = stylesCss.includes('.card-item-buried');
checks['button-glow-bury animation exists'] = stylesCss.includes('@keyframes button-glow-bury');

// Print results
let allPassed = true;
for (const [check, passed] of Object.entries(checks)) {
  const status = passed ? '✓' : '✗';
  console.log(`${status} ${check}`);
  if (!passed) allPassed = false;
}

console.log('\n' + (allPassed ? '✅ All checks passed!' : '❌ Some checks failed'));
process.exit(allPassed ? 0 : 1);
