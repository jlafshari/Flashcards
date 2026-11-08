// Account sync: the API storage adapter, the pending-change queue, and the sign-in flow,
// all against a recorded fetch mock. The app's signed-out behaviour is covered by the rest
// of the suite; these tests only run the code that config.js would switch on.
const { createApp, assert, assertEquals, mockDOM } = require('./real-app.js');

let passed = 0;
let failed = 0;
async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`✓ ${name}`);
    } catch (error) {
        failed++;
        console.log(`✗ ${name}\n  ${error.stack || error.message}`);
    }
}

// Recording fetch mock. `routes` maps "METHOD /path" to a handler returning {status, body}
// or to an Error to throw (a network failure). Unmatched routes answer 200 {}.
function mockFetch(routes = {}) {
    const calls = [];
    global.fetch = async (url, init = {}) => {
        const method = init.method || 'GET';
        const path = url.replace(/^https?:\/\/[^/]+/, '');
        const call = { method, path, url, headers: init.headers || {}, body: init.body ? JSON.parse(init.body) : undefined };
        calls.push(call);
        const handler = routes[`${method} ${path}`] || routes[`${method} *`];
        let result = { status: 200, body: {} };
        if (typeof handler === 'function') result = await handler(call);
        else if (handler) result = handler;
        if (result instanceof Error) throw result;
        return {
            ok: result.status >= 200 && result.status < 300,
            status: result.status,
            json: async () => {
                if (result.body === undefined) throw new Error('no body');
                return result.body;
            }
        };
    };
    return calls;
}

const sampleCard = { id: 1700000000000, bulgarian: 'Здравей', english: 'Hello', category: 'Greetings', createdAt: '2026-01-01T00:00:00.000Z', buried: false };
const apiCard = { clientId: 1700000000000, bulgarian: 'Здравей', english: 'Hello', category: 'Greetings', createdAt: '2026-01-01T00:00:00.000Z', buried: false };

function makeAdapter(statuses = []) {
    const api = new ApiClient('https://api.test/', async () => 'tok-123');
    return new ApiStorageAdapter(api, 'auth0|alice', status => statuses.push(status.state));
}

