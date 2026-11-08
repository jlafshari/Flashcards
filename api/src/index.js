// Cloudflare Worker entry point. Wires the real Auth0 verifier and MongoDB repository into
// the app; configuration comes from wrangler.toml [vars] plus the MONGODB_URI secret.
import { createApp } from './app.js';
import { createTokenVerifier, createUserInfoFetcher } from './auth.js';
import { openRepo } from './db.js';

let app = null;

function parseOrigins(value) {
    return String(value || '')
        .split(',')
        .map(origin => origin.trim().replace(/\/$/, ''))
        .filter(Boolean);
}

function getApp(env) {
    if (!app) {
        const verifyToken = createTokenVerifier({ domain: env.AUTH0_DOMAIN, audience: env.AUTH0_AUDIENCE });
        app = createApp({
            verifyToken,
            openRepo: () => openRepo(env.MONGODB_URI, env.DB_NAME || 'flashcards'),
            allowedOrigins: parseOrigins(env.ALLOWED_ORIGINS),
            fetchUserInfo: createUserInfoFetcher(env.AUTH0_DOMAIN)
        });
    }
    return app;
}

export default {
    fetch(request, env, ctx) {
        return getApp(env).fetch(request, env, ctx);
    }
};
