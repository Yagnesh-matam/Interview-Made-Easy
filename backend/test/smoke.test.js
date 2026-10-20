/**
 * Backend smoke tests (no external dependencies — uses node:test with an
 * ephemeral HTTP server around the exported Express app).
 *
 * Covered:
 *  - liveness endpoints respond
 *  - every protected endpoint rejects unauthenticated requests with 401
 *  - the /adaptive-quiz route is actually mounted (regression test for the
 *    module.exports-before-definition bug that silently unregistered it)
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

process.env.SUPABASE_URL = process.env.SUPABASE_URL || '';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const app = require('../server');

let server;
let baseUrl;

before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
    if (server) server.close();
});

const request = async (path, options = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch { /* non-JSON body */ }
    return { status: res.status, body: json };
};

test('GET / responds with liveness message', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
});

test('GET /api/health returns ok status', async () => {
    const { status, body } = await request('/api/health');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.status, 'ok');
});

const protectedRoutes = [
    { method: 'POST', path: '/api/dynamic-questions/generate-quiz' },
    { method: 'POST', path: '/api/dynamic-questions/adaptive-quiz' },
    { method: 'POST', path: '/api/dynamic-questions/generate-technical-interview' },
    { method: 'POST', path: '/api/dynamic-questions/generate-behavioral-interview' },
    { method: 'POST', path: '/api/ai/interview-chat' },
    { method: 'POST', path: '/api/ai/tts' },
    { method: 'POST', path: '/api/resume/parse' }
];

for (const route of protectedRoutes) {
    test(`${route.method} ${route.path} rejects unauthenticated requests with 401`, async () => {
        const { status } = await request(route.path, { method: route.method });
        assert.strictEqual(status, 401, `${route.path} must require authentication`);
    });
}

test('/adaptive-quiz is mounted and registered (regression: was defined after module.exports)', async () => {
    // With a bogus token the auth middleware answers 401 — proving the route chain exists.
    // Before the fix this path returned Express's default 404.
    const { status } = await request('/api/dynamic-questions/adaptive-quiz', {
        method: 'POST',
        headers: { Authorization: 'Bearer not-a-real-token' },
        body: { topic: 'Java' }
    });
    // 401 (invalid token) is expected when Supabase is configured;
    // 503 (auth not configured) in bare CI environments. Both prove the route exists —
    // a missing route would be 404.
    assert.ok(status === 401 || status === 503, `expected 401/503, got ${status}`);
});

test('invalid bearer token is rejected with 401 when Supabase is configured', async () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        // Skip when auth service isn't configured in this environment.
        return;
    }
    const { status } = await request('/api/ai/tts', {
        method: 'POST',
        headers: { Authorization: 'Bearer invalid.token.value' },
        body: { text: 'hello' }
    });
    assert.strictEqual(status, 401);
});
