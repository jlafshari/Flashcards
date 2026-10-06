// Test CSV parsing logic
const fs = require('fs');

// Copy the parseCSV method from app.js
function parseCSV(text) {
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
                    // Escaped quote
                    currentField += '"';
                    i++; // Skip next quote
                } else {
                    // End of quoted field
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                // Start of quoted field
                inQuotes = true;
            } else if (char === ',') {
                // Field separator
                currentRow.push(currentField.trim());
                currentField = '';
            } else if (char === '\n') {
                // Row separator
                currentRow.push(currentField.trim());
                if (currentRow.some(field => field !== '')) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
            } else if (char === '\r') {
                // Skip \r (handle \r\n line endings)
                continue;
            } else {
                currentField += char;
            }
        }
    }

    // Add last field and row
    if (currentField !== '' || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field !== '')) {
            rows.push(currentRow);
        }
    }

    return rows;
}

function escapeCsvField(field) {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}

// Test cases
console.log('=== CSV Parsing Tests ===\n');

// Test 1: Simple CSV
const test1 = 'Hello,Здравей\nGoodbye,Довиждане';
console.log('Test 1: Simple CSV');
console.log('Input:', test1);
const result1 = parseCSV(test1);
console.log('Output:', result1);
console.log('Expected: [["Hello", "Здравей"], ["Goodbye", "Довиждане"]]');
console.log('Pass:', JSON.stringify(result1) === JSON.stringify([["Hello", "Здравей"], ["Goodbye", "Довиждане"]]));
console.log();

// Test 2: Quoted fields with commas
const test2 = '"How are you?","Как си?"';
console.log('Test 2: Quoted fields with commas and special characters');
console.log('Input:', test2);
const result2 = parseCSV(test2);
console.log('Output:', result2);
console.log('Expected: [["How are you?", "Как си?"]]');
console.log('Pass:', JSON.stringify(result2) === JSON.stringify([["How are you?", "Как си?"]]));
console.log();

// Test 3: Escaped quotes
const test3 = '"Field with ""quotes""","Another field"';
console.log('Test 3: Escaped quotes');
console.log('Input:', test3);
const result3 = parseCSV(test3);
console.log('Output:', result3);
console.log('Expected: [["Field with "quotes"", "Another field"]]');
console.log('Pass:', JSON.stringify(result3) === JSON.stringify([['Field with "quotes"', "Another field"]]));
console.log();

// Test 4: Test actual import file
console.log('Test 4: Actual import file');
const csvContent = fs.readFileSync('test_import.csv', 'utf8');
const result4 = parseCSV(csvContent);
console.log('Number of rows:', result4.length);
console.log('Rows:');
result4.forEach((row, i) => {
    console.log(`  ${i + 1}. English: "${row[0]}" | Bulgarian: "${row[1]}"`);
});
console.log();

// Test 5: Export format
console.log('Test 5: Export format (escapeCsvField)');
const testCards = [
    { english: 'Hello', bulgarian: 'Здравей' },
    { english: 'How are you?', bulgarian: 'Как си?' },
    { english: 'Text with "quotes"', bulgarian: 'Текст с "кавички"' },
    { english: 'Text with, comma', bulgarian: 'Текст със, запетая' }
];

testCards.forEach(card => {
    const english = escapeCsvField(card.english);
    const bulgarian = escapeCsvField(card.bulgarian);
    console.log(`${english},${bulgarian}`);
});

console.log('\n=== All tests complete ===');
