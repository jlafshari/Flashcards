// Local-only smoke Worker: proves the MongoDB driver connects from the Workers runtime
// (workerd with nodejs_compat) and that MongoRepo's queries behave. It has no auth and is
// never deployed; run it with `npm run smoke` while a local MongoDB is up.
import { openRepo } from '../../src/db.js';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname !== '/smoke') return new Response('not found', { status: 404 });
        const started = Date.now();
        const repo = await openRepo(env.MONGODB_URI, env.DB_NAME || 'flashcards_smoke', { ensureIndexes: false });
        try {
            await repo.ensureIndexes();
            const userId = 'smoke|user';
            await repo.replaceCards(userId, []);
            await repo.createCard(userId, { clientId: 1, bulgarian: 'Да', english: 'Yes', category: '', createdAt: new Date().toISOString(), buried: false });
            let duplicate = false;
            try {
                await repo.createCard(userId, { clientId: 1, bulgarian: 'x', english: 'y', category: '', createdAt: new Date().toISOString(), buried: false });
            } catch (error) {
                duplicate = error.name === 'DuplicateError';
            }
            const updated = await repo.updateCard(userId, 1, { buried: true });
            const added = await repo.addCards(userId, [{ clientId: 1, bulgarian: 'a', english: 'b', category: '', createdAt: new Date().toISOString(), buried: false }, { clientId: 2, bulgarian: 'Не', english: 'No', category: '', createdAt: new Date().toISOString(), buried: false }]);
            const replaced = await repo.replaceCards(userId, [{ clientId: 3, bulgarian: 'Три', english: 'Three', category: '', createdAt: new Date().toISOString(), buried: false }]);
            const cards = await repo.listCards(userId);
            const firstInsert = await repo.appendSession(userId, { clientId: 's1', date: '2026-11-03', startedAt: null, seconds: 60, cards: 2 });
            const secondInsert = await repo.appendSession(userId, { clientId: 's1', date: '2026-11-03', startedAt: null, seconds: 60, cards: 2 });
            await repo.setPreferences(userId, { studyDirection: 'en-bg', activeCategories: null, shuffleEnabled: true, cardLimit: null, statsRangeDays: 7 });
            const prefs = await repo.getPreferences(userId);
            const user = await repo.upsertUser(userId, { email: 'smoke@example.com' });
            await repo.markMigrated(userId);
            const migrated = await repo.getUser(userId);
            return Response.json({
                ok: true,
                ms: Date.now() - started,
                duplicateDetected: duplicate,
                updatedBuried: updated?.buried,
                addedSkippingExisting: added,
                replaced,
                cards: cards.map(c => c.clientId),
                sessionIdempotent: firstInsert === true && secondInsert === false,
                prefs,
                user: user.email,
                migratedFromLocalAt: migrated.migratedFromLocalAt
            });
        } catch (error) {
            return Response.json({ ok: false, error: String(error && error.stack || error) }, { status: 500 });
        } finally {
            await repo.close();
        }
    }
};
