// Test for category functionality
// Run with: node test_category.js

console.log('=== Category Feature Test ===\n');

// Mock localStorage
global.localStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    }
};

// Mock DOM elements
global.document = {
    getElementById: () => ({ 
        textContent: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} }
    }),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => ({
        setAttribute: () => {},
        click: () => {},
        remove: () => {},
        textContent: ''
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {}
    },
    addEventListener: () => {}
};

global.alert = (msg) => console.log('[Alert]:', msg);
global.URL = {
    createObjectURL: () => 'blob:mock-url'
};

// Simplified FlashcardApp for testing
class FlashcardAppTest {
    constructor() {
        this.cards = [];
        this.activeCategories = [];
    }

    addCard(bulgarian, english, category = '') {
        const card = {
            id: Date.now() + this.cards.length,
            bulgarian: bulgarian.trim(),
            english: english.trim(),
            category: category.trim(),
            createdAt: new Date().toISOString()
        };
        this.cards.push(card);
        return card;
    }

    getCategories() {
        const categories = new Set();
        this.cards.forEach(card => {
            const category = card.category || '';
            categories.add(category);
        });
        return Array.from(categories).sort();
    }

    setActiveCategories(categories) {
        this.activeCategories = categories;
    }

    getFilteredCards() {
        if (this.activeCategories.length === 0) {
            return this.cards;
        }
        return this.cards.filter(card => {
            const category = card.category || '';
            return this.activeCategories.includes(category);
        });
    }

    escapeCsvField(field) {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    }

    exportCards() {
        if (this.cards.length === 0) {
            return null;
        }

        const csvContent = this.cards.map(card => {
            const english = this.escapeCsvField(card.english);
            const bulgarian = this.escapeCsvField(card.bulgarian);
            const category = this.escapeCsvField(card.category || '');
            return `${english},${bulgarian},${category}`;
        }).join('\n');

        return csvContent;
    }

    parseCSV(text) {
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (inQuotes) {
                if (char === '"') {
                    if (nextChar === '"') {
                        currentField += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    currentField += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    currentRow.push(currentField.trim());
                    currentField = '';
                } else if (char === '\n') {
                    currentRow.push(currentField.trim());
                    if (currentRow.some(field => field !== '')) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                } else if (char === '\r') {
                    continue;
                } else {
                    currentField += char;
                }
            }
        }

        if (currentField !== '' || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            if (currentRow.some(field => field !== '')) {
                rows.push(currentRow);
            }
        }

        return rows;
    }

    importCards(csvText) {
        const rows = this.parseCSV(csvText);
        const newCards = [];

        for (const row of rows) {
            if (row.length < 2) continue;

            const english = row[0];
            const bulgarian = row[1];
            const category = row.length >= 3 ? row[2] : '';

            newCards.push({
                id: Date.now() + newCards.length,
                english: english.trim(),
                bulgarian: bulgarian.trim(),
                category: category.trim(),
                createdAt: new Date().toISOString()
            });
        }

        this.cards = newCards;
        return newCards.length;
    }
}

