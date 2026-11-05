// Request validation. Every function returns a cleaned copy of the input (trimmed strings,
// coerced numbers, unknown fields dropped) or throws a ValidationError that the app turns
// into a 400 response. The rules mirror what the browser app enforces in validateCardData().

export const MAX_TEXT_LENGTH = 500;
export const MAX_CATEGORY_LENGTH = 100;
export const MAX_BULK_CARDS = 10000;
export const MAX_BODY_BYTES = 1_000_000;
export const STUDY_DIRECTIONS = ['bg-en', 'en-bg'];
export const STATS_RANGES = [7, 30];
export const MAX_CARD_LIMIT = 10000;

export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

function textField(value, field, { required = true, max = MAX_TEXT_LENGTH } = {}) {
    if (value === undefined || value === null) {
        if (required) throw new ValidationError(`${field} is required`);
        return '';
    }
    if (typeof value !== 'string') throw new ValidationError(`${field} must be a string`);
    const trimmed = value.trim();
    if (required && trimmed === '') throw new ValidationError(`${field} must not be empty`);
    if (trimmed.length > max) throw new ValidationError(`${field} is longer than ${max} characters`);
    return trimmed;
}

// ISO timestamp, or `fallback` when the value is missing
function isoTimestamp(value, field, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    const date = new Date(value);
    if (typeof value !== 'string' || Number.isNaN(date.getTime())) {
        throw new ValidationError(`${field} must be an ISO date string`);
    }
    return date.toISOString();
}

// The browser app uses a millisecond timestamp as the card id; URL params arrive as strings
export function cardClientId(value) {
    const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    if (!Number.isSafeInteger(number) || number <= 0) {
        throw new ValidationError('clientId must be a positive integer');
    }
    return number;
}

export function validateCard(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new ValidationError('card must be an object');
    }
    return {
        clientId: cardClientId(body.clientId ?? body.id),
        bulgarian: textField(body.bulgarian, 'bulgarian'),
        english: textField(body.english, 'english'),
        category: textField(body.category, 'category', { required: false, max: MAX_CATEGORY_LENGTH }),
        createdAt: isoTimestamp(body.createdAt, 'createdAt', new Date().toISOString()),
        buried: body.buried === true
    };
}

export function validateCardPatch(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new ValidationError('patch must be an object');
    }
    const fields = {};
    if ('bulgarian' in body) fields.bulgarian = textField(body.bulgarian, 'bulgarian');
    if ('english' in body) fields.english = textField(body.english, 'english');
    if ('category' in body) {
        fields.category = textField(body.category, 'category', { required: false, max: MAX_CATEGORY_LENGTH });
    }
    if ('buried' in body) {
        if (typeof body.buried !== 'boolean') throw new ValidationError('buried must be a boolean');
        fields.buried = body.buried;
    }
    if (Object.keys(fields).length === 0) {
        throw new ValidationError('patch must include at least one of bulgarian, english, category, buried');
    }
    return fields;
}

// Validates a list of cards. In strict mode any bad card fails the whole list; otherwise bad
// cards are skipped and counted, which is what a best-effort migration wants.
export function validateCards(list, { strict = true, max = MAX_BULK_CARDS } = {}) {
    if (!Array.isArray(list)) throw new ValidationError('cards must be an array');
    if (list.length > max) throw new ValidationError(`cards must have at most ${max} entries`);
    const seen = new Set();
    const cards = [];
    let skipped = 0;
    for (const raw of list) {
        let card;
        try {
            card = validateCard(raw);
        } catch (error) {
            if (strict || !(error instanceof ValidationError)) throw error;
            skipped++;
            continue;
        }
        if (seen.has(card.clientId)) {
            skipped++;
            continue;
        }
        seen.add(card.clientId);
        cards.push(card);
    }
    return { cards, skipped };
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function validateSession(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new ValidationError('session must be an object');
    }
    const clientId = body.clientId ?? body.id;
    if (typeof clientId !== 'string' || clientId.trim() === '' || clientId.length > 100) {
        throw new ValidationError('clientId must be a non-empty string');
    }
    if (typeof body.date !== 'string' || !DATE_KEY.test(body.date)) {
        throw new ValidationError('date must be a YYYY-MM-DD string');
    }
    const seconds = Number(body.seconds);
    if (!Number.isFinite(seconds) || seconds <= 0) {
        throw new ValidationError('seconds must be a positive number');
    }
    const cards = body.cards === undefined || body.cards === null ? 0 : Number(body.cards);
    if (!Number.isFinite(cards) || cards < 0) {
        throw new ValidationError('cards must be a non-negative number');
    }
    return {
        clientId: clientId.trim(),
        date: body.date,
        startedAt: isoTimestamp(body.startedAt, 'startedAt', null),
        seconds: Math.round(seconds),
        cards: Math.round(cards)
    };
}

