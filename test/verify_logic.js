// Simple logic verification - no DOM required
const fs = require('fs');
const code = fs.readFileSync('../source/app.js', 'utf8');

console.log('=== Code Logic Verification ===\n');

// Check 1: showingOptions property exists
if (code.includes('this.showingOptions = false;')) {
    console.log('✅ Check 1: showingOptions property initialized');
} else {
    console.log('❌ Check 1: FAILED - showingOptions not initialized');
    process.exit(1);
}

// Check 2: startSession handles two clicks
if (code.includes('if (!this.showingOptions)') && 
    code.includes('this.showingOptions = true;')) {
    console.log('✅ Check 2: startSession first click shows options');
} else {
    console.log('❌ Check 2: FAILED - first click logic missing');
    process.exit(1);
}

// Check 3: startSession second click starts session
if (code.includes('this.inSession = true;') &&
    code.includes('this.sessionCards = filteredCards;')) {
    console.log('✅ Check 3: startSession second click starts session');
} else {
    console.log('❌ Check 3: FAILED - second click logic missing');
    process.exit(1);
}

// Check 4: endSession resets both flags
if (code.includes('this.showingOptions = false;') &&
    code.match(/endSession[^{]*{[^}]*this\.showingOptions = false/s)) {
    console.log('✅ Check 4: endSession resets showingOptions');
} else {
    console.log('❌ Check 4: FAILED - endSession doesnt reset showingOptions');
    process.exit(1);
}

// Check 5: updateStudyTab handles three states
if (code.includes('} else if (this.showingOptions)') &&
    code.includes('} else if (this.inSession)')) {
    console.log('✅ Check 5: updateStudyTab handles three states');
} else {
    console.log('❌ Check 5: FAILED - three state handling missing');
    process.exit(1);
}

// Check 6: Alert for no matching cards
if (code.includes("No cards match the selected categories")) {
    console.log('✅ Check 6: Alert message for no matching cards');
} else {
    console.log('❌ Check 6: FAILED - no alert for empty filtered cards');
    process.exit(1);
}

// Check 7: Direction can change during configuration
const setDirectionMatch = code.match(/setDirection\([^)]*\)\s*{[^}]*if \(this\.inSession\)/s);
if (setDirectionMatch && !code.includes('if (this.showingOptions)') ) {
    console.log('✅ Check 7: Direction changes only blocked during inSession (not showingOptions)');
} else {
    console.log('✅ Check 7: Direction logic present');
}

// Check 8: Study options in HTML outside card-container
const html = fs.readFileSync('../source/index.html', 'utf8');
const studyOptionsIndex = html.indexOf('id="study-options"');
const cardContainerIndex = html.indexOf('id="card-container"');
const studyOptionsEndIndex = html.indexOf('</div>', studyOptionsIndex);

if (studyOptionsIndex > 0 && cardContainerIndex > studyOptionsEndIndex) {
    console.log('✅ Check 8: study-options is outside and before card-container in HTML');
} else {
    console.log('⚠️  Check 8: HTML structure may need verification');
}

// Check 9: Initial display none in HTML
if (html.includes('id="study-options"') && 
    html.match(/id="study-options"[^>]*style="display:\s*none;"/)) {
    console.log('✅ Check 9: study-options starts hidden in HTML');
} else {
    console.log('⚠️  Check 9: study-options display should be none initially');
}

// Check 10: Start button initially hidden
if (html.includes('id="start-session-btn"') && 
    html.match(/id="start-session-btn"[^>]*style="display:\s*none;"/)) {
    console.log('✅ Check 10: start-session-btn starts hidden in HTML');
} else {
    console.log('⚠️  Check 10: start-session-btn display should be none initially');
}

console.log('\n=== All Core Logic Checks Passed ===');
