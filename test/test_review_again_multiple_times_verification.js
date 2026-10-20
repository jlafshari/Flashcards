// Verification test: Review Again button allows multiple reviews of the same card
// This test verifies that users can press "Review Again" on the same card multiple times

// Minimal localStorage mock for Node.js
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = String(value); },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};

// Mock alert
global.alert = () => {};

// Minimal DOM mock
const createMockElement = () => ({
    textContent: '', 
    style: {},
    value: '',
    innerHTML: '',
    dataset: {},
    files: [],
    classList: { 
        add: () => {}, 
        remove: () => {}, 
        toggle: () => {} 
    },
    disabled: false,
    addEventListener: () => {},
    click: () => {},
    focus: () => {},
    setAttribute: () => {},
    appendChild: () => {},
    removeChild: () => {},
    querySelectorAll: () => []
});

global.document = {
    getElementById: () => createMockElement(),
    querySelectorAll: () => [],
    querySelector: (selector) => {
        if (selector === '.stats') {
            return createMockElement();
        }
        return { id: 'study-tab' };
    },
    createElement: () => createMockElement(),
    body: createMockElement(),
    addEventListener: () => {}
};

// Read and execute app.js
const fs = require('fs');
let appJs = fs.readFileSync('../app.js', 'utf8');
appJs = appJs.replace('const app = new FlashcardApp();', '');
appJs = appJs.replace('class FlashcardApp {', 'global.FlashcardApp = class FlashcardApp {');
eval(appJs);

const FlashcardApp = global.FlashcardApp;

console.log('=== Review Again Multiple Times - Verification Test ===\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ ${message}`);
        testsPassed++;
    } else {
        console.log(`  ❌ ${message}`);
        testsFailed++;
    }
}

// Test 1: Basic scenario - review a card twice
console.log('Test 1: Review Card1 → Easy Card2 → Review Card1 again → Review Card1 again');
console.log('-----------------------------------------------------------------------------');
localStorage.clear();
const app1 = new FlashcardApp();

app1.cards = [
    { id: 1, bulgarian: 'Card 1', english: 'One', category: 'Test' },
    { id: 2, bulgarian: 'Card 2', english: 'Two', category: 'Test' }
];

app1.startSession();
console.log('Session started with 2 cards\n');

// Card 1: First review
app1.markForReview();
console.log('Action: Card 1 - Review Again (1st time)');

// Wait for animation timeout (300ms)
setTimeout(() => {
    assert(app1.reviewQueue.length === 1, 'Review queue has 1 entry');
    assert(app1.reviewQueue[0] === 1, 'Card 1 is in review queue');

    // Card 2: Easy
    app1.markEasy();
    console.log('\nAction: Card 2 - Easy');
    
    setTimeout(() => {
        // Now Card 1 should be visible again
        let filteredCards = app1.getFilteredCards();
        let currentCard = filteredCards[app1.currentCardIndex];
        console.log(`\nViewing: Card ${currentCard.id}`);
        assert(currentCard.id === 1, 'Card 1 is shown again');
        
        // Card 1: Second review
        app1.markForReview();
        console.log('\nAction: Card 1 - Review Again (2nd time)');
        
        setTimeout(() => {
            assert(app1.reviewQueue.length === 2, 'Review queue has 2 entries');
            assert(app1.reviewQueue.filter(id => id === 1).length === 2, 'Card 1 appears twice in review queue');
            
            // Card 1: Third review
            filteredCards = app1.getFilteredCards();
            currentCard = filteredCards[app1.currentCardIndex];
            console.log(`\nViewing: Card ${currentCard.id}`);
            assert(currentCard.id === 1, 'Card 1 is shown again (2nd time)');
            
            app1.markForReview();
            console.log('\nAction: Card 1 - Review Again (3rd time)');
            
            setTimeout(() => {
                assert(app1.reviewQueue.length === 3, 'Review queue has 3 entries');
                assert(app1.reviewQueue.filter(id => id === 1).length === 3, 'Card 1 appears three times in review queue');
                
                // Verify session continues
                filteredCards = app1.getFilteredCards();
                currentCard = filteredCards[app1.currentCardIndex];
                console.log(`\nViewing: Card ${currentCard.id}`);
                assert(currentCard.id === 1, 'Card 1 is shown again (3rd time)');
                assert(!app1.isSessionComplete() || filteredCards.slice(app1.currentCardIndex).length > 0, 'Session has not ended prematurely');
                
                console.log('\n' + '='.repeat(80));
                runTest2();
            }, 350);
        }, 350);
    }, 350);
}, 350);

