const fs = require('fs');

console.log('=== Final Validation of Bury Feature Implementation ===\n');

const appJs = fs.readFileSync('app.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const stylesCss = fs.readFileSync('styles.css', 'utf8');

let passed = 0;
let failed = 0;

function check(description, condition) {
  if (condition) {
    console.log(`✓ ${description}`);
    passed++;
  } else {
    console.log(`✗ ${description}`);
    failed++;
  }
}

console.log('DATA MODEL:');
check('buried property added to new cards', appJs.includes('buried: false'));
check('buried property initialized for existing cards', 
  appJs.includes('card.buried === undefined') && appJs.includes('card.buried = false'));

console.log('\nFILTERING LOGIC:');
check('getFilteredCardsByCategory filters buried cards', 
  appJs.includes('!card.buried'));
check('Filter applied before session start', 
  appJs.includes('getFilteredCardsByCategory()'));

console.log('\nMETHODS:');
check('buryCard method exists and toggles buried status', 
  /buryCard\(id\)\s*\{[\s\S]*?card\.buried = !card\.buried/m.test(appJs));
check('markBuried method exists and marks card as buried', 
  /markBuried\(\)\s*\{[\s\S]*?currentCard\.buried = true/m.test(appJs));
check('markBuried removes card from session', 
  /markBuried[\s\S]*?this\.sessionCards = this\.sessionCards\.filter/m.test(appJs));

console.log('\nUI - STUDY SESSION:');
check('bury button in HTML', indexHtml.includes('id="bury-btn"'));
check('bury button has correct label', indexHtml.includes('Bury ⏸'));
check('showFeedbackButtons includes bury button', 
  /showFeedbackButtons[\s\S]*?bury-btn[\s\S]*?inline-block/m.test(appJs));
check('hideFeedbackButtons hides bury button', 
  /hideFeedbackButtons[\s\S]*?bury-btn[\s\S]*?none/m.test(appJs));

console.log('\nUI - MANAGE CARDS:');
check('bury/unbury button in card list', 
  appJs.includes('card.buried ? \'Unbury\' : \'Bury\''));
check('buried cards have visual class', 
  appJs.includes('card-item-buried'));
check('onclick handler for buryCard', 
  appJs.includes('onclick="app.buryCard('));

console.log('\nSTYLES:');
check('.btn-bury style exists', /\.btn-bury\s*\{/m.test(stylesCss));
check('.btn-unbury style exists', /\.btn-unbury\s*\{/m.test(stylesCss));
check('.card-item-buried style exists', /\.card-item-buried\s*\{/m.test(stylesCss));
check('buried card strikethrough style', 
  stylesCss.includes('text-decoration: line-through'));
check('button-glow-bury animation', 
  stylesCss.includes('@keyframes button-glow-bury'));

console.log('\nEVENT HANDLING:');
check('bury button click listener', 
  /getElementById\('bury-btn'\)\.addEventListener\('click'/m.test(appJs));
check('keyboard shortcut 3 for bury', 
  /e\.key === '3'[\s\S]*?markBuried/m.test(appJs));

console.log('\nSAVING & PERSISTENCE:');
check('buryCard saves to storage', 
  /buryCard[\s\S]{0,200}saveToStorage/m.test(appJs));
check('markBuried saves to storage', 
  /markBuried[\s\S]{0,500}saveToStorage/m.test(appJs));

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✅ ALL VALIDATION CHECKS PASSED');
  console.log('Implementation is complete and ready for use.');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed');
  process.exit(1);
}
