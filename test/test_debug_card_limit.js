// Debug test for card limit
require('./dom-mock.js');

console.log('Debug Card Limit with Review Queue\n');

// Mock DOM elements
class MockElement {
    constructor(id) {
        this.id = id;
        this.style = { display: 'inline-block' };
        this.disabled = false;
        this.textContent = '';
        this.value = '';
        this.dataset = {};
        this.classList = {
            classes: [],
            add: function(cls) { 
                if (!this.classes.includes(cls)) this.classes.push(cls); 
            },
            remove: function(cls) { 
                this.classes = this.classes.filter(c => c !== cls); 
            },
            toggle: function(cls, force) {
                if (force === undefined) force = !this.classes.includes(cls);
                if (force) this.add(cls);
                else this.remove(cls);
            },
            contains: function(cls) {
                return this.classes.includes(cls);
            }
        };
    }
    
    addEventListener(event, handler) {}
    focus() {}
}

const mockDOM = {
    'study-tab': new MockElement('study-tab'),
    'manage-tab': new MockElement('manage-tab'),
    'flashcard': new MockElement('flashcard'),
    'next-btn': new MockElement('next-btn'),
    'prev-btn': new MockElement('prev-btn'),
    'flip-btn': new MockElement('flip-btn'),
    'easy-btn': new MockElement('easy-btn'),
    'review-btn': new MockElement('review-btn'),
    'card-front-text': new MockElement('card-front-text'),
    'card-back-text': new MockElement('card-back-text'),
    'card-front-lang': new MockElement('card-front-lang'),
    'card-back-lang': new MockElement('card-back-lang'),
    'card-position': new MockElement('card-position'),
    'total-cards': new MockElement('total-cards'),
    'reviewed-today': new MockElement('reviewed-today'),
    'card-count': new MockElement('card-count'),
    'cards-list': new MockElement('cards-list'),
    'no-cards-message': new MockElement('no-cards-message'),
    'card-container': new MockElement('card-container'),
    'direction-bg-en': new MockElement('direction-bg-en'),
    'direction-en-bg': new MockElement('direction-en-bg'),
    'category-filter': new MockElement('category-filter'),
    'category-checkboxes': new MockElement('category-checkboxes'),
    'bulgarian-input': new MockElement('bulgarian-input'),
    'english-input': new MockElement('english-input'),
    'category-input': new MockElement('category-input'),
    'add-card-btn': new MockElement('add-card-btn'),
    'export-btn': new MockElement('export-btn'),
    'import-merge-btn': new MockElement('import-merge-btn'),
    'import-replace-btn': new MockElement('import-replace-btn'),
    'import-file-input': new MockElement('import-file-input'),
    'start-session-btn': new MockElement('start-session-btn'),
    'end-session-btn': new MockElement('end-session-btn'),
    'session-controls': new MockElement('session-controls'),
    'session-timer': new MockElement('session-timer'),
    'shuffle-checkbox': new MockElement('shuffle-checkbox'),
    'card-limit-input': new MockElement('card-limit-input')
};

mockDOM['study-tab'].classList.add('active');
mockDOM['category-checkboxes'].querySelectorAll = () => [];
mockDOM['category-checkboxes'].innerHTML = '';
mockDOM['cards-list'].innerHTML = '';

global.document = {
    getElementById: (id) => mockDOM[id],
    querySelectorAll: (selector) => {
        if (selector === '.tab-button') {
            return [{
                addEventListener: () => {},
                dataset: { tab: 'study' },
                classList: { add: () => {}, remove: () => {} }
            }];
        }
        if (selector === '.tab-content') {
            return [mockDOM['study-tab'], mockDOM['manage-tab']];
        }
        return [];
    },
    querySelector: (selector) => {
        if (selector === '.tab-content.active') return mockDOM['study-tab'];
        return null;
    },
    createElement: () => ({ 
        textContent: '', 
        innerHTML: '',
        setAttribute: () => {},
        style: { visibility: 'hidden' }
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {}
    },
    addEventListener: () => {}
};

global.localStorage = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    removeItem: function(key) { delete this.data[key]; },
    clear: function() { this.data = {}; }
};

global.FileReader = function() {};
global.Blob = function() {};
global.URL = { createObjectURL: () => 'mock-url', revokeObjectURL: () => {} };
global.alert = () => {};
global.confirm = () => true;
global.setTimeout = (fn) => fn();

// Load the app
const fs = require('fs');
const appCode = fs.readFileSync('../app.js', 'utf8');
const classCode = appCode
    .replace(/\nconst app = new FlashcardApp\(\);?\s*$/, '')
    .replace('class FlashcardApp', 'global.FlashcardApp = class FlashcardApp');

eval(classCode);

const FlashcardApp = global.FlashcardApp;
localStorage.clear();

const app = new FlashcardApp();

// Add 10 cards
app.cards = [];
for (let i = 1; i <= 10; i++) {
    app.cards.push({ id: i, bulgarian: `Card${i}_BG`, english: `Card${i}_EN`, category: '' });
}

console.log('Initial cards:', app.cards.map(c => `${c.english}(${c.id})`).join(', '));
console.log('Total cards:', app.cards.length);

// Set card limit to 5
app.cardLimit = 5;
app.shuffleEnabled = false;

console.log('\nBefore startSession:');
console.log('Card limit:', app.cardLimit);
console.log('Shuffle enabled:', app.shuffleEnabled);

app.startSession();

console.log('\nAfter startSession:');
console.log('In session:', app.inSession);
console.log('Session cards count:', app.sessionCards.length);
console.log('Session cards:', app.sessionCards.map(c => `${c.english}(${c.id})`).join(', '));

// Mark card 1 for review
app.reviewQueue.push(1);
console.log('\nAfter adding card 1 to review queue:');
console.log('Review queue:', app.reviewQueue);

const filtered = app.getFilteredCards();
console.log('Filtered cards count:', filtered.length);
console.log('Filtered cards:', filtered.map(c => `${c.english}(${c.id})`).join(', '));

if (app.sessionCards.length === 5) {
    console.log('\n✅ Card limit is working: session has exactly 5 cards');
} else {
    console.log('\n❌ Card limit not working: expected 5 cards, got', app.sessionCards.length);
}

if (filtered[0].id === 2) {
    console.log('✅ Reordering is working: first card is Card2');
} else {
    console.log('❌ Reordering not working: expected Card2, got', filtered[0].english);
}
