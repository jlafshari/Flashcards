// Simple test of the incrementing logic

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

console.log('Start: index=0');
let filtered = getFilteredCards();
console.log(`  filtered: [${filtered.map(c => c.id)}]`);
console.log(`  viewing: Card ${filtered[currentIndex].id}`);

// Mark Card 1 for review
console.log('\nMark Card 1 for review:');
const nextCardBeforeReorder = filtered[currentIndex + 1];
console.log(`  Next card before reorder: Card ${nextCardBeforeReorder ? nextCardBeforeReorder.id : 'none'}`);

reviewQueue.push(filtered[currentIndex].id);
console.log(`  Added to queue: ${filtered[currentIndex].id}`);
console.log(`  reviewQueue: [${reviewQueue}]`);

// Now increment
currentIndex++;
filtered = getFilteredCards();
console.log(`  After increment, index=${currentIndex}`);
console.log(`  filtered: [${filtered.map(c => c.id)}]`);
console.log(`  viewing: Card ${filtered[currentIndex].id}`);
console.log(`  Expected: Card ${nextCardBeforeReorder.id}`);

if (filtered[currentIndex].id === nextCardBeforeReorder.id) {
    console.log('  ✓ Correct!');
} else {
    console.log('  ❌ Wrong card!');
}
