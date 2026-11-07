import { test, assert, assertEquals, finish, makeApp, sampleSession } from './helpers.js';

let userInfoCalls = 0;
const { request, repo, raw } = await makeApp({
    fetchUserInfo: async token => {
        userInfoCalls++;
        return token === 'alice' ? { email: 'alice@example.com', name: 'Alice' } : {};
    }
});

await test('POST /sessions stores a session and returns 201', async () => {
    const res = await request('POST', '/sessions', { token: 'alice', body: sampleSession({ seconds: 299.6, cards: '4' }) });
    assertEquals(res.status, 201);
    assertEquals(res.json, sampleSession({ seconds: 300, cards: 4 }));
    assertEquals((await raw.sessions())[0].userId, 'auth0|alice');
});

await test('POST /sessions accepts the app\'s `id` and a null startedAt', async () => {
    const res = await request('POST', '/sessions', {
        token: 'alice', body: { id: 'legacy-1', user: 'Guest', date: '2026-11-01', startedAt: null, seconds: 10, cards: 1 }
    });
    assertEquals(res.status, 201);
    assertEquals(res.json.clientId, 'legacy-1');
    assertEquals(res.json.startedAt, null);
    assert(!('user' in res.json), 'local user name is not stored');
});

await test('POST /sessions is idempotent on clientId', async () => {
    await request('POST', '/sessions', { token: 'alice', body: sampleSession({ seconds: 999 }) });
    const res = await request('GET', '/bootstrap', { token: 'alice' });
    assertEquals(res.json.studySessions.length, 2);
    assertEquals(res.json.studySessions.find(s => s.clientId === sampleSession().clientId).seconds, 300);
});

await test('POST /sessions validates date, seconds and cards', async () => {
    let res = await request('POST', '/sessions', { token: 'alice', body: sampleSession({ clientId: 'x1', date: '11/03/2026' }) });
    assertEquals(res.status, 400);
    res = await request('POST', '/sessions', { token: 'alice', body: sampleSession({ clientId: 'x2', seconds: 0 }) });
    assertEquals(res.status, 400);
    res = await request('POST', '/sessions', { token: 'alice', body: sampleSession({ clientId: 'x3', cards: -1 }) });
    assertEquals(res.status, 400);
    res = await request('POST', '/sessions', { token: 'alice', body: sampleSession({ clientId: 7 }) });
    assertEquals(res.status, 400, 'session ids are strings');
    res = await request('POST', '/sessions', { token: 'alice', body: sampleSession({ clientId: 'x4', startedAt: 'not a date' }) });
    assertEquals(res.status, 400);
});

await test('GET /bootstrap prunes sessions older than 365 days', async () => {
    await request('POST', '/sessions', { token: 'alice', body: sampleSession({ clientId: 'old', date: '2025-10-01' }) });
    await request('POST', '/sessions', { token: 'alice', body: sampleSession({ clientId: 'edge', date: '2025-11-03' }) });
    const res = await request('GET', '/bootstrap', { token: 'alice' });
    const ids = res.json.studySessions.map(s => s.clientId);
    assert(!ids.includes('old'), 'old session pruned');
    assert(ids.includes('edge'), 'session exactly 365 days old kept');
    assert(!(await raw.sessions()).some(s => s.clientId === 'old'), 'pruned from storage too');
});

await test('PUT /preferences stores a complete document with defaults filled in', async () => {
    const res = await request('PUT', '/preferences', { token: 'alice', body: { studyDirection: 'en-bg', activeCategories: [' Food ', 'Verbs'] } });
    assertEquals(res.status, 200);
    assertEquals(res.json, { studyDirection: 'en-bg', activeCategories: ['Food', 'Verbs'], shuffleEnabled: false, cardLimit: null, statsRangeDays: 7 });
    const boot = await request('GET', '/bootstrap', { token: 'alice' });
    assertEquals(boot.json.preferences, res.json);
});

await test('PUT /preferences validates each field', async () => {
    const bad = [
        { studyDirection: 'fr-en' },
        { activeCategories: 'Food' },
        { shuffleEnabled: 'true' },
        { cardLimit: 0 },
        { cardLimit: 2.5 },
        { statsRangeDays: 14 }
    ];
    for (const body of bad) {
        const res = await request('PUT', '/preferences', { token: 'alice', body });
        assertEquals(res.status, 400, `rejects ${JSON.stringify(body)}`);
    }
    const ok = await request('PUT', '/preferences', { token: 'alice', body: { cardLimit: null, statsRangeDays: 30 } });
    assertEquals(ok.status, 200);
    assertEquals(ok.json.cardLimit, null);
    assertEquals(ok.json.statsRangeDays, 30);
});

await test('GET /me creates the user with the Auth0 profile once, then serves it from the db', async () => {
    let res = await request('GET', '/me', { token: 'alice' });
    assertEquals(res.status, 200);
    assertEquals(res.json, {
        sub: 'auth0|alice', email: 'alice@example.com', name: 'Alice',
        createdAt: '2026-11-03T12:00:00.000Z', migratedFromLocalAt: null
    });
    assertEquals(userInfoCalls, 1);
    res = await request('GET', '/me', { token: 'alice' });
    assertEquals(res.json.email, 'alice@example.com');
    assertEquals(userInfoCalls, 1, 'profile not fetched again once stored');
});

await test('GET /me still works when the profile lookup has nothing', async () => {
    const res = await request('GET', '/me', { token: 'bob' });
    assertEquals(res.status, 200);
    assertEquals(res.json.sub, 'google-oauth2|bob');
    assertEquals(res.json.email, null);
    assertEquals(res.json.migratedFromLocalAt, null);
});

await finish();
