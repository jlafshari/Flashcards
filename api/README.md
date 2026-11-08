# Flashcards API

A Cloudflare Worker that stores each signed-in user's cards, study sessions and preferences
in MongoDB Atlas. Identity comes from Auth0; the Worker only verifies Auth0's access tokens.
Everything runs on free tiers: Atlas M0 (512 MB), Workers Free (100k requests/day), Auth0 Free
(25k monthly active users). The frontend stays on GitHub Pages.

```
Browser (GitHub Pages)  --Auth0 login-->  Auth0 tenant
        |                                   | RS256 access token (aud = this API)
        v                                   v
  fetch(API_BASE/..., Authorization: Bearer <token>)  -->  Worker (Hono)  -->  Atlas
```

## Layout

| Path | Purpose |
|---|---|
| `src/index.js` | Worker entry: builds the app from env vars once per isolate |
| `src/app.js` | Hono router, CORS, body limit, error mapping, all routes |
| `src/auth.js` | Bearer-token middleware (jose + Auth0 JWKS), userinfo lookup |
| `src/db.js` | `MongoRepo`: all MongoDB queries, one connection per request |
| `src/validate.js` | Request validation; mirrors the browser app's rules |
| `test/` | Plain Node tests run by `npm test`; `helpers.js` has an in-memory repo |
| `test/smoke/` | Local-only Worker that exercises `MongoRepo` inside workerd |
| `wrangler.toml` | Worker name, `nodejs_compat`, public vars |

## Endpoints

All routes except `/health` require `Authorization: Bearer <Auth0 access token>` and return
JSON. The caller is identified by the token's `sub`; every query is scoped to it.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/health` | | `{ok: true}` (no auth) |
| GET | `/me` | | `{sub, email, name, createdAt, migratedFromLocalAt}`; creates the user on first call |
| GET | `/bootstrap` | | `{cards, studySessions, preferences}` for app start-up |
| POST | `/cards` | `{clientId, bulgarian, english, category?, createdAt?, buried?}` | 201 card; 409 if `clientId` exists |
| PATCH | `/cards/:clientId` | any of `bulgarian, english, category, buried` | card; 404 if not the caller's |
| DELETE | `/cards/:clientId` | | 204; 404 if not the caller's |
| POST | `/cards/bulk` | `{cards: [...], replace?: boolean}` | `{added, cards}`; merge skips existing ids, replace swaps the deck |
| POST | `/sessions` | `{clientId, date: "YYYY-MM-DD", startedAt?, seconds, cards?}` | 201 session; same `clientId` is stored once |
| PUT | `/preferences` | `{studyDirection?, activeCategories?, shuffleEnabled?, cardLimit?, statsRangeDays?}` | the stored preferences, defaults filled in |
| POST | `/migrate` | `{cards?, studySessions?, preferences?}` from localStorage | `{cards, studySessions, preferences, imported}`; idempotent |

Shapes match the browser app: a card's `clientId` is the app's numeric `id`, a session's
`clientId` is its string `id`. `id` is accepted as an alias on input. Bodies over 1 MB are
refused (413); bulk lists are capped at 10,000 entries; text fields at 500 characters.
Validation failures are `400 {error}`.

Sessions older than 365 days are pruned on `/bootstrap`, matching the app's retention.

## One-time setup

### 1. MongoDB Atlas (free M0)

1. Create an account at mongodb.com/atlas and a project.
2. Create a cluster: **M0 Free**, a US region near you (Workers run everywhere, so pick the
   region close to where you study).
3. Database Access: add a database user with a long random password (Read and write to any database).
4. Network Access: add `0.0.0.0/0`. Workers have no fixed egress IP, so Atlas cannot allow-list
   them; the strong password and TLS are the protection.
5. Connect → Drivers → copy the `mongodb+srv://...` URI and put the password in it.

   The Workers runtime has no `dns.resolveSrv`, which the driver needs for `mongodb+srv://`
   strings, so `src/db.js` expands the SRV and TXT records itself over DNS-over-HTTPS
   (`cloudflare-dns.com`) and caches the result for the record's TTL. If that ever fails,
   the plain seed-list form works without any DNS lookups: in the Connect dialog pick the
   Node.js driver version "2.2.12 or later" to get a `mongodb://host1,host2,host3/...` string.

The database is named by `DB_NAME` (default `flashcards`). Collections and indexes are created
on first use.

