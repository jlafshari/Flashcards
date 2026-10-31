// Tests study-time tracking: per-user profiles, the study history log, and the stats
// aggregation behind the Stats tab. Runs against the real FlashcardApp in ../app.js.
const { createApp, captureAlerts, test, assert, assertEquals, finish, mockDOM } = require('./real-app.js');

captureAlerts();

const DAY_MS = 24 * 60 * 60 * 1000;

// A YYYY-MM-DD key `offset` days from today, matching FlashcardApp.dateKey()
function dayKey(offset = 0) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function logEntry(user, dayOffset, seconds, cards) {
    return {
        id: `${user}-${dayOffset}`,
        user,
        date: dayKey(dayOffset),
        startedAt: new Date(Date.now() + dayOffset * DAY_MS).toISOString(),
        seconds,
        cards
    };
}

// Builds an app whose saved study history is `history`
function appWithHistory(history, cards = [{ id: 1, bulgarian: 'а', english: 'a', category: '', buried: false }]) {
    createApp(cards);
    localStorage.setItem('studySessions', JSON.stringify(history));
    return new FlashcardApp();
}

// Runs a session that takes `seconds` and advances `cards` cards
function studyFor(app, seconds, cards = 0) {
    app.startSession();
    app.sessionStartTime = Date.now() - seconds * 1000;
    app.reviewedToday += cards;
    app.endSession();
}

const twoCards = [
    { id: 1, bulgarian: 'а', english: 'a', category: '', buried: false },
    { id: 2, bulgarian: 'б', english: 'b', category: '', buried: false }
];

// --- profiles ---

test('a first run sets up the default profile', () => {
    createApp();
    const app = new FlashcardApp();
    assertEquals(app.users, ['Guest']);
    assertEquals(app.currentUser, 'Guest');
    assertEquals(localStorage.getItem('currentUser'), 'Guest');
});

test('a new user is trimmed, added, and selected', () => {
    const app = createApp();
    app.addUser('  Maria  ');
    assertEquals(app.users, ['Guest', 'Maria']);
    assertEquals(app.currentUser, 'Maria');
});

test('an existing name is reused rather than duplicated, whatever its case', () => {
    const app = createApp();
    app.addUser('Maria');
    app.setCurrentUser('Guest');
    assertEquals(app.addUser('maria'), 'Maria');
    assertEquals(app.users, ['Guest', 'Maria']);
    assertEquals(app.currentUser, 'Maria', 'the existing profile should be selected');
});

test('a blank name is ignored', () => {
    const app = createApp();
    assertEquals(app.addUser('   '), null);
    assertEquals(app.addUser(null), null);
    assertEquals(app.users, ['Guest']);
});

test('the selected user is restored after a reload', () => {
    const app = createApp();
    app.addUser('Maria');
    const reloaded = new FlashcardApp();
    assertEquals(reloaded.users, ['Guest', 'Maria']);
    assertEquals(reloaded.currentUser, 'Maria');
});

test('an unreadable user list falls back to the default profile', () => {
    createApp();
    localStorage.setItem('studyUsers', '{oops');
    const app = new FlashcardApp();
    assertEquals(app.users, ['Guest']);
    assertEquals(app.currentUser, 'Guest');
});

test('choosing "+ New user..." opens the name field and leaves the picker alone', () => {
    const app = createApp();
    app.handleUserSelect('__new__');

    assertEquals(mockDOM['new-user-form'].style.display, 'inline-flex');
    assertEquals(mockDOM['user-select'].value, 'Guest', 'the picker should stay on the current user');
    assertEquals(app.currentUser, 'Guest');
});

test('a name typed into the field adds that user and closes the field', () => {
    const app = createApp();
    app.handleUserSelect('__new__');
    mockDOM['new-user-input'].value = ' Maria ';

    assertEquals(app.confirmNewUser(), 'Maria');
    assertEquals(app.users, ['Guest', 'Maria']);
    assertEquals(app.currentUser, 'Maria');
    assertEquals(mockDOM['new-user-form'].style.display, 'none');
});

test('an empty name field is treated as a cancel', () => {
    const app = createApp();
    app.handleUserSelect('__new__');
    mockDOM['new-user-input'].value = '   ';

    assertEquals(app.confirmNewUser(), null);
    assertEquals(app.users, ['Guest']);
    assertEquals(mockDOM['new-user-form'].style.display, 'none');
});

