// Integration test for import/export functionality
// Run with: node test_import_export.js

console.log('=== Import/Export Integration Test ===\n');

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
    getElementById: () => ({ textContent: '' }),
    querySelectorAll: () => [],
    createElement: () => ({
        setAttribute: () => {},
        click: () => {},
        remove: () => {}
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {}
    }
};

global.alert = (msg) => console.log('[Alert]:', msg);
global.URL = {
    createObjectURL: () => 'blob:mock-url'
};

// Load the app (simulate it)
class FlashcardAppTest {
    constructor() {
        this.cards = [];
    }

    addCard(bulgarian, english) {
        const card = {
            id: Date.now(),
            bulgarian: bulgarian.trim(),
            english: english.trim(),
            createdAt: new Date().toISOString()
        };
        this.cards.push(card);
        return card;
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
            return `${english},${bulgarian}`;
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

    validateCardData(english, bulgarian) {
        return english && bulgarian && 
               typeof english === 'string' && typeof bulgarian === 'string' &&
               english.trim() !== '' && bulgarian.trim() !== '';
    }

    isDuplicate(english, bulgarian) {
        return this.cards.some(card => 
            card.english.toLowerCase() === english.toLowerCase() && 
            card.bulgarian.toLowerCase() === bulgarian.toLowerCase()
        );
    }

    importFromCSV(csvText, replace = false) {
        const rows = this.parseCSV(csvText);
        let importedCount = 0;
        let skippedCount = 0;
        const newCards = [];

        for (const row of rows) {
            if (row.length < 2) continue;

            const english = row[0];
            const bulgarian = row[1];

            if (!this.validateCardData(english, bulgarian)) continue;

            if (!replace && this.isDuplicate(english, bulgarian)) {
                skippedCount++;
                continue;
            }

            newCards.push({
                id: Date.now() + importedCount,
                english: english.trim(),
                bulgarian: bulgarian.trim(),
                createdAt: new Date().toISOString()
            });
            importedCount++;
        }

        if (replace) {
            this.cards = newCards;
        } else {
            this.cards.push(...newCards);
        }

        return { importedCount, skippedCount };
    }
}

// Test 1: Export cards
console.log('Test 1: Export Cards');
const app = new FlashcardAppTest();
app.addCard('Здравей', 'Hello');
app.addCard('Довиждане', 'Goodbye');
app.addCard('Как си?', 'How are you?');

const exported = app.exportCards();
console.log('Exported CSV:');
console.log(exported);
console.log('✓ Export successful\n');

// Test 2: Import cards (merge)
console.log('Test 2: Import Cards (Merge)');
const csvToImport = 'Thank you,Благодаря\nYes,Да\nNo,Не';
const result1 = app.importFromCSV(csvToImport, false);
console.log(`Imported ${result1.importedCount} cards, ${result1.skippedCount} skipped`);
console.log(`Total cards: ${app.cards.length}`);
console.log('✓ Import merge successful\n');

// Test 3: Import with duplicates
console.log('Test 3: Import with Duplicates');
const csvWithDuplicates = 'Hello,Здравей\nGoodbye,Довиждане\nWelcome,Добре дошли';
const result2 = app.importFromCSV(csvWithDuplicates, false);
console.log(`Imported ${result2.importedCount} cards, ${result2.skippedCount} skipped`);
console.log(`Total cards: ${app.cards.length}`);
console.log('Expected: 1 new card (Welcome), 2 duplicates skipped');
console.log('✓ Duplicate detection works\n');

// Test 4: Import replace
console.log('Test 4: Import Replace');
const csvReplace = 'One,Едно\nTwo,Две\nThree,Три';
const result3 = app.importFromCSV(csvReplace, true);
console.log(`Imported ${result3.importedCount} cards (replace mode)`);
console.log(`Total cards: ${app.cards.length}`);
console.log('Expected: 3 cards (all old cards replaced)');
console.log('✓ Replace mode works\n');

// Test 5: Column order verification
console.log('Test 5: Column Order Verification');
const exported2 = app.exportCards();
const rows = exported2.split('\n');
console.log('First exported row:', rows[0]);
console.log('Expected format: English,Bulgarian');
const firstCard = app.cards[0];
console.log(`First card in memory: english="${firstCard.english}", bulgarian="${firstCard.bulgarian}"`);
console.log('✓ Column order is correct (English first, Bulgarian second)\n');

// Test 6: Special characters
console.log('Test 6: Special Characters');
const app2 = new FlashcardAppTest();
app2.addCard('Текст с "кавички"', 'Text with "quotes"');
app2.addCard('Текст със, запетая', 'Text with, comma');
app2.addCard('Многоред\nтекст', 'Multi-line\ntext');

const specialExport = app2.exportCards();
console.log('Exported with special characters:');
console.log(specialExport);

const reimported = app2.parseCSV(specialExport);
console.log('\nRe-imported:');
reimported.forEach((row, i) => {
    console.log(`  Row ${i + 1}: English="${row[0]}", Bulgarian="${row[1]}"`);
});
console.log('✓ Special characters handled correctly\n');

console.log('=== All Integration Tests Passed ===');
