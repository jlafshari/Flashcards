// The HTTP API. createApp() takes its collaborators as arguments so tests can run the whole
// router in-process with a fake repository and a fake token verifier.
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { bearerAuth } from './auth.js';
import { DuplicateError } from './db.js';
import {
    ValidationError, MAX_BODY_BYTES, cardClientId, validateCard, validateCardPatch, validateCards,
    validateSession, validateSessions, validatePreferences, defaultPreferences, shiftDateKey
} from './validate.js';

export const STUDY_HISTORY_DAYS = 365;

async function readJson(c) {
    try {
        return await c.req.json();
    } catch (error) {
        throw new ValidationError('Body must be valid JSON');
    }
}

function executionContext(c) {
    try {
        return c.executionCtx;
    } catch (error) {
        return null; // not running inside a Worker (tests)
    }
}

async function loadState(repo, userId, now) {
    const [cards, studySessions, preferences] = await Promise.all([
        repo.listCards(userId),
        repo.listSessions(userId, shiftDateKey(now, -STUDY_HISTORY_DAYS)),
        repo.getPreferences(userId)
    ]);
    return { cards, studySessions, preferences: preferences ?? defaultPreferences() };
}

/**
 * @param {object} deps
 * @param {(token: string) => Promise<object>} deps.verifyToken  returns the JWT claims or throws
 * @param {() => Promise<object>} deps.openRepo  returns a repository with the MongoRepo interface
 * @param {string[]} deps.allowedOrigins  browser origins allowed by CORS
 * @param {(token: string) => Promise<{email?, name?}>} [deps.fetchUserInfo]
 * @param {() => Date} [deps.now]
 */
export function createApp({ verifyToken, openRepo, allowedOrigins = [], fetchUserInfo = null, now = () => new Date() }) {
    const app = new Hono();

    app.onError((error, c) => {
        if (error instanceof ValidationError) return c.json({ error: error.message }, 400);
        if (error instanceof DuplicateError) return c.json({ error: error.message }, 409);
        if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError') {
            console.error('database unavailable', error);
            return c.json({ error: 'Database unavailable' }, 503);
        }
        console.error('unhandled error', error);
        return c.json({ error: 'Internal error' }, 500);
    });

    app.use('*', cors({
        origin: origin => (allowedOrigins.includes(origin) ? origin : null),
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Authorization', 'Content-Type'],
        maxAge: 86400
    }));

    app.get('/health', c => c.json({ ok: true }));

    app.use('*', bodyLimit({
        maxSize: MAX_BODY_BYTES,
        onError: c => c.json({ error: `Body larger than ${MAX_BODY_BYTES} bytes` }, 413)
    }));

    app.use('*', bearerAuth(verifyToken));

    // One repository per request, closed after the response is sent
    app.use('*', async (c, next) => {
        const repo = await openRepo();
        c.set('repo', repo);
        try {
            await next();
        } finally {
            const closing = Promise.resolve(repo.close()).catch(error => console.error('repo.close failed', error));
            const ctx = executionContext(c);
            if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(closing);
            else await closing;
        }
    });

    app.get('/me', async c => {
        const repo = c.get('repo');
        const userId = c.get('userId');
        let user = await repo.getUser(userId);
        if (!user || !user.email) {
            const profile = fetchUserInfo ? await fetchUserInfo(c.get('token')) : {};
            user = await repo.upsertUser(userId, profile, now());
        }
        return c.json(user);
    });

    app.get('/bootstrap', async c => {
        const repo = c.get('repo');
        const userId = c.get('userId');
        await repo.pruneSessions(userId, shiftDateKey(now(), -STUDY_HISTORY_DAYS));
        return c.json(await loadState(repo, userId, now()));
    });

    app.post('/cards', async c => {
        const card = validateCard(await readJson(c));
        const stored = await c.get('repo').createCard(c.get('userId'), card);
        return c.json(stored, 201);
    });

    app.post('/cards/bulk', async c => {
        const body = await readJson(c);
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Body must be an object');
        const { cards } = validateCards(body.cards);
        const repo = c.get('repo');
        const userId = c.get('userId');
        let added;
        if (body.replace === true) {
            added = await repo.replaceCards(userId, cards);
        } else {
            added = await repo.addCards(userId, cards);
        }
        return c.json({ added, cards: await repo.listCards(userId) });
    });

    app.patch('/cards/:clientId', async c => {
        const clientId = cardClientId(c.req.param('clientId'));
        const fields = validateCardPatch(await readJson(c));
        const card = await c.get('repo').updateCard(c.get('userId'), clientId, fields);
        if (!card) return c.json({ error: 'Card not found' }, 404);
        return c.json(card);
    });

    app.delete('/cards/:clientId', async c => {
        const clientId = cardClientId(c.req.param('clientId'));
        const deleted = await c.get('repo').deleteCard(c.get('userId'), clientId);
        if (!deleted) return c.json({ error: 'Card not found' }, 404);
        return c.body(null, 204);
    });

    app.post('/sessions', async c => {
        const session = validateSession(await readJson(c));
        await c.get('repo').appendSession(c.get('userId'), session);
        return c.json(session, 201);
    });

    app.put('/preferences', async c => {
        const prefs = validatePreferences(await readJson(c));
        await c.get('repo').setPreferences(c.get('userId'), prefs);
        return c.json(prefs);
    });

    // One-time upload of the browser's localStorage. Safe to repeat: cards and sessions merge
    // by clientId and preferences are only taken when the account has none yet.
    app.post('/migrate', async c => {
        const body = await readJson(c);
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Body must be an object');
        const repo = c.get('repo');
        const userId = c.get('userId');

        const { cards, skipped: skippedCards } = validateCards(body.cards ?? [], { strict: false });
        const { sessions, skipped: skippedSessions } = validateSessions(body.studySessions ?? [], { strict: false });

        const addedCards = await repo.addCards(userId, cards);
        const addedSessions = await repo.addSessions(userId, sessions);

        let preferencesApplied = false;
        if (body.preferences && typeof body.preferences === 'object' && !(await repo.getPreferences(userId))) {
            try {
                await repo.setPreferences(userId, validatePreferences(body.preferences));
                preferencesApplied = true;
            } catch (error) {
                if (!(error instanceof ValidationError)) throw error;
            }
        }

        await repo.upsertUser(userId, {}, now());
        await repo.markMigrated(userId, now());

        const state = await loadState(repo, userId, now());
        return c.json({
            ...state,
            imported: {
                cards: addedCards,
                studySessions: addedSessions,
                preferencesApplied,
                skipped: { cards: skippedCards, studySessions: skippedSessions }
            }
        });
    });

    app.notFound(c => c.json({ error: 'Not found' }, 404));

    return app;
}