test('cancelling leaves the current user selected', () => {
    const app = createApp();
    app.addUser('Maria');
    app.handleUserSelect('__new__');
    app.hideNewUserForm();

    assertEquals(app.currentUser, 'Maria');
    assertEquals(mockDOM['user-select'].value, 'Maria');
    assertEquals(mockDOM['new-user-form'].style.display, 'none');
});

// --- recording sessions ---

test('a finished session is logged for the selected user', () => {
    const app = createApp(twoCards);
    app.addUser('Maria');
    studyFor(app, 65, 2);

    assertEquals(app.studySessions.length, 1);
    const record = app.studySessions[0];
    assertEquals(record.user, 'Maria');
    assertEquals(record.date, dayKey(0));
    assertEquals(record.seconds, 65);
    assertEquals(record.cards, 2);
});

test('a logged session survives a reload', () => {
    const app = createApp(twoCards);
    studyFor(app, 30, 1);
    const reloaded = new FlashcardApp();
    assertEquals(reloaded.studySessions.map(s => [s.user, s.seconds, s.cards]), [['Guest', 30, 1]]);
});

test('paused time is left out of the logged session', () => {
    const app = createApp(twoCards);
    app.startSession();
    app.sessionStartTime = Date.now() - 100 * 1000;
    app.sessionPausedTime = 40;
    app.endSession();
    assertEquals(app.studySessions[0].seconds, 60);
});

test('a session that took no time is not logged', () => {
    const app = createApp(twoCards);
    app.startSession();
    app.endSession();
    assertEquals(app.studySessions, []);
});

test('reviewing every card logs the session once', () => {
    const app = createApp(twoCards);
    const reviewedBefore = app.reviewedToday;
    app.startSession();
    app.sessionStartTime = Date.now() - 20 * 1000;
    app.markEasy(); // moves to the second card
    app.markEasy(); // last card: completes and ends the session

    assert(!app.inSession, 'the session should have ended');
    assertEquals(app.studySessions.length, 1);
    assertEquals(app.studySessions[0].cards, app.reviewedToday - reviewedBefore);
    assert(app.studySessions[0].seconds >= 20, 'the session time should be logged');
});

test('time counts for whoever started the session, not whoever is picked next', () => {
    const app = createApp(twoCards);
    app.addUser('Maria');
    app.startSession();
    app.sessionStartTime = Date.now() - 50 * 1000;

    app.setCurrentUser('Guest'); // ends the running session first

    assertEquals(app.studySessions.map(s => [s.user, s.seconds]), [['Maria', 50]]);
    assertEquals(app.currentUser, 'Guest');
});

// --- today's totals ---

test("today's totals follow the selected user", () => {
    const app = createApp(twoCards);
    app.addUser('Maria');
    studyFor(app, 120, 4);
    assertEquals(app.totalTimeToday, 120);
    assertEquals(app.reviewedToday, 4);

    app.setCurrentUser('Guest');
    assertEquals(app.totalTimeToday, 0, "Guest has not studied today");
    assertEquals(app.reviewedToday, 0);
    assertEquals(localStorage.getItem('totalTimeToday'), '0');

    studyFor(app, 30, 1);
    app.setCurrentUser('Maria');
    assertEquals(app.totalTimeToday, 120, "Maria's time should come back");
    assertEquals(app.reviewedToday, 4);
});

test("a day's sessions add up for the same user", () => {
    const app = createApp(twoCards);
    studyFor(app, 60, 2);
    studyFor(app, 90, 3);
    assertEquals(app.totalTimeToday, 150);
    assertEquals(app.studySessions.length, 2);
});

test('time tracked before the study history existed is kept for today', () => {
    createApp(twoCards);
    localStorage.setItem('reviewDate', new Date().toDateString());
    localStorage.setItem('reviewedToday', '5');
    localStorage.setItem('totalTimeToday', '300');
    localStorage.removeItem('studyHistoryMigrated');

    const app = new FlashcardApp();
    assertEquals(app.totalTimeToday, 300);
    assertEquals(app.studySessions.map(s => [s.user, s.date, s.seconds, s.cards]), [['Guest', dayKey(0), 300, 5]]);

    // Re-opening the app must not copy that time in a second time
    const reloaded = new FlashcardApp();
    assertEquals(reloaded.studySessions.length, 1);
});

// --- history storage ---

