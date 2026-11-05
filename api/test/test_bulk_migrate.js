import { test, assert, assertEquals, finish, makeApp, sampleCard, sampleSession } from './helpers.js';

const { request, repo, raw } = await makeApp();

await test('POST /cards/bulk merge adds new cards and skips existing clientIds', async () => {
    await request('POST', '/cards', { token: 'alice', body: sampleCard({ clientId: 1 }) });
    const res = await request('POST', '/cards/bulk', {
        token: 'alice',
        body: { cards: [sampleCard({ clientId: 1, english: 'changed' }), sampleCard({ clientId: 2 }), sampleCard({ clientId: 2 })] }
    });
    assertEquals(res.status, 200);
    assertEquals(res.json.added, 1);
    assertEquals(res.json.cards.map(c => c.clientId), [1, 2]);
    assertEquals(res.json.cards[0].english, 'Hello', 'existing card not overwritten by merge');
});

await test('POST /cards/bulk replace swaps the whole deck for this user only', async () => {
    await request('POST', '/cards', { token: 'bob', body: sampleCard({ clientId: 1 }) });
    const res = await request('POST', '/cards/bulk', {
        token: 'alice', body: { cards: [sampleCard({ clientId: 10 }), sampleCard({ clientId: 11 })], replace: true }
    });
    assertEquals(res.status, 200);
    assertEquals(res.json.added, 2);
    assertEquals(res.json.cards.map(c => c.clientId), [10, 11]);
    const bob = await request('GET', '/bootstrap', { token: 'bob' });
    assertEquals(bob.json.cards.map(c => c.clientId), [1], 'bob untouched');
});

await test('POST /cards/bulk is strict: one bad card fails the request', async () => {
    const res = await request('POST', '/cards/bulk', {
        token: 'alice', body: { cards: [sampleCard({ clientId: 12 }), sampleCard({ clientId: 13, bulgarian: '' })] }
    });
    assertEquals(res.status, 400);
    const alice = await request('GET', '/bootstrap', { token: 'alice' });
    assertEquals(alice.json.cards.map(c => c.clientId), [10, 11], 'nothing partially applied');
});

await test('POST /cards/bulk rejects non-arrays and oversized lists', async () => {
    let res = await request('POST', '/cards/bulk', { token: 'alice', body: { cards: 'nope' } });
    assertEquals(res.status, 400);
    const many = Array.from({ length: 10001 }, (_, i) => ({ clientId: i + 1, bulgarian: 'a', english: 'b' }));
    res = await request('POST', '/cards/bulk', { token: 'alice', body: { cards: many } });
    assertEquals(res.status, 400);
});

const localData = {
    cards: [
        sampleCard({ clientId: 10, english: 'from local' }),      // already in the account
        sampleCard({ clientId: 20 }),
        { id: 21, bulgarian: '', english: 'bad' },                 // invalid: skipped, not fatal
        sampleCard({ clientId: 20 })                               // duplicate within upload
    ],
    studySessions: [
        sampleSession({ clientId: 's1' }),
        sampleSession({ clientId: 's2', date: 'yesterday' }),      // invalid: skipped
        { id: 's3', user: 'Guest', date: '2026-11-02', startedAt: null, seconds: 60, cards: 3 }
    ],
    preferences: { studyDirection: 'en-bg', shuffleEnabled: true, cardLimit: 15, statsRangeDays: 30 }
};

await test('POST /migrate merges cards and sessions, applies preferences, marks the user', async () => {
    const res = await request('POST', '/migrate', { token: 'alice', body: localData });
    assertEquals(res.status, 200);
    assertEquals(res.json.imported, {
        cards: 1, studySessions: 2, preferencesApplied: true, skipped: { cards: 2, studySessions: 1 }
    });
    assertEquals(res.json.cards.map(c => c.clientId), [10, 11, 20]);
    assertEquals(res.json.cards[0].english, 'Hello', 'existing card wins over local copy');
    assertEquals(res.json.studySessions.map(s => s.clientId), ['s3', 's1']);
    assertEquals(res.json.studySessions[0].startedAt, null);
    assertEquals(res.json.preferences, {
        studyDirection: 'en-bg', activeCategories: null, shuffleEnabled: true, cardLimit: 15, statsRangeDays: 30
    });
    const me = await request('GET', '/me', { token: 'alice' });
    assertEquals(me.json.migratedFromLocalAt, '2026-11-03T12:00:00.000Z');
});

await test('POST /migrate is idempotent', async () => {
    await request('PUT', '/preferences', { token: 'alice', body: { studyDirection: 'bg-en' } });
    const res = await request('POST', '/migrate', { token: 'alice', body: localData });
    assertEquals(res.status, 200);
    assertEquals(res.json.imported.cards, 0);
    assertEquals(res.json.imported.studySessions, 0);
    assertEquals(res.json.imported.preferencesApplied, false, 'existing preferences are kept');
    assertEquals(res.json.preferences.studyDirection, 'bg-en');
    assertEquals(res.json.cards.length, 3);
    assertEquals(res.json.studySessions.length, 2);
});

await test('POST /migrate with an empty payload still marks the account migrated', async () => {
    const res = await request('POST', '/migrate', { token: 'bob', body: {} });
    assertEquals(res.status, 200);
    assertEquals(res.json.imported.cards, 0);
    assert((await repo.getUser('google-oauth2|bob')).migratedFromLocalAt, 'bob marked migrated');
});

await test('POST /migrate rejects a non-object body', async () => {
    const res = await request('POST', '/migrate', { token: 'bob', body: [1, 2] });
    assertEquals(res.status, 400);
});

await finish();
