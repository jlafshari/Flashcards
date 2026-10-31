// Comprehensive DOM Mock for Node.js testing

class MockElement {
    constructor(id) {
        this.id = id;
        this.style = { display: 'inline-block' };
        this.disabled = false;
        this.textContent = '';
        this.value = '';
        this.innerHTML = '';
        this.dataset = {};
        this.files = [];
        this.eventListeners = {};
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
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(handler);
    }

    removeEventListener(event, handler) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(h => h !== handler);
        }
    }

    click() {
        if (this.eventListeners.click) {
            this.eventListeners.click.forEach(handler => handler());
        }
    }

    focus() {}
    blur() {}
    setAttribute(name, value) {
        this[name] = value;
    }

    appendChild(child) {
        if (!this.children) this.children = [];
        this.children.push(child);
    }

    removeChild(child) {
        if (this.children) {
            this.children = this.children.filter(c => c !== child);
        }
    }

    querySelectorAll(selector) {
        return [];
    }

    querySelector(selector) {
        return null;
    }
}

// Create mock DOM elements
const mockDOM = {};

const elementIds = [
    'study-tab', 'manage-tab', 'flashcard', 'next-btn', 'prev-btn', 'flip-btn',
    'easy-btn', 'review-btn', 'bury-btn', 'card-front-text', 'card-back-text',
    'card-front-lang', 'card-back-lang', 'card-position', 'total-cards',
    'reviewed-today', 'card-count', 'cards-list', 'no-cards-message',
    'card-container', 'direction-bg-en', 'direction-en-bg', 'category-filter',
    'category-checkboxes', 'bulgarian-input', 'english-input', 'category-input',
    'add-card-btn', 'export-btn', 'import-merge-btn', 'import-replace-btn',
    'import-file-input', 'study-options', 'session-timer', 'pause-btn', 'end-session-btn',
    'timer-display', 'stats', 'study-content', 'user-select', 'stats-tab', 'stats-summary',
    'stats-empty', 'stats-chart', 'stats-chart-title', 'stats-user-table', 'stats-user-select',
    'stats-range-7', 'stats-range-30', 'new-user-form', 'new-user-input',
    'new-user-save', 'new-user-cancel'
];

elementIds.forEach(id => {
    mockDOM[id] = new MockElement(id);
});

// Set up initial state
mockDOM['study-tab'].classList.add('active');
mockDOM['easy-btn'].style.display = 'none';
mockDOM['review-btn'].style.display = 'none';
mockDOM['bury-btn'].style.display = 'none';
mockDOM['category-checkboxes'].querySelectorAll = function() { return []; };
mockDOM['cards-list'].innerHTML = '';

// Global document mock
global.document = {
    getElementById: (id) => mockDOM[id] || new MockElement(id),
    querySelectorAll: (selector) => {
        if (selector === '.tab-button') {
            return [
                { addEventListener: () => {}, dataset: { tab: 'study' }, classList: { add: () => {}, remove: () => {} } },
                { addEventListener: () => {}, dataset: { tab: 'manage' }, classList: { add: () => {}, remove: () => {} } }
            ];
        }
        if (selector === '.tab-content') {
            return [mockDOM['study-tab'], mockDOM['manage-tab']];
        }
        if (selector === '#category-checkboxes input[type="checkbox"]') {
            return [];
        }
        if (selector === '.stats') {
            return [mockDOM['stats']];
        }
        return [];
    },
    querySelector: (selector) => {
        if (selector === '.tab-content.active') return mockDOM['study-tab'];
        if (selector === '.stats') return mockDOM['stats'];
        return null;
    },
    createElement: (tag) => {
        const el = new MockElement(tag);
        el.tagName = tag.toUpperCase();
        return el;
    },
    body: {
        appendChild: () => {},
        removeChild: () => {}
    },
    head: {
        appendChild: () => {}
    },
    addEventListener: () => {},
    removeEventListener: () => {}
};

// Global localStorage mock
global.localStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = String(value);
    },
    removeItem: function(key) {
        delete this.data[key];
    },
    clear: function() {
        this.data = {};
    }
};

// Global FileReader mock
global.FileReader = function() {
    this.onload = null;
    this.onerror = null;
    this.readAsText = function() {};
};

// Global Blob mock
global.Blob = function() {};

// Global URL mock
global.URL = {
    createObjectURL: () => 'mock-url',
    revokeObjectURL: () => {}
};

// Global window mock (the app registers a pagehide handler on it)
global.window = {
    addEventListener: () => {},
    removeEventListener: () => {}
};

// Global alert/confirm/prompt mocks
global.alert = () => {};
global.confirm = () => true;
global.prompt = () => null;

module.exports = { mockDOM, MockElement };
