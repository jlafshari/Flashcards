import { test, assert, assertEquals, finish, makeApp, sampleCard } from './helpers.js';

const { request, repo, raw } = await makeApp();

await test('POST /cards stores a card and returns it with 201', async () => {
    const res = await request('POST', '/cards', { token: 'alice', body: sampleCard({ bulgarian: '  Здравей ', category: ' Greetings ' }) });
    assertEquals(res.status, 201);
    assertEquals(res.json, sampleCard());
    const stored = await raw.cards();
    assertEquals(stored.length, 1);
    assertEquals(stored[0].userId, 'auth0|alice');
});

await test('POST /cards accepts the app\'s `id` as an alias for clientId and drops unknown fields', async () => {
    const res = await request('POST', '/cards', {
        token: 'alice', body: { id: 2, bulgarian: 'Да', english: 'Yes', extra: 'nope' }
    });
    assertEquals(res.status, 201);
    assertEquals(res.json.clientId, 2);
    assertEquals(res.json.category, '');
    assertEquals(res.json.buried, false);
    assert(!('extra' in res.json), 'unknown field dropped');
    assert(typeof res.json.createdAt === 'string', 'createdAt defaulted');
});

await test('POST /cards rejects empty text, bad ids and non-JSON', async () => {
    let res = await request('POST', '/cards', { token: 'alice', body: sampleCard({ clientId: 3, english: '   ' }) });
    assertEquals(res.status, 400);
    assertEquals(res.json.error, 'english must not be empty');

    res = await request('POST', '/cards', { token: 'alice', body: sampleCard({ clientId: -1 }) });
    assertEquals(res.status, 400);

    res = await request('POST', '/cards', { token: 'alice', body: sampleCard({ clientId: 3, bulgarian: 42 }) });
    assertEquals(res.status, 400);

    res = await request('POST', '/cards', { token: 'alice', body: sampleCard({ clientId: 3, english: 'x'.repeat(501) }) });
    assertEquals(res.status, 400);

    res = await request('POST', '/cards', { token: 'alice', rawBody: '{not json' });
    assertEquals(res.status, 400);
    assertEquals(res.json.error, 'Body must be valid JSON');
});

await test('POST /cards with an existing clientId is a 409 for the same user only', async () => {
    let res = await request('POST', '/cards', { token: 'alice', body: sampleCard() });
    assertEquals(res.status, 409);

    res = await request('POST', '/cards', { token: 'bob', body: sampleCard() });
    assertEquals(res.status, 201, 'same clientId is fine for another user');
});

await test('GET /bootstrap returns only the caller\'s cards, oldest first', async () => {
    await request('POST', '/cards', { token: 'alice', body: sampleCard({ clientId: 5, createdAt: '2025-06-01T00:00:00.000Z' }) });
    const res = await request('GET', '/bootstrap', { token: 'alice' });
    assertEquals(res.status, 200);
    assertEquals(res.json.cards.map(c => c.clientId), [5, 1700000000000, 2]);
    assert(res.json.cards.every(c => !('userId' in c)), 'userId never leaks');
    assertEquals(res.json.studySessions, []);
    assertEquals(res.json.preferences.studyDirection, 'bg-en');
});

await test('PATCH /cards/:id updates only the given fields', async () => {
    const res = await request('PATCH', '/cards/1700000000000', { token: 'alice', body: { english: 'Hi', buried: true } });
    assertEquals(res.status, 200);
    assertEquals(res.json.english, 'Hi');
    assertEquals(res.json.buried, true);
    assertEquals(res.json.bulgarian, 'Здравей', 'untouched field kept');
});

await test('PATCH /cards/:id validates the patch', async () => {
    let res = await request('PATCH', '/cards/1700000000000', { token: 'alice', body: {} });
    assertEquals(res.status, 400);
    res = await request('PATCH', '/cards/1700000000000', { token: 'alice', body: { buried: 'yes' } });
    assertEquals(res.status, 400);
    res = await request('PATCH', '/cards/1700000000000', { token: 'alice', body: { english: '' } });
    assertEquals(res.status, 400);
    res = await request('PATCH', '/cards/abc', { token: 'alice', body: { english: 'x' } });
    assertEquals(res.status, 400);
});

await test('PATCH and DELETE on another user\'s card are 404', async () => {
    // bob owns his own card 1700000000000, but cards 2 and 5 are alice's only
    let res = await request('PATCH', '/cards/2', { token: 'bob', body: { english: 'Hijacked' } });
    assertEquals(res.status, 404);
    res = await request('DELETE', '/cards/5', { token: 'bob' });
    assertEquals(res.status, 404);
    const alice = await request('GET', '/bootstrap', { token: 'alice' });
    assertEquals(alice.json.cards.find(c => c.clientId === 2).english, 'Yes', 'alice\'s card unchanged');
    assertEquals(alice.json.cards.length, 3);
    const bob = await request('GET', '/bootstrap', { token: 'bob' });
    assertEquals(bob.json.cards.map(c => c.clientId), [1700000000000], 'bob still has only his own card');
});

await test('DELETE /cards/:id removes the card and returns 204, then 404', async () => {
    let res = await request('DELETE', '/cards/5', { token: 'alice' });
    assertEquals(res.status, 204);
    assertEquals(res.json, null);
    res = await request('DELETE', '/cards/5', { token: 'alice' });
    assertEquals(res.status, 404);
    const alice = await request('GET', '/bootstrap', { token: 'alice' });
    assertEquals(alice.json.cards.map(c => c.clientId), [1700000000000, 2]);
});

await finish();