### 2. Auth0 (free)

1. Create a tenant at auth0.com.
2. **Applications → Create Application → Single Page Web Applications**. In its settings:
   - If the quickstart asks for an "Application Origin", enter only `https://jlafshari.github.io`
     (one origin: scheme, host and port, no path), then set these in the application's Settings:
     - Allowed Callback URLs: `https://jlafshari.github.io/Flashcards/, http://localhost:8080/`
     - Allowed Logout URLs: `https://jlafshari.github.io/Flashcards/, http://localhost:8080/`
     - Allowed Web Origins: `https://jlafshari.github.io, http://localhost:8080`
     The app redirects to its own origin plus path with a trailing slash, and Auth0 matches
     callback URLs exactly, so the slashes matter.
   - Refresh Token Rotation: on (the default). The browser app uses refresh tokens because
     silent iframe renewal is blocked by third-party-cookie rules on github.io.
3. **Applications → APIs → Create API**: name `Flashcards API`, identifier `https://flashcards-api`
   (any URI; it does not have to resolve), signing algorithm RS256. Under its settings enable
   **Allow Offline Access** so refresh tokens are issued for it.
4. **Authentication → Database**: keep the default Username-Password-Authentication connection.
   **Authentication → Social**: enable Google (Auth0 dev keys are fine for a hobby app).
5. Note the tenant **Domain** (like `dev-abc123.us.auth0.com`), the SPA **Client ID**, and the
   API **Identifier** (the audience).

### 3. Cloudflare Workers (free)

```bash
cd api
npm install
npx wrangler login
```

Edit `wrangler.toml` `[vars]`: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `ALLOWED_ORIGINS` (comma-separated
browser origins, no paths). Then:

```bash
npx wrangler secret put MONGODB_URI     # paste the Atlas URI
npx wrangler deploy
```

The Worker URL is printed, like `https://flashcards-api.<your-subdomain>.workers.dev`. Check it:

```bash
curl https://flashcards-api.<your-subdomain>.workers.dev/health
```

### 4. GitHub Actions deploys

`.github/workflows/api-deploy.yml` runs the tests on every pull request touching `api/` and
deploys from `main`. It needs two repository secrets:

- `CLOUDFLARE_API_TOKEN`: Cloudflare dashboard → My Profile → API Tokens → Create Token →
  "Edit Cloudflare Workers" template.
- `CLOUDFLARE_ACCOUNT_ID`: shown on the Workers & Pages overview page.

### 5. Frontend

Fill in the root `config.js` with `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE` and
`API_BASE` (the Worker URL). These are public values and are committed.

## Local development

```bash
npm run dev            # wrangler dev on http://localhost:8787
```

`wrangler dev` reads `api/.dev.vars` (gitignored; copy `.dev.vars.example` to start). Values
there override the same-named `[vars]` in `wrangler.toml`, so local development uses its own
database: set `DB_NAME=flashcards_dev` and point `MONGODB_URI` at either the Docker MongoDB
from `npm run mongo:start` or a separate Atlas cluster/user. Production keeps `DB_NAME`
from `wrangler.toml` and the `MONGODB_URI` secret set with `wrangler secret put`; nothing in
`.dev.vars` is ever deployed.

Point the frontend's `API_BASE` at `http://localhost:8787` and serve it with
`python3 -m http.server 8080` from the repository root. Calls need a real Auth0 token; the
Auth0 dashboard's API "Test" tab issues one for curl:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/bootstrap
```

## Tests

```bash
npm test               # in-memory repository, no services needed
```

To run the same suite against a real MongoDB (Docker, single-node replica set so the
transactional deck replace is exercised):

```bash
npm run mongo:start
npm run test:mongo
npm run smoke          # then: curl http://localhost:8788/smoke  (driver inside workerd)
npm run mongo:stop
```

## Notes and limits

- Each request opens a new TLS connection to Atlas (about 100–300 ms). Workers cannot share
  a socket across requests, so a module-level client would fail. If latency matters later,
  move the `MongoClient` into a Durable Object.
- Atlas M0: 512 MB, about 100 operations/second, no backups. Export cards from the app's
  Manage tab if you want a copy.
- Workers Free: 100,000 requests/day, 10 ms CPU per request (waiting on the database does not count).
- CORS allows only the origins in `ALLOWED_ORIGINS`.
