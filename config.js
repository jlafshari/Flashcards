// Account backend settings. These are public client-side values; no secrets belong here.
// With AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE or API_BASE left empty the app runs
// exactly as before, saving cards only in this browser. Setup steps are in api/README.md.

// The page served from localhost talks to `npm run dev` in api/; anywhere else, to the
// deployed Worker. Replace the whole expression with one URL to force a specific API.
const FLASHCARDS_LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

window.FLASHCARDS_CONFIG = {
    AUTH0_DOMAIN: 'dev-37cez0xecdxxjbam.us.auth0.com',    // Auth0 tenant domain
    AUTH0_CLIENT_ID: 'OOedkAnmGYFg798RwszL0dniHEUemBiX', // Client ID of the Auth0 Single Page Application
    AUTH0_AUDIENCE: 'https://flashcards-api',            // Identifier of the Auth0 API (the Worker)
    API_BASE: FLASHCARDS_LOCAL
        ? 'http://localhost:8787'
        : 'https://flashcards-api.jlafshari.workers.dev'
};
