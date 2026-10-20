// Test to understand the exact scenario

const sessionCards = [
    { id: 1, name: 'Card 1' },
    { id: 2, name: 'Card 2' },
    { id: 3, name: 'Card 3' }
];

let reviewQueue = [];
let currentIndex = 0;

function getFilteredCards() {
    if (reviewQueue.length === 0) {
        return sessionCards;
    }
    
    const queuedIds = new Set(reviewQueue);
    const nonQueued = sessionCards.filter(c => !queuedIds.has(c.id));
    const queued = [];
    for (const id of reviewQueue) {
        const card = sessionCards.find(c => c.id === id);
        if (card) queued.push(card);
    }
    return [...nonQueued, ...queued];
}

console.log('=== Scenario from Test 2 ===\n');

// Start
console.log('Start:');
let filtered = getFilteredCards();
console.log(`  reviewQueue: [${reviewQueue}]`);
console.log(`  filtered: [${filtered.map(c => c.id)}]`);
console.log(`  index: ${currentIndex}, viewing: Card ${filtered[currentIndex].id}\n`);

// Card 1: Review
console.log('Action: Card 1 Review');
reviewQueue.push(1);
filtered = getFilteredCards();
console.log(`  reviewQueue: [${reviewQueue}]`);
console.log(`  filtered: [${filtered.map(c => c.id)}]`);
console.log(`  index: ${currentIndex}, viewing: Card ${filtered[currentIndex].id}\n`);

// Card 2: Review
console.log('Action: Card 2 Review');
reviewQueue.push(2);
filtered = getFilteredCards();
console.log(`  reviewQueue: [${reviewQueue}]`);
console.log(`  filtered: [${filtered.map(c => c.id)}]`);
console.log(`  index: ${currentIndex}, viewing: Card ${filtered[currentIndex].id}\n`);

// Card 3: Easy (increment index)
console.log('Action: Card 3 Easy');
currentIndex++;
filtered = getFilteredCards();
console.log(`  reviewQueue: [${reviewQueue}]`);
console.log(`  filtered: [${filtered.map(c => c.id)}]`);
console.log(`  index: ${currentIndex}, viewing: Card ${filtered[currentIndex].id}`);
console.log(`  ^ This should be Card 1 from the queue\n`);

// Card 1 (from queue): Review again
console.log('Action: Card 1 (from queue) Review again');
console.log('  BEFORE:');
console.log(`    reviewQueue: [${reviewQueue}]`);
console.log(`    filtered: [${filtered.map(c => c.id)}]`);
console.log(`    index: ${currentIndex}, viewing: Card ${filtered[currentIndex].id}`);

reviewQueue.push(1); // Add Card 1 again
filtered = getFilteredCards();
console.log('  AFTER adding to queue (keeping same index):');
console.log(`    reviewQueue: [${reviewQueue}]`);
console.log(`    filtered: [${filtered.map(c => c.id)}]`);
console.log(`    index: ${currentIndex}, viewing: Card ${filtered[currentIndex].id}`);
console.log(`    ^ Expected: Card 2, Actual: Card ${filtered[currentIndex].id}`);

if (filtered[currentIndex].id === 2) {
    console.log('  ✓ Correct! We see Card 2');
} else {
    console.log('  ❌ Wrong! We still see Card 1');
    console.log('\n  The problem: When a card in the queued section is marked for review,');
    console.log('  it gets duplicated at the end, but the FIRST occurrence stays at the same position.');
    console.log('  So keeping the same index means we still see the same card!');
    console.log('\n  filtered before: [3, 1, 2] - Card 1 is at index 1');
    console.log('  filtered after:  [3, 1, 2, 1] - Card 1 is STILL at index 1');
    console.log('  We need to move past Card 1 to see Card 2');
}
