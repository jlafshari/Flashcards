// Test harness: a tiny async test runner, an in-memory repository with the MongoRepo
// interface, and makeApp() which wires both into the real router.
import { createApp } from '../src/app.js';
import { DuplicateError, openRepo } from '../src/db.js';

// Set FLASHCARDS_TEST_MONGODB_URI to run the same tests against a real MongoDB (for example
// the Docker replica set from `npm run mongo:start`). Each test process gets its own database.
const MONGODB_URI = process.env.FLASHCARDS_TEST_MONGODB_URI || null;
const TEST_DB = `flashcards_test_${process.pid}_${Date.now()}`;
let mongoRepo = null;

let passed = 0;
let failed = 0;

export async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`✓ ${name}`);
    } catch (error) {
        failed++;
        console.log(`✗ ${name}\n  ${error.stack || error.message}`);
    }
}

export function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

export function assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message || 'Values differ'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

export async function finish() {
    if (mongoRepo) {
        await mongoRepo.db.dropDatabase();
        await mongoRepo.realClose();
    }
    console.log(`\n${passed} passed, ${failed} failed${MONGODB_URI ? ' (MongoDB)' : ' (in-memory)'}`);
    process.exit(failed ? 1 : 0);
}

// In-memory stand-in for MongoRepo. Keeps the same per-user scoping and duplicate rules.
export class FakeRepo {
    constructor() {
        this.cards = [];       // { userId, ...card }
        this.sessions = [];    // { userId, ...session }
        this.preferences = new Map();
        this.users = new Map();
        this.closed = 0;
    }

    async close() { this.closed++; }

    async getUser(sub) {
        return this.users.get(sub) ?? null;
    }

    async upsertUser(sub, { email = null, name = null } = {}, now = new Date()) {
        const existing = this.users.get(sub) ?? {
            sub, email: null, name: null, createdAt: now.toISOString(), migratedFromLocalAt: null
        };
        if (email) existing.email = email;
        if (name) existing.name = name;
        this.users.set(sub, existing);
        return { ...existing };
    }

    async markMigrated(sub, now = new Date()) {
        const user = this.users.get(sub);
        if (user && user.migratedFromLocalAt === null) user.migratedFromLocalAt = now.toISOString();
    }

    async listCards(userId) {
        return this.cards
            .filter(c => c.userId === userId)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.clientId - b.clientId)
            .map(({ userId: _u, ...card }) => ({ ...card }));
    }

    async createCard(userId, card) {
        if (this.cards.some(c => c.userId === userId && c.clientId === card.clientId)) {
            throw new DuplicateError(`card ${card.clientId} already exists`);
        }
        this.cards.push({ userId, ...card });
        return card;
    }

    async updateCard(userId, clientId, fields) {
        const card = this.cards.find(c => c.userId === userId && c.clientId === clientId);
        if (!card) return null;
        Object.assign(card, fields);
        const { userId: _u, ...rest } = card;
        return { ...rest };
    }

    async deleteCard(userId, clientId) {
        const before = this.cards.length;
        this.cards = this.cards.filter(c => !(c.userId === userId && c.clientId === clientId));
        return this.cards.length < before;
    }

    async replaceCards(userId, cards) {
        this.cards = this.cards.filter(c => c.userId !== userId);
        this.cards.push(...cards.map(card => ({ userId, ...card })));
        return cards.length;
    }

    async addCards(userId, cards) {
        let added = 0;
        for (const card of cards) {
            if (this.cards.some(c => c.userId === userId && c.clientId === card.clientId)) continue;
            this.cards.push({ userId, ...card });
            added++;
        }
        return added;
    }

    async listSessions(userId, sinceDateKey) {
        return this.sessions
            .filter(s => s.userId === userId && (!sinceDateKey || s.date >= sinceDateKey))
            .sort((a, b) => a.date.localeCompare(b.date) || String(a.startedAt).localeCompare(String(b.startedAt)))
            .map(({ userId: _u, ...session }) => ({ ...session }));
    }

    async appendSession(userId, session) {
        if (this.sessions.some(s => s.userId === userId && s.clientId === session.clientId)) return false;
        this.sessions.push({ userId, ...session });
        return true;
    }

    async addSessions(userId, sessions) {
        let added = 0;
        for (const session of sessions) {
            if (await this.appendSession(userId, session)) added++;
        }
        return added;
    }

    async pruneSessions(userId, cutoffDateKey) {
        const before = this.sessions.length;
        this.sessions = this.sessions.filter(s => !(s.userId === userId && s.date < cutoffDateKey));
        return before - this.sessions.length;
    }

    async getPreferences(userId) {
        const prefs = this.preferences.get(userId);
        return prefs ? { ...prefs } : null;
    }

    async setPreferences(userId, prefs) {
        this.preferences.set(userId, { ...prefs });
        return prefs;
    }
}

