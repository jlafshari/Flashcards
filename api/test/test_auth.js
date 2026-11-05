import { test, assert, assertEquals, finish, makeApp, ORIGIN, sampleCard } from './helpers.js';

const { request, repo, raw } = await makeApp();

await test('health needs no token', async () => {
    const res = await request('GET', '/health');
    assertEquals(res.status, 200);
    assertEquals(res.json, { ok: true });
});

await test('missing bearer token is rejected', async () => {
    const res = await request('GET', '/bootstrap');
    assertEquals(res.status, 401);
    assertEquals(res.json.error, 'Missing bearer token');
});

await test('malformed Authorization header is rejected', async () => {
    const res = await request('GET', '/bootstrap', { headers: { Authorization: 'Basic abc' } });
    assertEquals(res.status, 401);
});

await test('invalid token is rejected', async () => {
    const res = await request('GET', '/bootstrap', { token: 'forged' });
    assertEquals(res.status, 401);
    assertEquals(res.json.error, 'Invalid token');
});

await test('token without a sub is rejected', async () => {
    const res = await request('GET', '/bootstrap', { token: 'nosub' });
    assertEquals(res.status, 401);
});

await test('valid token reaches the route and the repo is closed afterwards', async () => {
    const before = raw.closed();
    const res = await request('GET', '/bootstrap', { token: 'alice' });
    assertEquals(res.status, 200);
    assertEquals(raw.closed(), before + 1, 'repo closed once per request');
});

await test('repo is closed even when a route fails validation', async () => {
    const before = raw.closed();
    const res = await request('POST', '/cards', { token: 'alice', body: {} });
    assertEquals(res.status, 400);
    assertEquals(raw.closed(), before + 1);
});

await test('CORS preflight allows the configured origin', async () => {
    const res = await request('OPTIONS', '/cards', {
        headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' }
    });
    assertEquals(res.status, 204);
    assertEquals(res.headers.get('access-control-allow-origin'), ORIGIN);
    assert(/PATCH/.test(res.headers.get('access-control-allow-methods')), 'PATCH allowed');
    assert(/authorization/i.test(res.headers.get('access-control-allow-headers')), 'Authorization header allowed');
});

await test('CORS does not echo an unknown origin', async () => {
    const res = await request('OPTIONS', '/cards', {
        headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' }
    });
    assert(!res.headers.get('access-control-allow-origin'), 'no allow-origin header for unknown origin');
});

await test('responses carry the CORS origin header for real requests', async () => {
    const res = await request('GET', '/bootstrap', { token: 'alice', headers: { Origin: ORIGIN } });
    assertEquals(res.headers.get('access-control-allow-origin'), ORIGIN);
});

await test('oversized bodies are refused with 413', async () => {
    const big = JSON.stringify({ cards: [sampleCard({ english: 'x'.repeat(1_100_000) })] });
    const res = await request('POST', '/cards/bulk', { token: 'alice', rawBody: big });
    assertEquals(res.status, 413);
});

await test('unknown routes return JSON 404', async () => {
    const res = await request('GET', '/nope', { token: 'alice' });
    assertEquals(res.status, 404);
    assertEquals(res.json, { error: 'Not found' });
});

await finish();
