// mongodb+srv:// expansion over DNS-over-HTTPS, with the resolver's fetch mocked.
import { test, assert, assertEquals, finish } from './helpers.js';
import { resolveSrvUri, clearSrvCache, DOH_URL } from '../src/db.js';

// Builds a fetch that answers SRV and TXT lookups the way cloudflare-dns.com does
function dohFetch({ srv = [], txt = [], ttl = 300, status = 0, httpStatus = 200 } = {}) {
    const calls = [];
    const fetchImpl = async (url, init) => {
        calls.push(url);
        assert(url.startsWith(DOH_URL + '?'), 'queries go to the DoH endpoint');
        assertEquals(init.headers.accept, 'application/dns-json');
        const params = new URL(url).searchParams;
        const type = params.get('type');
        const records = type === 'SRV' ? srv : txt;
        const typeCode = type === 'SRV' ? 33 : 16;
        return {
            ok: httpStatus >= 200 && httpStatus < 300,
            status: httpStatus,
            json: async () => ({
                Status: records.length === 0 && type === 'TXT' ? 3 : status,
                Answer: records.map(data => ({ name: params.get('name'), type: typeCode, TTL: ttl, data }))
            })
        };
    };
    return { fetchImpl, calls };
}

// A seed list has several comma-separated hosts, which the URL parser rejects, so take it apart by hand
function parts(resolved) {
    const match = /^mongodb:\/\/(?:([^@]*)@)?([^/]+)(\/[^?]*)\?(.*)$/.exec(resolved);
    assert(match, `unexpected connection string: ${resolved}`);
    return { auth: match[1] || '', hosts: match[2], path: match[3], params: new URLSearchParams(match[4]) };
}

const atlas = {
    srv: [
        '0 0 27017 ac-abc123-shard-00-00.x1y2z3.mongodb.net.',
        '0 0 27017 ac-abc123-shard-00-01.x1y2z3.mongodb.net.',
        '0 0 27017 ac-abc123-shard-00-02.x1y2z3.mongodb.net.'
    ],
    txt: ['"authSource=admin&replicaSet=atlas-abc123-shard-0"']
};

await test('a plain mongodb:// URI is returned untouched without any lookup', async () => {
    const { fetchImpl, calls } = dohFetch();
    const uri = 'mongodb://localhost:27017/?replicaSet=rs0';
    assertEquals(await resolveSrvUri(uri, { fetchImpl }), uri);
    assertEquals(calls.length, 0);
});

await test('an Atlas SRV URI becomes a tls seed list with the TXT options and the URI options', async () => {
    clearSrvCache();
    const { fetchImpl, calls } = dohFetch(atlas);
    const resolved = await resolveSrvUri(
        'mongodb+srv://flashcards-api:s3cr%40t@cluster0.x1y2z3.mongodb.net/?retryWrites=true&w=majority&appName=Main',
        { fetchImpl }
    );
    const url = parts(resolved);
    assertEquals(url.auth, 'flashcards-api:s3cr%40t', 'credentials kept percent-encoded');
    assertEquals(
        url.hosts,
        'ac-abc123-shard-00-00.x1y2z3.mongodb.net:27017,ac-abc123-shard-00-01.x1y2z3.mongodb.net:27017,ac-abc123-shard-00-02.x1y2z3.mongodb.net:27017'
    );
    assertEquals(url.path, '/');
    assertEquals(url.params.get('authSource'), 'admin');
    assertEquals(url.params.get('replicaSet'), 'atlas-abc123-shard-0');
    assertEquals(url.params.get('tls'), 'true');
    assertEquals(url.params.get('retryWrites'), 'true');
    assertEquals(url.params.get('w'), 'majority');
    assertEquals(url.params.get('appName'), 'Main');
    assertEquals(calls.length, 2, 'one SRV and one TXT lookup');
    assert(calls.some(c => c.includes('name=_mongodb._tcp.cluster0.x1y2z3.mongodb.net&type=SRV')), 'SRV name prefixed');
    assert(calls.some(c => c.includes('name=cluster0.x1y2z3.mongodb.net&type=TXT')), 'TXT on the bare host');
});

