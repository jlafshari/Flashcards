// Tests CSV parsing, export, and import against the real FlashcardApp in ../app.js
const { createApp, captureAlerts, test, assert, assertEquals, finish } = require('./real-app.js');

const alerts = captureAlerts();

// Capture the CSV that exportCards() hands to Blob
let exported = null;
global.Blob = function (parts, options) {
    exported = { text: parts.join(''), type: options.type };
};

// Synchronous FileReader: the "file" is just { text }
global.FileReader = function () {
    this.readAsText = (file) => this.onload({ target: { result: file.text } });
};

function importCsv(app, text, replace = false) {
    alerts.length = 0;
    app.importCards({ text }, replace);
}

function cardFields(app) {
    return app.cards.map(c => [c.english, c.bulgarian, c.category]);
}

// --- parseCSV ---

test('parseCSV: simple rows', () => {
    const app = createApp();
    assertEquals(app.parseCSV('a,b,c\nd,e,f'), [['a', 'b', 'c'], ['d', 'e', 'f']]);
});

test('parseCSV: quoted field with comma', () => {
    const app = createApp();
    assertEquals(app.parseCSV('"Hello, world",Здравей'), [['Hello, world', 'Здравей']]);
});

test('parseCSV: escaped quotes inside quoted field', () => {
    const app = createApp();
    assertEquals(app.parseCSV('"say ""hi""",x'), [['say "hi"', 'x']]);
});

test('parseCSV: newline inside quoted field stays in the field', () => {
    const app = createApp();
    assertEquals(app.parseCSV('"line1\nline2",x\ny,z'), [['line1\nline2', 'x'], ['y', 'z']]);
});

test('parseCSV: handles \\r\\n line endings', () => {
    const app = createApp();
    assertEquals(app.parseCSV('a,b\r\nc,d\r\n'), [['a', 'b'], ['c', 'd']]);
});

test('parseCSV: last row without trailing newline is kept', () => {
    const app = createApp();
    assertEquals(app.parseCSV('a,b\nc,d'), [['a', 'b'], ['c', 'd']]);
});

test('parseCSV: skips blank rows and trims unquoted fields', () => {
    const app = createApp();
    assertEquals(app.parseCSV('a , b\n\n  ,  \nc,d\n\n'), [['a', 'b'], ['c', 'd']]);
});

test('parseCSV: empty input gives no rows', () => {
    const app = createApp();
    assertEquals(app.parseCSV(''), []);
});

test('parseCSV: empty middle field is preserved', () => {
    const app = createApp();
    assertEquals(app.parseCSV('a,,c'), [['a', '', 'c']]);
});

// --- escapeCsvField ---

test('escapeCsvField: only quotes fields that need it', () => {
    const app = createApp();
    assertEquals(app.escapeCsvField('plain'), 'plain');
    assertEquals(app.escapeCsvField('a,b'), '"a,b"');
    assertEquals(app.escapeCsvField('say "hi"'), '"say ""hi"""');
    assertEquals(app.escapeCsvField('a\nb'), '"a\nb"');
});

// --- exportCards ---

test('exportCards: alerts and exports nothing when there are no cards', () => {
    const app = createApp();
    exported = null;
    alerts.length = 0;
    app.exportCards();
    assertEquals(alerts, ['No cards to export!']);
    assert(exported === null, 'Should not create a CSV');
});

test('exportCards: writes english, bulgarian, category per line', () => {
    const app = createApp();
    app.addCard('Здравей', 'Hello', 'Greetings');
    app.addCard('Да', 'Yes', '');
    app.exportCards();
    assertEquals(exported.text.split('\n'), ['Hello,Здравей,Greetings', 'Yes,Да,']);
    assert(exported.type.startsWith('text/csv'), 'Should be a CSV blob');
});

// --- importCards ---

test('importCards: reads english, bulgarian, category columns', () => {
    const app = createApp();
    importCsv(app, 'Hello,Здравей,Greetings\nYes,Да');
    assertEquals(cardFields(app), [['Hello', 'Здравей', 'Greetings'], ['Yes', 'Да', '']]);
    assertEquals(alerts, ['Successfully imported 2 cards']);
});

test('importCards: merge keeps existing cards and skips case-insensitive duplicates', () => {
    const app = createApp();
    app.addCard('Здравей', 'Hello', 'Greetings');
    importCsv(app, 'HELLO,здравей,greetings\nYes,Да,');
    assertEquals(cardFields(app), [['Hello', 'Здравей', 'Greetings'], ['Yes', 'Да', '']]);
    assertEquals(alerts, ['Successfully imported 1 card (1 duplicate skipped)']);
});

test('importCards: same text in a different category is not a duplicate', () => {
    const app = createApp();
    app.addCard('Здравей', 'Hello', 'Greetings');
    importCsv(app, 'Hello,Здравей,Other');
    assertEquals(app.cards.length, 2);
});

test('importCards: replace discards existing cards', () => {
    const app = createApp();
    app.addCard('Старо', 'Old', '');
    importCsv(app, 'New,Ново', true);
    assertEquals(cardFields(app), [['New', 'Ново', '']]);
});

test('importCards: skips rows with fewer than 2 columns or blank fields', () => {
    const app = createApp();
    importCsv(app, 'onlyone\n,Празно\nEmpty,\nGood,Добре');
    assertEquals(cardFields(app), [['Good', 'Добре', '']]);
});

test('importCards: empty file alerts and leaves cards untouched', () => {
    const app = createApp();
    app.addCard('Да', 'Yes', '');
    importCsv(app, '');
    assertEquals(alerts, ['CSV file is empty!']);
    assertEquals(app.cards.length, 1);
});

test('importCards: imported cards are saved to storage and get unique ids', () => {
    const app = createApp();
    importCsv(app, 'A,а\nB,б\nC,в');
    assertEquals(JSON.parse(localStorage.getItem('flashcards')).length, 3);
    assertEquals(new Set(app.cards.map(c => c.id)).size, 3, 'ids should be unique');
});

// --- round trip ---

test('export then import round-trips tricky text', () => {
    const source = createApp();
    source.addCard('Здравей, свят', 'Hello, world', 'Greet,ings');
    source.addCard('Той каза "да"', 'He said "yes"', '');
    source.addCard('Два\nреда', 'Two\nlines', 'Multi');
    source.exportCards();

    const target = createApp();
    importCsv(target, exported.text, true);
    assertEquals(cardFields(target), cardFields(source));
});

finish();
