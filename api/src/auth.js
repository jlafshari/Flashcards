// Bearer-token authentication against Auth0. Access tokens are RS256 JWTs signed by the
// tenant; we verify them with the tenant's public JWKS and accept only tokens issued for
// this API's audience. The caller's identity everywhere in the API is the token's `sub`.
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Returns verifyToken(token) -> claims. The JWKS is cached by jose between calls.
export function createTokenVerifier({ domain, audience }) {
    if (!domain || !audience) {
        throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE must both be configured');
    }
    const issuer = `https://${domain}/`;
    const jwks = createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));
    return async function verifyToken(token) {
        const { payload } = await jwtVerify(token, jwks, { issuer, audience, algorithms: ['RS256'] });
        return payload;
    };
}

// Access tokens carry no email or name, so GET /me asks Auth0's userinfo endpoint once per
// new account. Returns {} on any failure; the profile is cosmetic and must never block login.
export function createUserInfoFetcher(domain, fetchImpl = globalThis.fetch) {
    return async function fetchUserInfo(accessToken) {
        try {
            const response = await fetchImpl(`https://${domain}/userinfo`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!response.ok) return {};
            const info = await response.json();
            return {
                email: typeof info.email === 'string' ? info.email : null,
                name: typeof info.name === 'string' ? info.name : null
            };
        } catch (error) {
            console.error('userinfo lookup failed', error);
            return {};
        }
    };
}

// Hono middleware: 401 unless a valid bearer token is present. Sets `userId` and `token`.
export function bearerAuth(verifyToken) {
    return async function auth(c, next) {
        const header = c.req.header('Authorization') || '';
        const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
        if (!match) {
            return c.json({ error: 'Missing bearer token' }, 401);
        }
        let claims;
        try {
            claims = await verifyToken(match[1]);
        } catch (error) {
            return c.json({ error: 'Invalid token' }, 401);
        }
        if (!claims || typeof claims.sub !== 'string' || claims.sub === '') {
            return c.json({ error: 'Invalid token' }, 401);
        }
        c.set('userId', claims.sub);
        c.set('token', match[1]);
        c.set('claims', claims);
        await next();
    };
}