// Run tests
let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (error) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${error.message}`);
        failed++;
    }
}

function assertEquals(actual, expected, message = '') {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
    }
}

// Test 1: Add card with category
test('Add card with category', () => {
    const app = new FlashcardAppTest();
    const card = app.addCard('Здравей', 'Hello', 'Greetings');
    assertEquals(card.category, 'Greetings', 'Category should be stored');
    assertEquals(app.cards.length, 1, 'Should have 1 card');
});

// Test 2: Add card without category
test('Add card without category', () => {
    const app = new FlashcardAppTest();
    const card = app.addCard('Здравей', 'Hello');
    assertEquals(card.category, '', 'Category should be empty string');
});

// Test 3: Get categories from cards
test('Get unique categories', () => {
    const app = new FlashcardAppTest();
    app.addCard('Здравей', 'Hello', 'Greetings');
    app.addCard('Довиждане', 'Goodbye', 'Greetings');
    app.addCard('Хляб', 'Bread', 'Food');
    app.addCard('Вода', 'Water', '');
    
    const categories = app.getCategories();
    assertEquals(categories.length, 3, 'Should have 3 unique categories');
    assertEquals(categories.includes('Greetings'), true, 'Should include Greetings');
    assertEquals(categories.includes('Food'), true, 'Should include Food');
    assertEquals(categories.includes(''), true, 'Should include empty category');
});

// Test 4: Filter cards by category
test('Filter cards by single category', () => {
    const app = new FlashcardAppTest();
    app.addCard('Здравей', 'Hello', 'Greetings');
    app.addCard('Довиждане', 'Goodbye', 'Greetings');
    app.addCard('Хляб', 'Bread', 'Food');
    
    app.setActiveCategories(['Greetings']);
    const filtered = app.getFilteredCards();
    assertEquals(filtered.length, 2, 'Should have 2 greeting cards');
});

// Test 5: Filter cards by multiple categories
test('Filter cards by multiple categories', () => {
    const app = new FlashcardAppTest();
    app.addCard('Здравей', 'Hello', 'Greetings');
    app.addCard('Хляб', 'Bread', 'Food');
    app.addCard('Вода', 'Water', 'Drinks');
    
    app.setActiveCategories(['Food', 'Drinks']);
    const filtered = app.getFilteredCards();
    assertEquals(filtered.length, 2, 'Should have 2 cards (Food + Drinks)');
});

// Test 6: Empty active categories shows all cards
test('Empty active categories shows all cards', () => {
    const app = new FlashcardAppTest();
    app.addCard('Здравей', 'Hello', 'Greetings');
    app.addCard('Хляб', 'Bread', 'Food');
    app.addCard('Вода', 'Water', 'Drinks');
    
    app.setActiveCategories([]);
    const filtered = app.getFilteredCards();
    assertEquals(filtered.length, 3, 'Should show all cards');
});

// Test 7: Export cards with categories (3 columns)
test('Export cards with categories', () => {
    const app = new FlashcardAppTest();
    app.addCard('Здравей', 'Hello', 'Greetings');
    app.addCard('Хляб', 'Bread', 'Food');
    
    const csv = app.exportCards();
    const lines = csv.split('\n');
    assertEquals(lines.length, 2, 'Should have 2 lines');
    assertEquals(lines[0], 'Hello,Здравей,Greetings', 'First line should have 3 columns');
    assertEquals(lines[1], 'Bread,Хляб,Food', 'Second line should have 3 columns');
});

// Test 8: Export cards without categories
test('Export cards without categories', () => {
    const app = new FlashcardAppTest();
    app.addCard('Здравей', 'Hello');
    
    const csv = app.exportCards();
    assertEquals(csv, 'Hello,Здравей,', 'Should have empty third column');
});

// Test 9: Import 3-column CSV
test('Import 3-column CSV', () => {
    const app = new FlashcardAppTest();
    const csv = 'Hello,Здравей,Greetings\nBread,Хляб,Food';
    
    const count = app.importCards(csv);
    assertEquals(count, 2, 'Should import 2 cards');
    assertEquals(app.cards[0].category, 'Greetings', 'First card should have category');
    assertEquals(app.cards[1].category, 'Food', 'Second card should have category');
});

// Test 10: Import 2-column CSV (backward compatibility)
test('Import 2-column CSV (backward compatibility)', () => {
    const app = new FlashcardAppTest();
    const csv = 'Hello,Здравей\nBread,Хляб';
    
    const count = app.importCards(csv);
    assertEquals(count, 2, 'Should import 2 cards');
    assertEquals(app.cards[0].category, '', 'Cards should have empty category');
    assertEquals(app.cards[1].category, '', 'Cards should have empty category');
});

// Test 11: Import 3-column CSV with empty categories
test('Import 3-column CSV with empty categories', () => {
    const app = new FlashcardAppTest();
    const csv = 'Hello,Здравей,\nBread,Хляб,Food';
    
    const count = app.importCards(csv);
    assertEquals(count, 2, 'Should import 2 cards');
    assertEquals(app.cards[0].category, '', 'First card should have empty category');
    assertEquals(app.cards[1].category, 'Food', 'Second card should have category');
});

// Test 12: Filter by empty category
test('Filter by empty category', () => {
    const app = new FlashcardAppTest();
    app.addCard('Здравей', 'Hello', 'Greetings');
    app.addCard('Хляб', 'Bread', '');
    app.addCard('Вода', 'Water', '');
    
    app.setActiveCategories(['']);
    const filtered = app.getFilteredCards();
    assertEquals(filtered.length, 2, 'Should have 2 uncategorized cards');
});

console.log('\n=== Test Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed === 0) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
}
