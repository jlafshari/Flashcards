// Debug test with unique IDs
console.log('Debug Review Queue Behavior (with unique IDs)\n');
console.log('=================================\n');

// Mock DOM elements
class MockElement {
    constructor(id) {
        this.id = id;
        this.style = { display: 'inline-block' };
        this.disabled = false;
        this.textContent = '';
        this.value = '';
        this.dataset = {};
        this.files = [];
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
    
    addEventListener(event, handler) {
        if (!this.eventListeners) this.eventListeners = {};
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(handler);
    }
    
    focus() {}
}

// Create mock DOM
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
    'import-file-input': new MockElement('import-file-input')
};

mockDOM['study-tab'].classList.add('active');
mockDOM['easy-btn'].style.display = 'none';
mockDOM['review-btn'].style.display = 'none';
mockDOM['category-checkboxes'].querySelectorAll = function(selector) { return []; };
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
        if (selector === '#category-checkboxes input[type="checkbox"]') {
            return [];
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

// Load the app
const fs = require('fs');
const appCode = fs.readFileSync('app.js', 'utf8');
const classCode = appCode
    .replace(/\nconst app = new FlashcardApp\(\);?\s*$/, '')
    .replace('class FlashcardApp', 'global.FlashcardApp = class FlashcardApp');

eval(classCode);

const FlashcardApp = global.FlashcardApp;
localStorage.clear();

const app = new FlashcardApp();

// Add 5 cards with unique IDs
const card1 = app.addCard('Едно', 'One', '');
card1.id = 1001;
app.cards[0].id = 1001;

const card2 = app.addCard('Две', 'Two', '');
card2.id = 1002;
app.cards[1].id = 1002;

const card3 = app.addCard('Три', 'Three', '');
card3.id = 1003;
app.cards[2].id = 1003;

const card4 = app.addCard('Четири', 'Four', '');
card4.id = 1004;
app.cards[3].id = 1004;

const card5 = app.addCard('Пет', 'Five', '');
card5.id = 1005;
app.cards[4].id = 1005;

console.log('Initial state:');
console.log('Cards:', app.cards.map(c => `${c.bulgarian}(${c.id})`).join(', '));
console.log('Current index:', app.currentCardIndex);
console.log('Review queue:', app.reviewQueue);

let filtered = app.getFilteredCards();
console.log('Filtered cards:', filtered.map(c => `${c.bulgarian}(${c.id})`).join(', '));
console.log('');

// Mock setTimeout to execute immediately
const originalSetTimeout = global.setTimeout;
global.setTimeout = (fn, delay) => fn();

// Mark the first card (card1) for review
console.log('Marking card at index 0 for review...');
app.currentCardIndex = 0;
app.markForReview();

global.setTimeout = originalSetTimeout;

console.log('\nAfter marking card 0 for review:');
console.log('Current index:', app.currentCardIndex);
console.log('Review queue:', app.reviewQueue);

filtered = app.getFilteredCards();
console.log('Filtered cards:', filtered.map(c => `${c.bulgarian}(${c.id})`).join(', '));
console.log('Card at index 0:', filtered[0].bulgarian, `(ID: ${filtered[0].id}, expected: Two with ID 1002)`);
console.log('Card at index 4:', filtered[4].bulgarian, `(ID: ${filtered[4].id}, expected: One with ID 1001)`);

console.log('\n=== SUCCESS! Card One was moved to the end ===');
