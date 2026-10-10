// Test Study Session Feature
// This test verifies the basic session functionality

// Helper to create a fresh app instance
function createTestApp() {
    // Clear localStorage
    localStorage.clear();
    
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
console.assert(app1.showingOptions === false, 'Should not be showing options initially');
console.assert(app1.sessionCards.length === 0, 'Session cards should be empty');
console.assert(app1.sessionReviewedCards.size === 0, 'No cards should be reviewed');
console.log('✓ Test 1 passed');

// Test 2: First click on start session - shows options
console.log('\nTest 2: First click shows options...');
const app2 = createTestApp();
app2.startSession(); // First click
console.assert(app2.showingOptions === true, 'Should be showing options after first click');
console.assert(app2.inSession === false, 'Should not be in session yet');
console.assert(app2.sessionCards.length === 0, 'Session cards should still be empty');
console.log('✓ Test 2 passed');

// Test 3: Second click on start session - starts actual session
console.log('\nTest 3: Second click starts session...');
const app3 = createTestApp();
app3.startSession(); // First click - show options
app3.startSession(); // Second click - start session
console.assert(app3.inSession === true, 'Should be in session after second click');
console.assert(app3.sessionCards.length === 4, 'Should have 4 session cards');
console.assert(app3.currentCardIndex === 0, 'Should start at first card');
console.assert(app3.sessionReviewedCards.size === 0, 'No cards reviewed yet');
console.log('✓ Test 3 passed');

// Test 4: Mark card as easy in session
console.log('\nTest 4: Mark card as easy...');
const app4 = createTestApp();
app4.startSession(); // First click - show options
app4.startSession(); // Second click - start session
const firstCardId = app4.sessionCards[0].id;
app4.markEasy(); // This is async with setTimeout, so we test the sync part
setTimeout(() => {
    console.assert(app4.sessionReviewedCards.has(firstCardId), 'First card should be marked as reviewed');
    console.log('✓ Test 4 passed');
}, 400);

// Test 5: Session completion check
console.log('\nTest 5: Session completion...');
const app5 = createTestApp();
app5.startSession(); // First click - show options
app5.startSession(); // Second click - start session
// Mark all cards as reviewed
app5.sessionCards.forEach(card => {
    app5.sessionReviewedCards.add(card.id);
});
console.assert(app5.isSessionComplete() === true, 'Session should be complete when all cards reviewed');
console.log('✓ Test 5 passed');

// Test 6: End session
console.log('\nTest 6: End session...');
const app6 = createTestApp();
app6.startSession(); // First click - show options
app6.startSession(); // Second click - start session
app6.endSession();
console.assert(app6.inSession === false, 'Should not be in session after end');
console.assert(app6.showingOptions === false, 'Should not be showing options after end');
console.assert(app6.sessionCards.length === 0, 'Session cards should be cleared');
console.assert(app6.sessionReviewedCards.size === 0, 'Reviewed cards should be cleared');
console.log('✓ Test 6 passed');

// Test 7: getFilteredCards in session mode
console.log('\nTest 7: getFilteredCards in session...');
const app7 = createTestApp();
app7.startSession(); // First click - show options
app7.startSession(); // Second click - start session
const filteredInSession = app7.getFilteredCards();
console.assert(filteredInSession === app7.sessionCards, 'Should return session cards when in session');
console.log('✓ Test 7 passed');

// Test 8: Review queue in session
console.log('\nTest 8: Review queue in session...');
const app8 = createTestApp();
app8.startSession(); // First click - show options
app8.startSession(); // Second click - start session
const cardToReview = app8.sessionCards[0];
app8.reviewQueue.push(cardToReview.id);
const filtered = app8.getFilteredCards();
console.assert(filtered[filtered.length - 1].id === cardToReview.id, 'Queued card should be at end');
console.log('✓ Test 8 passed');

// Test 9: Direction change blocked during session
console.log('\nTest 9: Direction change blocked in session...');
const app9 = createTestApp();
app9.direction = 'bg-en';
app9.startSession(); // First click - show options
app9.startSession(); // Second click - start session
app9.setDirection('en-bg');
console.assert(app9.direction === 'bg-en', 'Direction should not change during session');
app9.endSession();
app9.setDirection('en-bg');
console.assert(app9.direction === 'en-bg', 'Direction should change when not in session');
console.log('✓ Test 9 passed');

// Test 10: Category filtering before session
console.log('\nTest 10: Category filtering before session...');
const app10 = createTestApp();
app10.setActiveCategories(['Food']);
app10.startSession(); // First click - show options
app10.startSession(); // Second click - start session
console.assert(app10.sessionCards.length === 2, 'Should only have Food category cards (2 cards)');
console.log('✓ Test 10 passed');

// Test 11: Session cards snapshot
console.log('\nTest 11: Session cards are a snapshot...');
const app11 = createTestApp();
app11.startSession(); // First click - show options
app11.startSession(); // Second click - start session
const sessionLength = app11.sessionCards.length;
app11.addCard('Нов', 'New', 'Test'); // Add a card during session
console.assert(app11.sessionCards.length === sessionLength, 'Session cards should not include new cards');
console.log('✓ Test 11 passed');

// Test 12: No cards with selected categories
console.log('\nTest 12: Alert when no cards match selected categories...');
const app12 = createTestApp();
app12.setActiveCategories(['NonExistentCategory']);
app12.startSession(); // First click - show options
// Mock alert to prevent actual alert dialog
const originalAlert = window.alert;
let alertCalled = false;
window.alert = function(msg) { alertCalled = true; };
app12.startSession(); // Second click - should show alert
console.assert(alertCalled === true, 'Should show alert when no cards match');
console.assert(app12.inSession === false, 'Should not start session when no cards match');
window.alert = originalAlert; // Restore original alert
console.log('✓ Test 12 passed');

console.log('\n========================================');
console.log('All session tests completed successfully! ✓');
console.log('========================================');
