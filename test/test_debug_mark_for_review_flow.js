// Debug test to understand what happens after marking for review

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

console.log('=== Debug: What happens after marking for review ===\n');

localStorage.clear();
const app = new FlashcardApp();

app.cards = [
    { id: 1, bulgarian: 'Card 1', english: 'One', category: 'Test' },
    { id: 2, bulgarian: 'Card 2', english: 'Two', category: 'Test' },
    { id: 3, bulgarian: 'Card 3', english: 'Three', category: 'Test' }
];

app.startSession();
console.log('Session started with 3 cards');
console.log(`  sessionCards: [${app.sessionCards.map(c => c.id)}]`);
console.log(`  currentCardIndex: ${app.currentCardIndex}\n`);

// Card 1: Review
console.log('Action: Card 1 - Review Again');
app.markForReview();

setTimeout(() => {
    console.log(`  reviewQueue: [${app.reviewQueue}]`);
    console.log(`  currentCardIndex: ${app.currentCardIndex}`);
    let filtered = app.getFilteredCards();
    console.log(`  filteredCards: [${filtered.map(c => c.id)}]`);
    console.log(`  current card: ${filtered[app.currentCardIndex].id}\n`);
    
    // Card 2: Review
    console.log('Action: Card 2 - Review Again');
    app.markForReview();
    
    setTimeout(() => {
        console.log(`  reviewQueue: [${app.reviewQueue}]`);
        console.log(`  currentCardIndex: ${app.currentCardIndex}`);
        filtered = app.getFilteredCards();
        console.log(`  filteredCards: [${filtered.map(c => c.id)}]`);
        console.log(`  current card: ${filtered[app.currentCardIndex].id}\n`);
        
        // Card 3: Easy
        console.log('Action: Card 3 - Easy');
        app.markEasy();
        
        setTimeout(() => {
            console.log(`  reviewQueue: [${app.reviewQueue}]`);
            console.log(`  currentCardIndex: ${app.currentCardIndex}`);
            filtered = app.getFilteredCards();
            console.log(`  filteredCards: [${filtered.map(c => c.id)}]`);
            console.log(`  current card: ${filtered[app.currentCardIndex].id}`);
            console.log('  ^ Should be Card 1 (first in queue)\n');
            
            // Card 1 (from queue): Review Again
            console.log('Action: Card 1 (from queue) - Review Again (2nd time)');
            console.log('BEFORE markForReview:');
            console.log(`  reviewQueue: [${app.reviewQueue}]`);
            console.log(`  currentCardIndex: ${app.currentCardIndex}`);
            console.log(`  filteredCards: [${filtered.map(c => c.id)}]`);
            console.log(`  current card: ${filtered[app.currentCardIndex].id}`);
            
            app.markForReview();
            
            setTimeout(() => {
                console.log('AFTER markForReview:');
                console.log(`  reviewQueue: [${app.reviewQueue}]`);
                console.log(`  currentCardIndex: ${app.currentCardIndex}`);
                filtered = app.getFilteredCards();
                console.log(`  filteredCards: [${filtered.map(c => c.id)}]`);
                console.log(`  current card: ${filtered[app.currentCardIndex].id}`);
                console.log('  ^ Should be Card 2 (next in queue)');
                
                console.log('\n=== Analysis ===');
                console.log('When markForReview() is called:');
                console.log('1. Card is added to reviewQueue');
                console.log('2. getFilteredCards() reorders: non-queued first, then queued');
                console.log('3. currentCardIndex stays the same (no increment)');
                console.log('4. So we should be viewing the card at currentCardIndex after reordering');
                console.log('');
                console.log('Expected flow:');
                console.log('  Before: filteredCards = [1, 2], index = 0 (viewing Card 1)');
                console.log('  Add Card 1 to queue: reviewQueue = [1, 2, 1]');
                console.log('  After: filteredCards = [2, 1, 1], index = 0 (viewing Card 2)');
                
                process.exit(0);
            }, 350);
        }, 350);
    }, 350);
}, 350);