export const TOKENS = {
    alice: { sub: 'auth0|alice' },
    bob: { sub: 'google-oauth2|bob' },
    nosub: { aud: 'x' }
};

export const ORIGIN = 'https://jlafshari.github.io';

// The app closes the repo after every request; in MongoDB mode we keep one connection per
// test process, so close() only counts and the real close happens in finish().
async function openTestRepo() {
    if (!MONGODB_URI) return new FakeRepo();
    const repo = await openRepo(MONGODB_URI, TEST_DB, { ensureIndexes: false });
    await repo.ensureIndexes();
    repo.closed = 0;
    repo.realClose = repo.close.bind(repo);
    repo.close = async () => { repo.closed++; };
    mongoRepo = repo;
    return repo;
}

// Raw documents including userId, for assertions about scoping and storage
function inspector(repo) {
    if (repo instanceof FakeRepo) {
        return {
            cards: async () => repo.cards.map(c => ({ ...c })),
            sessions: async () => repo.sessions.map(s => ({ ...s })),
            closed: () => repo.closed
        };
    }
    const strip = docs => docs.map(({ _id, ...doc }) => doc);
    return {
        cards: async () => strip(await repo.cards.find({}).sort({ createdAt: 1, clientId: 1 }).toArray()),
        sessions: async () => strip(await repo.sessions.find({}).sort({ date: 1, startedAt: 1 }).toArray()),
        closed: () => repo.closed
    };
}

// Builds the real app around a repository and a verifier that accepts the tokens above
export async function makeApp(overrides = {}) {
    const repo = overrides.repo ?? await openTestRepo();
    const now = overrides.now ?? (() => new Date('2026-11-03T12:00:00Z'));
    const app = createApp({
        verifyToken: async token => {
            if (!(token in TOKENS)) throw new Error('bad token');
            return TOKENS[token];
        },
        openRepo: async () => repo,
        allowedOrigins: [ORIGIN],
        fetchUserInfo: overrides.fetchUserInfo ?? null,
        now
    });

    async function request(method, path, { token, body, headers = {}, rawBody } = {}) {
        const init = { method, headers: { ...headers } };
        if (token) init.headers.Authorization = `Bearer ${token}`;
        if (rawBody !== undefined) {
            init.body = rawBody;
            init.headers['Content-Type'] = init.headers['Content-Type'] || 'application/json';
        } else if (body !== undefined) {
            init.body = JSON.stringify(body);
            init.headers['Content-Type'] = 'application/json';
        }
        const response = await app.request(`http://api.test${path}`, init);
        const text = await response.text();
        let json = null;
        if (text) {
            try { json = JSON.parse(text); } catch (error) { json = text; }
        }
        return { status: response.status, json, headers: response.headers };
    }

    return { app, repo, request, raw: inspector(repo) };
}

export function sampleCard(overrides = {}) {
    return {
        clientId: 1700000000000,
        bulgarian: 'Здравей',
        english: 'Hello',
        category: 'Greetings',
        createdAt: '2026-01-01T00:00:00.000Z',
        buried: false,
        ...overrides
    };
}

export function sampleSession(overrides = {}) {
    return {
        clientId: '1762171200000-0',
        date: '2026-11-03',
        startedAt: '2026-11-03T11:00:00.000Z',
        seconds: 300,
        cards: 12,
        ...overrides
    };
}