(async function main() {
await test('each card, session and preference change becomes one request with the token', async () => {
    localStorage.clear();
    const calls = mockFetch({ 'POST /cards': { status: 201, body: apiCard }, 'DELETE /cards/1700000000000': { status: 204 } });
    const adapter = makeAdapter();
    const cards = [sampleCard];

    assertEquals(await adapter.createCard(sampleCard, cards), true);
    assertEquals(await adapter.updateCard(sampleCard.id, { buried: true }, cards), true);
    assertEquals(await adapter.deleteCard(sampleCard.id, []), true);
    await adapter.addCards([sampleCard], cards);
    await adapter.replaceCards(cards);
    await adapter.appendSession({ id: 's-1', user: 'alice', date: '2026-11-03', startedAt: '2026-11-03T10:00:00.000Z', seconds: 90, cards: 4 }, []);
    await adapter.savePreferences({ studyDirection: 'en-bg', activeCategories: null, shuffleEnabled: true, cardLimit: null, statsRangeDays: 7 });

    assertEquals(calls.map(c => `${c.method} ${c.path}`), [
        'POST /cards', 'PATCH /cards/1700000000000', 'DELETE /cards/1700000000000',
        'POST /cards/bulk', 'POST /cards/bulk', 'POST /sessions', 'PUT /preferences'
    ]);
    assert(calls.every(c => c.headers.Authorization === 'Bearer tok-123'), 'bearer token on every call');
    assertEquals(calls[0].body, apiCard, 'card sent in API shape (clientId, not id)');
    assertEquals(calls[1].body, { buried: true });
    assertEquals(calls[2].body, undefined, 'DELETE has no body');
    assertEquals(calls[3].body, { cards: [apiCard] }, 'merge import is a bulk add');
    assertEquals(calls[4].body, { cards: [apiCard], replace: true }, 'replace import replaces');
    assertEquals(calls[5].body, { clientId: 's-1', date: '2026-11-03', startedAt: '2026-11-03T10:00:00.000Z', seconds: 90, cards: 4 }, 'session without the local user name');
    assertEquals(calls[6].body.studyDirection, 'en-bg');
    assertEquals(calls[0].url, 'https://api.test/cards', 'trailing slash on API_BASE handled');
    assertEquals(JSON.parse(localStorage.getItem('account:auth0|alice:flashcards')), cards, 'cache written under the account prefix');
    assertEquals(localStorage.getItem('flashcards'), null, 'guest storage untouched');
});

await test('changes wait in a persisted queue while offline and replay in order later', async () => {
    localStorage.clear();
    const statuses = [];
    let online = false;
    const calls = mockFetch({ 'POST *': () => (online ? { status: 201, body: {} } : new TypeError('Failed to fetch')), 'PATCH *': () => (online ? { status: 200, body: {} } : new TypeError('Failed to fetch')) });
    const adapter = makeAdapter(statuses);

    assertEquals(await adapter.createCard(sampleCard, [sampleCard]), false, 'flush reports failure');
    await adapter.updateCard(sampleCard.id, { english: 'Hi' }, [sampleCard]);
    assertEquals(adapter.pendingCount, 2);
    assertEquals(statuses[statuses.length - 1], 'offline');
    const persisted = JSON.parse(localStorage.getItem('account:auth0|alice:pendingOps'));
    assertEquals(persisted.map(op => `${op.method} ${op.path}`), ['POST /cards', 'PATCH /cards/1700000000000'], 'queue survives in storage');

    // A fresh page load picks the queue up again
    online = true;
    calls.length = 0;
    const later = makeAdapter(statuses);
    assertEquals(later.pendingCount, 2);
    assertEquals(await later.flush(), true);
    assertEquals(calls.map(c => `${c.method} ${c.path}`), ['POST /cards', 'PATCH /cards/1700000000000']);
    assertEquals(later.pendingCount, 0);
    assertEquals(localStorage.getItem('account:auth0|alice:pendingOps'), null, 'queue cleared once sent');
    assertEquals(statuses[statuses.length - 1], 'synced');
});

await test('a change the server rejects outright is dropped so later ones still go through', async () => {
    localStorage.clear();
    const calls = mockFetch({ 'PATCH /cards/999': { status: 404, body: { error: 'Card not found' } }, 'POST /cards': { status: 201, body: apiCard } });
    const adapter = makeAdapter();
    const originalError = console.error;
    console.error = () => {};
    try {
        await adapter.updateCard(999, { english: 'x' }, []);
        assertEquals(await adapter.createCard(sampleCard, [sampleCard]), true);
    } finally {
        console.error = originalError;
    }
    assertEquals(calls.map(c => `${c.method} ${c.path}`), ['PATCH /cards/999', 'POST /cards']);
    assertEquals(adapter.pendingCount, 0);
});

await test('only the latest unsent preferences are kept', async () => {
    localStorage.clear();
    mockFetch({ 'PUT *': () => new TypeError('offline') });
    const adapter = makeAdapter();
    await adapter.savePreferences({ studyDirection: 'bg-en', activeCategories: null, shuffleEnabled: false, cardLimit: null, statsRangeDays: 7 });
    await adapter.savePreferences({ studyDirection: 'en-bg', activeCategories: null, shuffleEnabled: false, cardLimit: null, statsRangeDays: 30 });
    assertEquals(adapter.pendingCount, 1);
    assertEquals(adapter.queue[0].body.statsRangeDays, 30);
});

// Stand-in for AccountAuth once Auth0 has signed someone in
function fakeAuth(user = { sub: 'auth0|alice', email: 'alice@example.com' }) {
    const calls = { login: 0, logout: 0 };
    return {
        calls,
        configured: true,
        config: { API_BASE: 'https://api.test', AUTH0_DOMAIN: 'x', AUTH0_CLIENT_ID: 'x', AUTH0_AUDIENCE: 'x' },
        client: {},
        user,
        get accountId() { return this.user ? this.user.sub : null; },
        get displayName() { return this.user ? (this.user.email || this.user.sub) : null; },
        async init() { return this.user; },
        async getToken() { return 'tok-123'; },
        login() { calls.login++; },
        logout() { calls.logout++; this.user = null; }
    };
}

await test('without config.js values the app stays local and hides the account bar', async () => {
    const app = createApp([sampleCard]);
    assertEquals(app.auth.configured, false);
    assertEquals(app.connectAccount(), null);
    assertEquals(app.account, null);
    assertEquals(mockDOM['account-bar'].style.display, 'none');
    assertEquals(mockDOM['local-user-controls'].style.display, '');
    assertEquals(JSON.parse(localStorage.getItem('flashcards')).length, 1, 'guest storage still used');
});

await test('first sign-in migrates the guest data, then the account data replaces it', async () => {
    const app = createApp([sampleCard]);
    const today = app.dateKey(Date.now());
    localStorage.setItem('studySessions', JSON.stringify([{ id: 'g-1', user: 'Guest', date: '2026-10-30', startedAt: null, seconds: 60, cards: 2 }]));
    localStorage.setItem('studyDirection', 'en-bg');
    localStorage.setItem('cardLimit', '12');
    const serverCard = { clientId: 42, bulgarian: 'Не', english: 'No', category: '', createdAt: '2026-02-02T00:00:00.000Z', buried: true };
    const serverState = {
        cards: [serverCard],
        studySessions: [{ clientId: 's-1', date: today, startedAt: null, seconds: 120, cards: 3 }],
        preferences: { studyDirection: 'en-bg', activeCategories: ['Food'], shuffleEnabled: true, cardLimit: 5, statsRangeDays: 30 }
    };
    const calls = mockFetch({
        'GET /me': { status: 200, body: { sub: 'auth0|alice', email: 'alice@example.com', migratedFromLocalAt: null } },
        'POST /migrate': { status: 200, body: { ...serverState, imported: {} } },
        'GET /bootstrap': { status: 200, body: serverState }
    });

    app.auth = fakeAuth();
    await app.startAccountSession();

    assertEquals(calls.map(c => `${c.method} ${c.path}`), ['GET /me', 'POST /migrate', 'GET /bootstrap']);
    const migrate = calls[1].body;
    assertEquals(migrate.cards, [apiCard], 'guest cards uploaded in API shape');
    assertEquals(migrate.studySessions, [{ clientId: 'g-1', date: '2026-10-30', startedAt: null, seconds: 60, cards: 2 }]);
    assertEquals(migrate.preferences, { studyDirection: 'en-bg', activeCategories: null, shuffleEnabled: false, cardLimit: 12, statsRangeDays: 7 });

    assertEquals(app.account, { id: 'auth0|alice', name: 'alice@example.com' });
    assertEquals(app.users, ['alice@example.com']);
    assertEquals(app.currentUser, 'alice@example.com');
    assertEquals(app.cards, [{ id: 42, bulgarian: 'Не', english: 'No', category: '', createdAt: '2026-02-02T00:00:00.000Z', buried: true }]);
    assertEquals(app.lastCardId, 42);
    assertEquals(app.studySessions, [{ id: 's-1', user: 'alice@example.com', date: today, startedAt: null, seconds: 120, cards: 3 }]);
    assertEquals(app.totalTimeToday, 120, 'today\'s totals come from the account\'s sessions');
    assertEquals(app.reviewedToday, 3);
    assertEquals(app.direction, 'en-bg');
    assertEquals(app.activeCategories, ['Food']);
    assertEquals(app.shuffleEnabled, true);
    assertEquals(app.cardLimit, 5);
    assertEquals(app.statsRangeDays, 30);
    assertEquals(app.syncStatus.state, 'synced');

    assertEquals(JSON.parse(localStorage.getItem('account:auth0|alice:flashcards')), app.cards, 'account cache written');
    assertEquals(JSON.parse(localStorage.getItem('flashcards')), [sampleCard], 'guest deck left alone');
    assertEquals(mockDOM['local-user-controls'].style.display, 'none');
    assertEquals(mockDOM['stats-user-filter'].style.display, 'none');
    assertEquals(mockDOM['account-bar'].style.display, 'flex');
    assertEquals(mockDOM['account-name'].textContent, 'alice@example.com');
    assertEquals(mockDOM['sign-in-btn'].style.display, 'none');
    assertEquals(mockDOM['sign-out-btn'].style.display, '');
    assertEquals(mockDOM['sync-status'].textContent, 'Saved to your account');

    // Changes made while signed in go to the API, not to the guest deck
    calls.length = 0;
    const added = app.addCard('Да', 'Yes', 'Basics');
    await app.storage.flush();
    assertEquals(calls.map(c => `${c.method} ${c.path}`), ['POST /cards']);
    assertEquals(calls[0].body.clientId, added.id);
    assert(added.id > 42, 'ids continue above the account\'s highest id');
    assertEquals(JSON.parse(localStorage.getItem('flashcards')), [sampleCard], 'guest deck still untouched');

    app.setDirection('bg-en');
    await app.storage.flush();
    assertEquals(calls[calls.length - 1].path, '/preferences');
    assertEquals(calls[calls.length - 1].body, { studyDirection: 'bg-en', activeCategories: ['Food'], shuffleEnabled: true, cardLimit: 5, statsRangeDays: 30 });
});

await test('an account that already migrated is not migrated again', async () => {
    const app = createApp([sampleCard]);
    const calls = mockFetch({
        'GET /me': { status: 200, body: { sub: 'auth0|alice', migratedFromLocalAt: '2026-11-01T00:00:00.000Z' } },
        'GET /bootstrap': { status: 200, body: { cards: [], studySessions: [], preferences: {} } }
    });
    app.auth = fakeAuth();
    await app.startAccountSession();
    assertEquals(calls.map(c => `${c.method} ${c.path}`), ['GET /me', 'GET /bootstrap']);
    assertEquals(app.cards, [], 'an empty account deck is not seeded with sample cards');
});

await test('when the API is unreachable the cached account copy is shown and a banner appears', async () => {
    const app = createApp([sampleCard]);
    localStorage.setItem('account:auth0|alice:flashcards', JSON.stringify([{ id: 7, bulgarian: 'Кеш', english: 'Cache', category: '', createdAt: '2026-01-01T00:00:00.000Z', buried: false }]));
    mockFetch({ 'GET *': () => new TypeError('Failed to fetch') });
    const originalError = console.error;
    console.error = () => {};
    try {
        app.auth = fakeAuth();
        await app.startAccountSession();
    } finally {
        console.error = originalError;
    }
    assertEquals(app.cards.map(c => c.english), ['Cache']);
    assertEquals(app.syncStatus.state, 'offline');
    assertEquals(mockDOM['sync-banner'].style.display, '');
    assertEquals(mockDOM['sync-status'].textContent, 'Offline: showing your last synced copy');
});

await test('a server-side failure shows the server\'s reason instead of the generic offline text', async () => {
    const app = createApp([sampleCard]);
    mockFetch({ 'GET /me': { status: 503, body: { error: 'Database unavailable: No SRV records found' } } });
    const originalError = console.error;
    console.error = () => {};
    try {
        app.auth = fakeAuth();
        await app.startAccountSession();
    } finally {
        console.error = originalError;
    }
    assertEquals(app.syncStatus.state, 'offline');
    assertEquals(mockDOM['sync-status'].textContent, 'Server error 503: Database unavailable: No SRV records found');
    assertEquals(mockDOM['sync-banner'].style.display, '');
});

await test('signing out sends pending changes, clears the account cache and calls Auth0', async () => {
    const app = createApp([sampleCard]);
    mockFetch({
        'GET /me': { status: 200, body: { migratedFromLocalAt: '2026-11-01T00:00:00.000Z' } },
        'GET /bootstrap': { status: 200, body: { cards: [apiCard], studySessions: [], preferences: {} } },
        'POST /cards': { status: 201, body: {} }
    });
    const auth = fakeAuth();
    app.auth = auth;
    await app.startAccountSession();
    app.addCard('Едно', 'One', '');
    assert(localStorage.getItem('account:auth0|alice:flashcards'), 'cache present before sign-out');

    await app.signOut();
    assertEquals(auth.calls.logout, 1);
    assertEquals(app.account, null);
    assertEquals(localStorage.getItem('account:auth0|alice:flashcards'), null, 'account cache removed');
    assertEquals(JSON.parse(localStorage.getItem('flashcards')), [sampleCard], 'guest deck kept');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
})();
