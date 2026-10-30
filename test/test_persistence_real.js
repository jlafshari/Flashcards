// Tests that app state survives a reload, against the real FlashcardApp in ../app.js.
// A "reload" is a new FlashcardApp on the same localStorage.
const { createApp, captureAlerts, test, assert, assertEquals, finish } = require('./real-app.js');

captureAlerts();

function reload() {
    return new FlashcardApp();
}

function storedCards() {
    return JSON.parse(localStorage.getItem('flashcards'));
}

// --- cards ---

test('first run seeds 10 sample cards and saves them', () => {
    localStorage.clear();
    const app = new FlashcardApp();
    assertEquals(app.cards.length, 10);
    assertEquals(storedCards().length, 10);
});

test('an empty saved deck stays empty (no sample cards)', () => {
    createApp();
    assertEquals(reload().cards.length, 0);
});

test('added cards are restored after reload', () => {
    const app = createApp();
    const card = app.addCard('  Здравей ', ' Hello  ', ' Greetings ');
    const restored = reload();
    assertEquals(restored.cards, [card]);
    assertEquals(restored.cards[0].english, 'Hello', 'text should be trimmed');
});

test('edit, bury, and delete are restored after reload', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    const b = app.addCard('б', 'b');
    const c = app.addCard('в', 'c');
    app.editCard(a.id, 'ново', 'new', 'Cat');
    app.buryCard(b.id);
    app.deleteCard(c.id);

    const restored = reload();
    assertEquals(restored.cards.map(x => [x.bulgarian, x.english, x.category, x.buried]),
        [['ново', 'new', 'Cat', false], ['б', 'b', '', true]]);
});

test('cards saved without a buried flag load as not buried', () => {
    const legacy = [{ id: 1, bulgarian: 'а', english: 'a', category: '', createdAt: '2024-01-01T00:00:00.000Z' }];
    const app = createApp(legacy);
    assertEquals(app.cards[0].buried, false);
});

// --- preferences ---

test('study direction is restored', () => {
    const app = createApp();
    app.setDirection('en-bg');
    assertEquals(reload().direction, 'en-bg');
});

test('active categories are restored', () => {
    const app = createApp();
    app.setActiveCategories(['Greetings', 'Food']);
    assertEquals(reload().activeCategories, ['Greetings', 'Food']);
});

test('corrupt saved categories fall back to showing all', () => {
    createApp();
    localStorage.setItem('activeCategories', '{not json');
    assertEquals(reload().activeCategories, []);
});

test('shuffle and card limit preferences are restored', () => {
    const app = createApp();
    app.shuffleEnabled = true;
    app.cardLimit = 5;
    app.saveSessionPreferences();
    const restored = reload();
    assertEquals(restored.shuffleEnabled, true);
    assertEquals(restored.cardLimit, 5);
});

test('clearing the card limit removes it from storage', () => {
    const app = createApp();
    app.cardLimit = 5;
    app.saveSessionPreferences();
    app.cardLimit = null;
    app.saveSessionPreferences();
    assertEquals(localStorage.getItem('cardLimit'), null);
    assertEquals(reload().cardLimit, null);
});

// --- daily stats ---

test('reviewed count and time carry over on the same day', () => {
    createApp();
    localStorage.setItem('reviewDate', new Date().toDateString());
    localStorage.setItem('reviewedToday', '7');
    localStorage.setItem('totalTimeToday', '120');
    const app = reload();
    assertEquals(app.reviewedToday, 7);
    assertEquals(app.totalTimeToday, 120);
});

test('reviewed count and time reset on a new day', () => {
    createApp();
    localStorage.setItem('reviewDate', 'Mon Jan 01 2001');
    localStorage.setItem('reviewedToday', '7');
    localStorage.setItem('totalTimeToday', '120');
    const app = reload();
    assertEquals(app.reviewedToday, 0);
    assertEquals(app.totalTimeToday, 0);
    assertEquals(localStorage.getItem('reviewDate'), new Date().toDateString());
    assertEquals(localStorage.getItem('reviewedToday'), '0');
});

test('ending a session saves the elapsed time', () => {
    const app = createApp();
    app.addCard('а', 'a');
    app.startSession();
    app.sessionStartTime = Date.now() - 65000; // 65 seconds ago
    app.endSession();
    assertEquals(app.totalTimeToday, 65);
    assertEquals(localStorage.getItem('totalTimeToday'), '65');
});

finish();
