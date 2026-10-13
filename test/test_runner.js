// Simple DOM mock for testing
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = value; },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};

global.document = {
    getElementById: () => ({ 
        textContent: '', 
        style: { display: '' }, 
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        disabled: false
    }),
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: () => ({ textContent: '', innerHTML: '' })
};

global.window = { alert: () => {} };

// Load the app
require('./app.js');

// Load and run tests
require('./test_session_feature.js');