function runTest2() {
    // Test 2: Multiple cards with multiple reviews
    console.log('\nTest 2: Complex scenario with 3 cards and multiple reviews');
    console.log('-----------------------------------------------------------');
    localStorage.clear();
    const app2 = new FlashcardApp();
    
    app2.cards = [
        { id: 1, bulgarian: 'Card 1', english: 'One', category: 'Test' },
        { id: 2, bulgarian: 'Card 2', english: 'Two', category: 'Test' },
        { id: 3, bulgarian: 'Card 3', english: 'Three', category: 'Test' }
    ];
    
    app2.startSession();
    console.log('Session started with 3 cards\n');
    
    // Card 1: Review
    app2.markForReview();
    console.log('Action: Card 1 - Review Again');
    
    setTimeout(() => {
        assert(app2.reviewQueue.length === 1, 'Queue: [1]');
        
        // Card 2: Review
        app2.markForReview();
        console.log('\nAction: Card 2 - Review Again');
        
        setTimeout(() => {
            assert(app2.reviewQueue.length === 2, 'Queue: [1, 2]');
            
            // Card 3: Easy
            app2.markEasy();
            console.log('\nAction: Card 3 - Easy');
            
            setTimeout(() => {
                // Now we should see Card 1 again
                let filteredCards = app2.getFilteredCards();
                let currentCard = filteredCards[app2.currentCardIndex];
                console.log(`\nViewing: Card ${currentCard.id}`);
                assert(currentCard.id === 1, 'Card 1 is shown from queue');
                
                // Card 1: Review again
                app2.markForReview();
                console.log('\nAction: Card 1 - Review Again (2nd time)');
                
                setTimeout(() => {
                    assert(app2.reviewQueue.length === 3, 'Queue length is 3');
                    assert(app2.reviewQueue.filter(id => id === 1).length === 2, 'Card 1 appears twice in queue');
                    
                    // Now we should see Card 2
                    filteredCards = app2.getFilteredCards();
                    currentCard = filteredCards[app2.currentCardIndex];
                    console.log(`\nViewing: Card ${currentCard.id}`);
                    assert(currentCard.id === 2, 'Card 2 is shown from queue');
                    
                    // Card 2: Easy this time
                    app2.markEasy();
                    console.log('\nAction: Card 2 - Easy');
                    
                    setTimeout(() => {
                        // Now we should see Card 1 again (second occurrence)
                        filteredCards = app2.getFilteredCards();
                        currentCard = filteredCards[app2.currentCardIndex];
                        console.log(`\nViewing: Card ${currentCard.id}`);
                        assert(currentCard.id === 1, 'Card 1 is shown again (2nd occurrence from queue)');
                        
                        // Card 1: Easy finally
                        app2.markEasy();
                        console.log('\nAction: Card 1 - Easy');
                        
                        setTimeout(() => {
                            // Session should have ended (not just be "complete")
                            // After the last card is marked Easy, showSessionComplete() is called
                            // which ends the session and clears the state
                            assert(!app2.inSession, 'Session has ended');
                            
                            printResults();
                        }, 350);
                    }, 350);
                }, 350);
            }, 350);
        }, 350);
    }, 350);
}

function printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('\n=== Test Results ===');
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    
    if (testsFailed === 0) {
        console.log('\n✓ All tests passed! Users can now review cards multiple times.');
    } else {
        console.log('\n❌ Some tests failed.');
        process.exit(1);
    }
    
    process.exit(0);
}
