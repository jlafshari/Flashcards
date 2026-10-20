// Debug test for Test 2 scenario

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

console.log('=== Debug Test 2 Final State ===\n');

localStorage.clear();
const app = new FlashcardApp();

app.cards = [
    { id: 1, bulgarian: 'Card 1', english: 'One', category: 'Test' },
    { id: 2, bulgarian: 'Card 2', english: 'Two', category: 'Test' },
    { id: 3, bulgarian: 'Card 3', english: 'Three', category: 'Test' }
];

app.startSession();

// Simulate the full scenario
app.markForReview(); // Card 1
setTimeout(() => {
    app.markForReview(); // Card 2
    setTimeout(() => {
        app.markEasy(); // Card 3
        setTimeout(() => {
            app.markForReview(); // Card 1 again
            setTimeout(() => {
                app.markEasy(); // Card 2
                setTimeout(() => {
                    app.markEasy(); // Card 1 (2nd occurrence)
                    setTimeout(() => {
                        console.log('After all actions:');
                        console.log(`  inSession: ${app.inSession}`);
                        console.log(`  sessionCards: [${app.sessionCards.map(c => c.id)}]`);
                        console.log(`  sessionReviewedCards: [${Array.from(app.sessionReviewedCards)}]`);
                        console.log(`  reviewQueue: [${app.reviewQueue}]`);
                        console.log(`  currentCardIndex: ${app.currentCardIndex}`);
                        console.log(`  filteredCards: [${app.getFilteredCards().map(c => c.id)}]`);
                        console.log(`  filteredCards.length: ${app.getFilteredCards().length}`);
                        console.log(`\n  isSessionComplete(): ${app.isSessionComplete()}`);
                        console.log(`  Expected: true`);
                        
                        if (app.isSessionComplete()) {
                            console.log('  ✓ Session is complete');
                        } else {
                            console.log('  ❌ Session is NOT complete');
                            console.log('\n  Checking which cards are not reviewed:');
                            for (const card of app.sessionCards) {
                                const reviewed = app.sessionReviewedCards.has(card.id);
                                console.log(`    Card ${card.id}: ${reviewed ? '✓' : '❌'}`);
                            }
                        }
                        
                        process.exit(0);
                    }, 350);
                }, 350);
            }, 350);
        }, 350);
    }, 350);
}, 350);
