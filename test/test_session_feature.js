// Test Study Session Feature
// This test verifies the basic session functionality

// Helper to create a fresh app instance
require('./dom-mock.js');

// Load the FlashcardApp class (app.js declares it but does not export it)
const fs = require('fs');
const path = require('path');
eval(fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8') + '; global.FlashcardApp = FlashcardApp;');

function createTestApp() {
    // Clear localStorage
    localStorage.clear();
    localStorage.setItem('flashcards', '[]'); // empty deck, not the sample cards
    
    // Create a new app instance
    const app = new FlashcardApp();
    
    // Add some test cards
    app.addCard('Здравей', 'Hello', 'Greetings');
    app.addCard('Довиждане', 'Goodbye', 'Greetings');
    app.addCard('Хляб', 'Bread', 'Food');
    app.addCard('Вода', 'Water', 'Food');
    
    return app;
}

// Test 1: Initial state - not in session
console.log('Test 1: Initial state...');
const app1 = createTestApp();
console.assert(app1.inSession === false, 'Should not be in session initially');
console.assert(app1.sessionCards.length === 0, 'Session cards should be empty');
console.assert(app1.sessionReviewedCards.size === 0, 'No cards should be reviewed');
console.log('✓ Test 1 passed');

// Test 2: Start session - starts immediately
console.log('\nTest 2: Start session...');
const app2 = createTestApp();
app2.startSession();
console.assert(app2.inSession === true, 'Should be in session after click');
console.assert(app2.sessionCards.length === 4, 'Should have 4 session cards');
console.assert(app2.currentCardIndex === 0, 'Should start at first card');
console.assert(app2.sessionReviewedCards.size === 0, 'No cards reviewed yet');
console.log('✓ Test 2 passed');

// Test 3: (Removed - no longer applicable with one-step flow)

// Test 3: Mark card as easy in session
console.log('\nTest 3: Mark card as easy...');
const app3 = createTestApp();
app3.startSession();
const firstCardId = app3.sessionCards[0].id;
app3.markEasy(); // This is async with setTimeout, so we test the sync part
setTimeout(() => {
    console.assert(app3.sessionReviewedCards.has(firstCardId), 'First card should be marked as reviewed');
    console.log('✓ Test 3 passed');
}, 400);

// Test 4: Session completion check
console.log('\nTest 4: Session completion...');
const app4 = createTestApp();
app4.startSession();
// Mark all cards as reviewed
app4.sessionCards.forEach(card => {
    app4.sessionReviewedCards.add(card.id);
});
console.assert(app4.isSessionComplete() === true, 'Session should be complete when all cards reviewed');
console.log('✓ Test 4 passed');

// Test 5: End session
console.log('\nTest 5: End session...');
const app5 = createTestApp();
app5.startSession();
app5.endSession();
console.assert(app5.inSession === false, 'Should not be in session after end');
console.assert(app5.sessionCards.length === 0, 'Session cards should be cleared');
console.assert(app5.sessionReviewedCards.size === 0, 'Reviewed cards should be cleared');
console.log('✓ Test 5 passed');

// Test 6: getFilteredCards in session mode
console.log('\nTest 6: getFilteredCards in session...');
const app6 = createTestApp();
app6.startSession();
const filteredInSession = app6.getFilteredCards();
console.assert(filteredInSession === app6.sessionCards, 'Should return session cards when in session');
console.log('✓ Test 6 passed');

// Test 7: Review queue in session
console.log('\nTest 7: Review queue in session...');
const app7 = createTestApp();
app7.startSession();
const cardToReview = app7.sessionCards[0];
app7.reviewQueue.push(cardToReview.id);
const filtered = app7.getFilteredCards();
console.assert(filtered[filtered.length - 1].id === cardToReview.id, 'Queued card should be at end');
console.log('✓ Test 7 passed');

// Test 8: Direction change blocked during session
console.log('\nTest 8: Direction change blocked in session...');
const app8 = createTestApp();
app8.direction = 'bg-en';
app8.startSession();
app8.setDirection('en-bg');
console.assert(app8.direction === 'bg-en', 'Direction should not change during session');
app8.endSession();
app8.setDirection('en-bg');
console.assert(app8.direction === 'en-bg', 'Direction should change when not in session');
console.log('✓ Test 8 passed');

// Test 9: Category filtering before session
console.log('\nTest 9: Category filtering before session...');
const app9 = createTestApp();
app9.setActiveCategories(['Food']);
app9.startSession();
console.assert(app9.sessionCards.length === 2, 'Should only have Food category cards (2 cards)');
console.log('✓ Test 9 passed');

// Test 10: Session cards snapshot
console.log('\nTest 10: Session cards are a snapshot...');
const app10 = createTestApp();
app10.startSession();
const sessionLength = app10.sessionCards.length;
app10.addCard('Нов', 'New', 'Test'); // Add a card during session
console.assert(app10.sessionCards.length === sessionLength, 'Session cards should not include new cards');
console.log('✓ Test 10 passed');

// Test 11: No cards with selected categories
console.log('\nTest 11: Alert when no cards match selected categories...');
const app11 = createTestApp();
app11.setActiveCategories(['NonExistentCategory']);
// Mock alert to prevent actual alert dialog
const originalAlert = global.alert;
let alertCalled = false;
global.alert = function(msg) { alertCalled = true; };
app11.startSession(); // Should show alert
console.assert(alertCalled === true, 'Should show alert when no cards match');
console.assert(app11.inSession === false, 'Should not start session when no cards match');
global.alert = originalAlert; // Restore original alert
console.log('✓ Test 11 passed');

console.log('\n========================================');
console.log('All session tests completed successfully! ✓');
console.log('========================================');
