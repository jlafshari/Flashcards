// Tests that the session's "X / Y" position counter keeps the total fixed at the number of
// cards the session started with, against the real FlashcardApp in ../app.js.
const { createApp, captureAlerts, test, assertEquals, finish, mockDOM } = require('./real-app.js');

captureAlerts();

function startSession(count) {
    const cards = [];
    for (let i = 1; i <= count; i++) {
        cards.push({ id: i, bulgarian: `bg${i}`, english: `en${i}`, category: '' });
    }
    const app = createApp(cards);
    app.shuffleEnabled = false;
    app.cardLimit = null;
    app.startSession();
    return app;
}

function position() {
    return mockDOM['card-position'].textContent;
}

test('session starts at 1 / N', () => {
    startSession(3);
    assertEquals(position(), '1 / 3');
});

test('reviewing a card again a second time keeps the total', () => {
    const app = startSession(2);
    app.markForReview(); // card 1 moves to the end; card 2 shown
    assertEquals(position(), '1 / 2');
    app.markEasy(); // card 1 shown again
    assertEquals(position(), '2 / 2');
    app.markForReview(); // card 1 reviewed again a second time
    assertEquals(position(), '2 / 2');
    assertEquals(app.getFilteredCards()[app.currentCardIndex].id, 1);
});

test('reviewing again repeatedly with other cards keeps the total', () => {
    const app = startSession(3);
    app.markForReview(); // 2, 3, 1
    app.markEasy();
    app.markEasy(); // card 1 again
    assertEquals(position(), '3 / 3');
    app.markForReview();
    app.markForReview();
    assertEquals(position(), '3 / 3');
});

test('burying a card keeps the total and advances the position', () => {
    const app = startSession(5);
    app.markEasy();
    assertEquals(position(), '2 / 5');
    app.markBuried();
    assertEquals(position(), '3 / 5');
    assertEquals(app.getFilteredCards()[app.currentCardIndex].id, 3);
    app.markEasy();
    app.markEasy();
    assertEquals(position(), '5 / 5');
});

test('burying the first card shows 2 / N', () => {
    const app = startSession(3);
    app.markBuried();
    assertEquals(position(), '2 / 3');
});

finish();
