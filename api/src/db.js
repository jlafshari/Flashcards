// MongoDB Atlas repository. One MongoRepo is opened per request and closed when the
// response is done: Workers do not allow a socket opened during one request to be reused
// by another, so a module-level client would fail with "Cannot perform I/O on behalf of a
// different request". (A Durable Object could hold a persistent connection later.)
import { MongoClient } from 'mongodb';

export class DuplicateError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DuplicateError';
    }
}

const COLLECTIONS = {
    cards: 'cards',
    sessions: 'studySessions',
    preferences: 'preferences',
    users: 'users'
};

// Indexes are idempotent to create; we do it at most once per isolate, off the request path
let indexesEnsured = false;

export async function openRepo(uri, dbName = 'flashcards', { ensureIndexes = true } = {}) {
    if (!uri) throw new Error('MONGODB_URI is not configured');
    const client = new MongoClient(uri, {
        maxPoolSize: 3,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 20000
    });
    await client.connect();
    const repo = new MongoRepo(client, client.db(dbName));
    if (ensureIndexes && !indexesEnsured) {
        indexesEnsured = true;
        repo.ensureIndexes().catch(error => {
            indexesEnsured = false;
            console.error('ensureIndexes failed', error);
        });
    }
    return repo;
}

function toCard(doc) {
    return {
        clientId: doc.clientId,
        bulgarian: doc.bulgarian,
        english: doc.english,
        category: doc.category || '',
        createdAt: doc.createdAt,
        buried: doc.buried === true
    };
}

function toSession(doc) {
    return {
        clientId: doc.clientId,
        date: doc.date,
        startedAt: doc.startedAt ?? null,
        seconds: doc.seconds,
        cards: doc.cards
    };
}

function toPreferences(doc) {
    if (!doc) return null;
    const { _id, ...prefs } = doc;
    return prefs;
}

function toUser(doc) {
    if (!doc) return null;
    return {
        sub: doc._id,
        email: doc.email ?? null,
        name: doc.name ?? null,
        createdAt: doc.createdAt,
        migratedFromLocalAt: doc.migratedFromLocalAt ?? null
    };
}

function isDuplicateKey(error) {
    return error && (error.code === 11000 || (error.writeErrors || []).some(e => e.code === 11000));
}

export class MongoRepo {
    constructor(client, db) {
        this.client = client;
        this.db = db;
        this.cards = db.collection(COLLECTIONS.cards);
        this.sessions = db.collection(COLLECTIONS.sessions);
        this.preferences = db.collection(COLLECTIONS.preferences);
        this.users = db.collection(COLLECTIONS.users);
    }

    async close() {
        await this.client.close();
    }

    async ensureIndexes() {
        await Promise.all([
            this.cards.createIndex({ userId: 1, clientId: 1 }, { unique: true }),
            this.cards.createIndex({ userId: 1, createdAt: 1 }),
            this.sessions.createIndex({ userId: 1, clientId: 1 }, { unique: true }),
            this.sessions.createIndex({ userId: 1, date: 1 })
        ]);
    }

    // Users
    async getUser(sub) {
        return toUser(await this.users.findOne({ _id: sub }));
    }

    async upsertUser(sub, { email = null, name = null } = {}, now = new Date()) {
        const set = { lastSeenAt: now.toISOString() };
        if (email) set.email = email;
        if (name) set.name = name;
        const doc = await this.users.findOneAndUpdate(
            { _id: sub },
            { $set: set, $setOnInsert: { createdAt: now.toISOString(), migratedFromLocalAt: null } },
            { upsert: true, returnDocument: 'after' }
        );
        return toUser(doc);
    }

    async markMigrated(sub, now = new Date()) {
        await this.users.updateOne(
            { _id: sub, migratedFromLocalAt: null },
            { $set: { migratedFromLocalAt: now.toISOString() } }
        );
    }

    // Cards
    async listCards(userId) {
        const docs = await this.cards.find({ userId }).sort({ createdAt: 1, clientId: 1 }).toArray();
        return docs.map(toCard);
    }

    async createCard(userId, card) {
        try {
            await this.cards.insertOne({ userId, ...card });
        } catch (error) {
            if (isDuplicateKey(error)) throw new DuplicateError(`card ${card.clientId} already exists`);
            throw error;
        }
        return card;
    }

    async updateCard(userId, clientId, fields) {
        const doc = await this.cards.findOneAndUpdate(
            { userId, clientId },
            { $set: fields },
            { returnDocument: 'after' }
        );
        return doc ? toCard(doc) : null;
    }

    async deleteCard(userId, clientId) {
        const result = await this.cards.deleteOne({ userId, clientId });
        return result.deletedCount === 1;
    }

    // Replace the whole deck atomically (Atlas M0 is a replica set, so transactions work)
    async replaceCards(userId, cards) {
        const session = this.client.startSession();
        try {
            await session.withTransaction(async () => {
                await this.cards.deleteMany({ userId }, { session });
                if (cards.length > 0) {
                    await this.cards.insertMany(cards.map(card => ({ userId, ...card })), { session, ordered: false });
                }
            });
        } finally {
            await session.endSession();
        }
        return cards.length;
    }

    // Insert cards whose clientId the user does not already have; returns how many were added
    async addCards(userId, cards) {
        if (cards.length === 0) return 0;
        const existing = new Set(
            (await this.cards.find({ userId }, { projection: { clientId: 1 } }).toArray()).map(d => d.clientId)
        );
        const fresh = cards.filter(card => !existing.has(card.clientId));
        if (fresh.length === 0) return 0;
        try {
            const result = await this.cards.insertMany(fresh.map(card => ({ userId, ...card })), { ordered: false });
            return result.insertedCount;
        } catch (error) {
            // A concurrent insert of the same clientId is fine: the other write already landed
            if (isDuplicateKey(error)) return error.result?.insertedCount ?? 0;
            throw error;
        }
    }

    // Study sessions
    async listSessions(userId, sinceDateKey) {
        const filter = { userId };
        if (sinceDateKey) filter.date = { $gte: sinceDateKey };
        const docs = await this.sessions.find(filter).sort({ date: 1, startedAt: 1 }).toArray();
        return docs.map(toSession);
    }

    // Idempotent: a session with the same clientId is stored once
    async appendSession(userId, session) {
        const result = await this.sessions.updateOne(
            { userId, clientId: session.clientId },
            { $setOnInsert: { userId, ...session } },
            { upsert: true }
        );
        return result.upsertedCount === 1;
    }

    async addSessions(userId, sessions) {
        if (sessions.length === 0) return 0;
        const result = await this.sessions.bulkWrite(
            sessions.map(session => ({
                updateOne: {
                    filter: { userId, clientId: session.clientId },
                    update: { $setOnInsert: { userId, ...session } },
                    upsert: true
                }
            })),
            { ordered: false }
        );
        return result.upsertedCount;
    }

    async pruneSessions(userId, cutoffDateKey) {
        const result = await this.sessions.deleteMany({ userId, date: { $lt: cutoffDateKey } });
        return result.deletedCount;
    }

    // Preferences: one document per user
    async getPreferences(userId) {
        return toPreferences(await this.preferences.findOne({ _id: userId }));
    }

    async setPreferences(userId, prefs) {
        await this.preferences.replaceOne({ _id: userId }, { _id: userId, ...prefs }, { upsert: true });
        return prefs;
    }
}
