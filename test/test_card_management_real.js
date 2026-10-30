// Tests adding, editing, deleting, and burying cards against the real FlashcardApp in ../app.js
const { createApp, captureAlerts, test, assert, assertEquals, finish, mockDOM, MockElement } = require('./real-app.js');

const alerts = captureAlerts();

function storedCards() {
    return JSON.parse(localStorage.getItem('flashcards'));
}

// saveEdit() reads its inputs by id; give it elements with the values to read
function setEditInputs(id, bulgarian, english, category) {
    for (const [field, value] of [['bulgarian', bulgarian], ['english', english], ['category', category]]) {
        const input = new MockElement(`edit-${field}-${id}`);
        input.value = value;
        mockDOM[`edit-${field}-${id}`] = input;
    }
}

// --- addCard ---

test('addCard gives rapidly added cards unique ids', () => {
    const app = createApp();
    const ids = Array.from({ length: 20 }, (_, i) => app.addCard(`б${i}`, `e${i}`).id);
    assertEquals(new Set(ids).size, 20);
});

test('addCard saves the new card to storage unburied', () => {
    const app = createApp();
    app.addCard('Да', 'Yes', 'Basics');
    const [saved] = storedCards();
    assertEquals([saved.bulgarian, saved.english, saved.category, saved.buried], ['Да', 'Yes', 'Basics', false]);
});

// --- deleteCard ---

test('deleteCard removes only that card and saves', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    const b = app.addCard('б', 'b');
    app.deleteCard(a.id);
    assertEquals(app.cards.map(c => c.id), [b.id]);
    assertEquals(storedCards().map(c => c.id), [b.id]);
});

test('deleteCard with an unknown id changes nothing', () => {
    const app = createApp();
    app.addCard('а', 'a');
    app.deleteCard(-1);
    assertEquals(app.cards.length, 1);
});

test('deleteCard clamps the current index when deleting the last card', () => {
    const app = createApp();
    app.addCard('а', 'a');
    const b = app.addCard('б', 'b');
    app.currentCardIndex = 1;
    app.deleteCard(b.id);
    assertEquals(app.currentCardIndex, 0);
});

test('deleteCard on the only card leaves index 0', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    app.deleteCard(a.id);
    assertEquals(app.cards.length, 0);
    assertEquals(app.currentCardIndex, 0);
});

// --- editCard / saveEdit ---

test('editCard trims, updates, and saves', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    app.editCard(a.id, ' ново ', ' new ', ' Cat ');
    assertEquals([app.cards[0].bulgarian, app.cards[0].english, app.cards[0].category], ['ново', 'new', 'Cat']);
    assertEquals(storedCards()[0].english, 'new');
});

test('editCard with an unknown id changes nothing', () => {
    const app = createApp();
    app.addCard('а', 'a');
    app.editCard(-1, 'x', 'y');
    assertEquals(app.cards[0].bulgarian, 'а');
});

test('startEditCard and cancelEdit toggle the editing state', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    app.startEditCard(a.id);
    assertEquals(app.editingCardId, a.id);
    app.cancelEdit();
    assertEquals(app.editingCardId, null);
});

test('startEditCard ignores an unknown id', () => {
    const app = createApp();
    app.startEditCard(-1);
    assertEquals(app.editingCardId, null);
});

test('saveEdit applies the edit and closes the editor', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    app.startEditCard(a.id);
    setEditInputs(a.id, ' ново ', ' new ', ' Cat ');
    app.saveEdit(a.id);
    assertEquals([app.cards[0].bulgarian, app.cards[0].english, app.cards[0].category], ['ново', 'new', 'Cat']);
    assertEquals(app.editingCardId, null);
});

test('saveEdit with an empty field alerts and keeps the editor open', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    app.startEditCard(a.id);
    setEditInputs(a.id, 'ново', '   ', '');
    alerts.length = 0;
    app.saveEdit(a.id);
    assertEquals(alerts, ['Please fill in both Bulgarian and English fields']);
    assertEquals(app.editingCardId, a.id);
    assertEquals(app.cards[0].bulgarian, 'а', 'card should be unchanged');
});

// --- buryCard / markBuried ---

test('buryCard toggles the buried flag and saves', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    app.buryCard(a.id);
    assertEquals(app.cards[0].buried, true);
    assertEquals(storedCards()[0].buried, true);
    app.buryCard(a.id);
    assertEquals(app.cards[0].buried, false);
});

test('buried cards are left out of category filtering and new sessions', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    app.addCard('б', 'b');
    app.buryCard(a.id);
    assertEquals(app.getFilteredCardsByCategory().map(c => c.english), ['b']);
    app.startSession();
    assertEquals(app.sessionCards.map(c => c.english), ['b']);
});

test('starting a session with every card buried alerts and does not start', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    app.buryCard(a.id);
    alerts.length = 0;
    app.startSession();
    assertEquals(app.inSession, false);
    assertEquals(alerts.length, 1);
});

test('unburying a card brings it back', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    app.buryCard(a.id);
    app.buryCard(a.id);
    assertEquals(app.getFilteredCardsByCategory().length, 1);
});

test('markBuried in a session buries the card, saves, and moves on', () => {
    const app = createApp();
    const a = app.addCard('а', 'a');
    app.addCard('б', 'b');
    app.startSession();
    app.markBuried();
    assertEquals(app.cards.find(c => c.id === a.id).buried, true);
    assertEquals(storedCards().find(c => c.id === a.id).buried, true);
    assertEquals(app.sessionCards.map(c => c.english), ['b']);
    assertEquals(app.inSession, true);
    assert(app.sessionReviewedCards.has(a.id), 'buried card counts as reviewed');
});

test('markBuried on the last remaining card ends the session', () => {
    const app = createApp();
    app.addCard('а', 'a');
    alerts.length = 0;
    app.startSession();
    app.markBuried();
    assertEquals(app.inSession, false);
    assert(alerts.some(m => m.startsWith('Session complete!')), 'should show the completion message');
});

finish();