await test('the lookup result is cached, so later connections make no DNS calls', async () => {
    const { fetchImpl, calls } = dohFetch(atlas);
    await resolveSrvUri('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', { fetchImpl });
    assertEquals(calls.length, 0, 'served from the cache filled by the previous test');
});

await test('the cache expires with the record TTL', async () => {
    clearSrvCache();
    let clock = 1_000_000;
    const { fetchImpl, calls } = dohFetch({ ...atlas, ttl: 120 });
    const options = { fetchImpl, now: () => clock };
    await resolveSrvUri('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', options);
    clock += 119_000;
    await resolveSrvUri('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', options);
    assertEquals(calls.length, 2, 'still cached just before the TTL');
    clock += 2_000;
    await resolveSrvUri('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', options);
    assertEquals(calls.length, 4, 'looked up again after the TTL');
});

await test('URI options override TXT options, and an explicit ssl setting is respected', async () => {
    clearSrvCache();
    const { fetchImpl } = dohFetch(atlas);
    const resolved = await resolveSrvUri('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/mydb?authSource=other&ssl=false', { fetchImpl });
    const url = parts(resolved);
    assertEquals(url.path, '/mydb');
    assertEquals(url.params.get('authSource'), 'other');
    assertEquals(url.params.get('ssl'), 'false');
    assertEquals(url.params.get('tls'), null);
});

await test('a missing TXT record is fine', async () => {
    clearSrvCache();
    const { fetchImpl } = dohFetch({ srv: atlas.srv, txt: [] });
    const resolved = await resolveSrvUri('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', { fetchImpl });
    assertEquals(parts(resolved).params.get('replicaSet'), null);
    assertEquals(parts(resolved).params.get('tls'), 'true');
});

async function expectSrvError(uri, dohOptions, pattern) {
    clearSrvCache();
    const { fetchImpl } = dohFetch(dohOptions);
    let caught = null;
    try {
        await resolveSrvUri(uri, { fetchImpl });
    } catch (error) {
        caught = error;
    }
    assert(caught, 'expected an error');
    assertEquals(caught.name, 'MongoSrvResolutionError');
    assert(pattern.test(caught.message), `message "${caught.message}" should match ${pattern}`);
}

await test('resolution errors are reported clearly as MongoSrvResolutionError', async () => {
    await expectSrvError('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', { srv: [] }, /No SRV records/);
    await expectSrvError('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', { srv: ['0 0 27017 evil.example.com.'] }, /outside x1y2z3.mongodb.net/);
    await expectSrvError('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', { ...atlas, txt: ['"readPreference=secondary"'] }, /disallowed option/);
    await expectSrvError('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', { ...atlas, txt: ['"authSource=admin"', '"replicaSet=x"'] }, /More than one TXT/);
    await expectSrvError('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', { ...atlas, httpStatus: 502 }, /HTTP 502/);
    await expectSrvError('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', { ...atlas, status: 2 }, /status 2/);
    await expectSrvError('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net:27017/', atlas, /must not include a port/);
    await expectSrvError('mongodb+srv://u:p@mongodb.net/', atlas, /at least three labels/);
});

await test('a DNS network failure is reported, not thrown as a bare fetch error', async () => {
    clearSrvCache();
    let caught = null;
    try {
        await resolveSrvUri('mongodb+srv://u:p@cluster0.x1y2z3.mongodb.net/', { fetchImpl: async () => { throw new TypeError('fetch failed'); } });
    } catch (error) {
        caught = error;
    }
    assertEquals(caught && caught.name, 'MongoSrvResolutionError');
    assert(/fetch failed/.test(caught.message));
});

await finish();