test('an unreadable history starts over instead of breaking the app', () => {
    createApp(twoCards);
    localStorage.setItem('studySessions', '{oops');
    const app = new FlashcardApp();
    assertEquals(app.studySessions, []);
    assertEquals(app.cards.length, 2, 'the deck should still load');
});

test('sessions older than a year are dropped', () => {
    const app = appWithHistory([
        logEntry('Guest', -400, 600, 10),
        logEntry('Guest', -300, 300, 5)
    ]);
    assertEquals(app.studySessions.map(s => s.date), [dayKey(-300)]);
    assertEquals(JSON.parse(localStorage.getItem('studySessions')).length, 1,
        'the dropped sessions should be removed from storage too');
});

test('a session saved without a user is kept under the default profile', () => {
    const app = appWithHistory([{ date: dayKey(-1), seconds: 60, cards: 2 }]);
    assertEquals(app.studySessions[0].user, 'Guest');
});

// --- stats ---

test('the 7-day range covers today and the six days before it', () => {
    const app = appWithHistory([
        logEntry('Guest', 0, 60, 1),
        logEntry('Guest', -6, 120, 2),
        logEntry('Guest', -7, 999, 9) // just outside the range
    ]);
    const stats = app.getStudyStats(7);
    assertEquals(stats.days.length, 7);
    assertEquals(stats.days[0].date, dayKey(-6));
    assertEquals(stats.days[6].date, dayKey(0));
    assertEquals(stats.totalSeconds, 180);
    assertEquals(stats.totalCards, 3);
    assertEquals(stats.totalSessions, 2);
});

test('the 30-day range reaches back further', () => {
    const app = appWithHistory([
        logEntry('Guest', -7, 999, 9),
        logEntry('Guest', -29, 100, 1),
        logEntry('Guest', -30, 500, 5) // just outside the range
    ]);
    const stats = app.getStudyStats(30);
    assertEquals(stats.days.length, 30);
    assertEquals(stats.totalSeconds, 1099);
});

test('a day adds up every session on it', () => {
    const app = appWithHistory([
        logEntry('Guest', -2, 60, 1),
        { ...logEntry('Guest', -2, 30, 2), id: 'second' }
    ]);
    const day = app.getStudyStats(7).days.find(d => d.date === dayKey(-2));
    assertEquals([day.seconds, day.cards, day.sessions], [90, 3, 2]);
});

test('the daily average spreads the range total over every day in it', () => {
    const app = appWithHistory([logEntry('Guest', -1, 700, 7)]);
    assertEquals(app.getStudyStats(7).averageSeconds, 100);
});

test('stats can be filtered to one user', () => {
    const app = appWithHistory([
        logEntry('Guest', -1, 60, 1),
        logEntry('Maria', -1, 240, 8)
    ]);
    const maria = app.getStudyStats(7, 'Maria');
    assertEquals(maria.totalSeconds, 240);
    assertEquals(maria.totalSessions, 1);
    assertEquals(maria.days.find(d => d.date === dayKey(-1)).seconds, 240);
});

test('the per-user breakdown covers everyone in the range, busiest first', () => {
    const app = appWithHistory([
        logEntry('Guest', -1, 60, 1),
        logEntry('Maria', -1, 240, 8),
        logEntry('Maria', -40, 900, 30) // outside the 7-day range
    ]);
    assertEquals(app.getStudyStats(7).byUser, [
        { user: 'Maria', seconds: 240, cards: 8, sessions: 1 },
        { user: 'Guest', seconds: 60, cards: 1, sessions: 1 }
    ]);
});

test('an empty range reports zeroes rather than failing', () => {
    const app = appWithHistory([]);
    const stats = app.getStudyStats(30);
    assertEquals([stats.totalSeconds, stats.totalCards, stats.totalSessions, stats.averageSeconds], [0, 0, 0, 0]);
    assertEquals(stats.byUser, []);
    assertEquals(stats.days.length, 30);
});

test('the stats filter falls back to all users when the chosen one is gone', () => {
    const app = appWithHistory([logEntry('Guest', -1, 60, 1)]);
    app.statsUser = 'Someone else';
    app.updateStatsControls();
    assertEquals(app.statsUser, '__all__');
});

test('the stats range is remembered across reloads', () => {
    const app = createApp(twoCards);
    app.setStatsRange(30);
    assertEquals(new FlashcardApp().statsRangeDays, 30);
});

finish();
