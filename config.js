// Account backend settings. With these left empty the app runs exactly as before, saving
// cards only in this browser. Fill them in after the one-time setup in api/README.md.
// These are public client-side values; no secrets belong here.
window.FLASHCARDS_CONFIG = {
    AUTH0_DOMAIN: '',                      // Auth0 tenant domain, like dev-abc123.us.auth0.com
    AUTH0_CLIENT_ID: '',                   // Client ID of the Auth0 Single Page Application
    AUTH0_AUDIENCE: 'https://flashcards-api', // Identifier of the Auth0 API (the Worker)
    API_BASE: ''                           // Worker URL, like https://flashcards-api.your-name.workers.dev
};