export function validateSessions(list, { strict = true, max = MAX_BULK_CARDS } = {}) {
    if (!Array.isArray(list)) throw new ValidationError('studySessions must be an array');
    if (list.length > max) throw new ValidationError(`studySessions must have at most ${max} entries`);
    const seen = new Set();
    const sessions = [];
    let skipped = 0;
    for (const raw of list) {
        let session;
        try {
            session = validateSession(raw);
        } catch (error) {
            if (strict || !(error instanceof ValidationError)) throw error;
            skipped++;
            continue;
        }
        if (seen.has(session.clientId)) {
            skipped++;
            continue;
        }
        seen.add(session.clientId);
        sessions.push(session);
    }
    return { sessions, skipped };
}

export function defaultPreferences() {
    return {
        studyDirection: 'bg-en',
        activeCategories: null,
        shuffleEnabled: false,
        cardLimit: null,
        statsRangeDays: 7
    };
}

// Missing fields fall back to the defaults, so a PUT always stores a complete document
export function validatePreferences(body) {
    if (body === undefined || body === null) return defaultPreferences();
    if (typeof body !== 'object' || Array.isArray(body)) {
        throw new ValidationError('preferences must be an object');
    }
    const prefs = defaultPreferences();

    if (body.studyDirection !== undefined && body.studyDirection !== null) {
        if (!STUDY_DIRECTIONS.includes(body.studyDirection)) {
            throw new ValidationError(`studyDirection must be one of ${STUDY_DIRECTIONS.join(', ')}`);
        }
        prefs.studyDirection = body.studyDirection;
    }

    if (body.activeCategories !== undefined && body.activeCategories !== null) {
        if (!Array.isArray(body.activeCategories) || body.activeCategories.length > 500) {
            throw new ValidationError('activeCategories must be an array of at most 500 strings or null');
        }
        prefs.activeCategories = body.activeCategories.map((category, index) =>
            textField(category, `activeCategories[${index}]`, { required: false, max: MAX_CATEGORY_LENGTH }));
    }

    if (body.shuffleEnabled !== undefined && body.shuffleEnabled !== null) {
        if (typeof body.shuffleEnabled !== 'boolean') throw new ValidationError('shuffleEnabled must be a boolean');
        prefs.shuffleEnabled = body.shuffleEnabled;
    }

    if (body.cardLimit !== undefined && body.cardLimit !== null) {
        const limit = Number(body.cardLimit);
        if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CARD_LIMIT) {
            throw new ValidationError(`cardLimit must be an integer between 1 and ${MAX_CARD_LIMIT} or null`);
        }
        prefs.cardLimit = limit;
    }

    if (body.statsRangeDays !== undefined && body.statsRangeDays !== null) {
        const days = Number(body.statsRangeDays);
        if (!STATS_RANGES.includes(days)) {
            throw new ValidationError(`statsRangeDays must be one of ${STATS_RANGES.join(', ')}`);
        }
        prefs.statsRangeDays = days;
    }

    return prefs;
}

// YYYY-MM-DD in UTC, matching the string-comparable keys the app uses for session dates
export function dateKey(date) {
    return date.toISOString().slice(0, 10);
}

export function shiftDateKey(date, dayOffset) {
    const shifted = new Date(date.getTime() + dayOffset * 86400000);
    return dateKey(shifted);
}
