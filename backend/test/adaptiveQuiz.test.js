/**
 * Focused tests for the Adaptive Quiz Groq integration.
 *
 * Covers:
 *  - model resolution (GROQ_MODEL_ID env var, documented default, blank fallback)
 *  - the exact request parameters sent to Groq (regression guard: the retired
 *    'llama-3.3-70b-versatile' ID must never come back)
 *  - error classification + secret redaction
 *  - the real /adaptive-quiz handler end-to-end against a LOCAL mock Groq server
 *    (no external network, no real API key required)
 *
 * Authentication itself is covered in smoke.test.js; here the router is mounted
 * behind a test-only stub that injects req.user so the handler can be exercised.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const express = require('express');

const {
    DEFAULT_GROQ_MODEL,
    InvalidModelResponseError,
    getGroqModelId,
    supportsReasoningEffort,
    buildQuizCompletionParams,
    extractJsonText,
    redactSecrets,
    classifyProviderError
} = require('../lib/groqQuestionModel');

const TEST_API_KEY = 'gsk_test_secret_key_must_never_leak';
const savedEnv = {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL_ID: process.env.GROQ_MODEL_ID,
    GROQ_BASE_URL: process.env.GROQ_BASE_URL
};

// ---------------------------------------------------------------------------
// Unit tests: model configuration
// ---------------------------------------------------------------------------

test('default model is the documented Groq production model, not the retired llama ID', () => {
    assert.strictEqual(DEFAULT_GROQ_MODEL, 'openai/gpt-oss-120b');
    assert.strictEqual(getGroqModelId({}), 'openai/gpt-oss-120b');
    assert.notStrictEqual(getGroqModelId({}), 'llama-3.3-70b-versatile');
});

test('GROQ_MODEL_ID overrides the default and blank values fall back', () => {
    assert.strictEqual(getGroqModelId({ GROQ_MODEL_ID: 'openai/gpt-oss-20b' }), 'openai/gpt-oss-20b');
    assert.strictEqual(getGroqModelId({ GROQ_MODEL_ID: '  ' }), DEFAULT_GROQ_MODEL);
    assert.strictEqual(getGroqModelId({ GROQ_MODEL_ID: 42 }), DEFAULT_GROQ_MODEL);
});

test('completion params use JSON mode, a token budget, and no retired IDs', () => {
    const params = buildQuizCompletionParams({
        modelId: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: 'hi' }]
    });

    assert.strictEqual(params.model, 'openai/gpt-oss-120b');
    assert.deepStrictEqual(params.response_format, { type: 'json_object' });
    // max_completion_tokens (not the deprecated max_tokens) so reasoning tokens fit.
    assert.ok(params.max_completion_tokens >= 1024, 'needs headroom for reasoning + JSON');
    assert.strictEqual(params.max_tokens, undefined);
    assert.ok(!JSON.stringify(params).includes('llama-3.3-70b-versatile'));
});

test('reasoning_effort is only sent to models Groq documents as supporting it', () => {
    assert.strictEqual(supportsReasoningEffort('openai/gpt-oss-120b'), true);
    assert.strictEqual(supportsReasoningEffort('llama-3.1-8b-instant'), false);

    const reasoning = buildQuizCompletionParams({ modelId: 'openai/gpt-oss-120b', messages: [] });
    assert.strictEqual(reasoning.reasoning_effort, 'low');

    // Sending reasoning_effort to a non-reasoning model would be a 400.
    const plain = buildQuizCompletionParams({ modelId: 'llama-3.1-8b-instant', messages: [] });
    assert.strictEqual(plain.reasoning_effort, undefined);
});

test('extractJsonText survives raw reasoning tags, code fences, and prose', () => {
    const expected = '{"q":"x","options":["a","b","c","d"],"correct":0}';
    assert.strictEqual(extractJsonText(expected), expected);
    assert.strictEqual(extractJsonText(`\u003cthink>planning\u003c/think>\n${expected}`), expected);
    assert.strictEqual(extractJsonText('Here you go:\n```json\n' + expected + '\n```'), expected);
    assert.strictEqual(extractJsonText('Sure! ' + expected + ' hope that helps'), expected);
    assert.strictEqual(extractJsonText(''), '');
    assert.strictEqual(extractJsonText(null), '');
});

// ---------------------------------------------------------------------------
// Unit tests: safe error handling
// ---------------------------------------------------------------------------

test('redactSecrets removes keys, bearer tokens and query-string credentials', () => {
    process.env.GROQ_API_KEY = TEST_API_KEY;
    const noisy = `upstream said: key=${TEST_API_KEY} header=Bearer ${TEST_API_KEY} url=https://x/?api_key=abc123 gsk_live_abcdef123456`;
    const clean = redactSecrets(noisy);

    assert.ok(!clean.includes(TEST_API_KEY), 'real key value must be redacted');
    assert.ok(!clean.includes('gsk_live_abcdef123456'), 'raw groq key shape must be redacted');
    assert.ok(!clean.includes('abc123'), 'query credentials must be redacted');
    assert.ok(clean.includes('[redacted]'));
});

test('model_not_found maps to a GROQ_MODEL_ID hint with no secrets', () => {
    process.env.GROQ_API_KEY = TEST_API_KEY;
    const error = Object.assign(
        new Error(`404 The model 'llama-3.3-70b-versatile' does not exist or you do not have access to it.`),
        { name: 'NotFoundError', status: 404 }
    );
    const { httpStatus, publicMessage, logMessage } = classifyProviderError(error);

    assert.strictEqual(httpStatus, 500);
    assert.match(publicMessage, /GROQ_MODEL_ID/);
    assert.ok(!publicMessage.includes(TEST_API_KEY));
    assert.ok(!logMessage.includes(TEST_API_KEY), 'logs must be redacted');
    assert.match(logMessage, /llama-3.3-70b-versatile/); // keeps the diagnostic detail in logs
});

test('each provider failure class maps to a safe, distinct message', () => {
    process.env.GROQ_API_KEY = TEST_API_KEY;
    const cases = [
        { error: Object.assign(new Error('401 Invalid API Key'), { name: 'AuthenticationError', status: 401 }), httpStatus: 500, re: /GROQ_API_KEY/ },
        { error: Object.assign(new Error('429 rate_limit'), { name: 'RateLimitError', status: 429 }), httpStatus: 429, re: /rate limit/i },
        { error: Object.assign(new Error('503 upstream exploded'), { name: 'InternalServerError', status: 503 }), httpStatus: 503, re: /temporarily unavailable/i },
        { error: Object.assign(new Error('400 unsupported parameter'), { name: 'BadRequestError', status: 400 }), httpStatus: 500, re: /GROQ_MODEL_ID/ },
        { error: Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError', status: undefined }), httpStatus: 503, re: /unreachable/i },
        { error: Object.assign(new Error('fetch failed'), { name: 'APIConnectionError', status: undefined }), httpStatus: 503, re: /unreachable/i },
        { error: new InvalidModelResponseError('malformed JSON: bad'), httpStatus: 502, re: /unusable answer/i },
        { error: new Error('something else entirely'), httpStatus: 500, re: /Failed to generate question/i }
    ];

    for (const { error, httpStatus, re } of cases) {
        const result = classifyProviderError(error);
        assert.strictEqual(result.httpStatus, httpStatus, `${error.name} -> status`);
        assert.match(result.publicMessage, re, `${error.name} -> message`);
        assert.ok(!result.publicMessage.includes(TEST_API_KEY), `${error.name} must not leak the key`);
        assert.ok(!result.logMessage.includes(TEST_API_KEY), `${error.name} log must be redacted`);
    }
});

// ---------------------------------------------------------------------------
// Integration tests: the real handler against a local mock Groq server
// ---------------------------------------------------------------------------

let mockServer;
let mockBaseUrl;
let mockPort;
let mockStatus = 200;
let mockBody = {};
let lastProviderRequest = null;
let app;
let server;
let baseUrl;

const resetMock = () => {
    mockStatus = 200;
    mockBody = {};
    lastProviderRequest = null;
};

const validQuestionPayload = () => ({
    q: 'What does the `static` keyword mean in Java?',
    options: ['Belongs to the class', 'Belongs to an instance', 'Both', 'Neither'],
    correct: 0,
    expl: 'It is bound to the class rather than any instance, so it is shared by every object.',
    tip: 'Interviewers often probe static vs instance members through memory-model questions.',
    type: 'Theory',
    difficulty: 'Easy'
});

before(async () => {
    process.env.GROQ_API_KEY = TEST_API_KEY;
    delete process.env.GROQ_MODEL_ID;

    mockServer = http.createServer((req, res) => {
        let raw = '';
        req.on('data', (chunk) => { raw += chunk; });
        req.on('end', () => {
            try { lastProviderRequest = JSON.parse(raw); } catch { lastProviderRequest = raw; }
            res.writeHead(mockStatus, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(mockBody));
        });
    });
    await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    mockPort = mockServer.address().port;
    mockBaseUrl = `http://127.0.0.1:${mockPort}`;
    // The groq-sdk reads GROQ_BASE_URL from the environment — no real Groq calls here.
    process.env.GROQ_BASE_URL = mockBaseUrl;

    const dynamicQuestionRoutes = require('../routes/dynamicQuestionRoutes');
    app = express();
    app.use(express.json());
    // Test-only identity stub: authentication is covered by smoke.test.js.
    app.use('/api/dynamic-questions', (req, _res, next) => {
        req.user = { id: 'test-user', email: 'test@example.com' };
        next();
    }, dynamicQuestionRoutes);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api/dynamic-questions/adaptive-quiz`;
});

after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mockServer) await new Promise((resolve) => mockServer.close(resolve));

    for (const [key, value] of Object.entries(savedEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
});

const post = async (body) => {
    const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    let json = null;
    try { json = await res.json(); } catch { /* non-JSON body */ }
    return { status: res.status, body: json };
};

test('rejects an invalid topic before contacting the provider', async () => {
    resetMock();
    const { status, body } = await post({ topic: 'Astrology', difficulty: 'Easy' });
    assert.strictEqual(status, 400);
    assert.match(body.error, /Invalid topic/);
    assert.strictEqual(lastProviderRequest, null, 'no provider call for invalid input');
});

test('returns 500 server configuration error when GROQ_API_KEY is missing', async () => {
    resetMock();
    const key = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    try {
        const { status, body } = await post({ topic: 'Java', difficulty: 'Easy' });
        assert.strictEqual(status, 500);
        assert.match(body.error, /Server configuration error/);
        assert.strictEqual(lastProviderRequest, null);
    } finally {
        process.env.GROQ_API_KEY = key;
    }
});

test('generates a question and sends the selected quiz settings + supported model', async () => {
    resetMock();
    mockStatus = 200;
    mockBody = {
        choices: [{ message: { role: 'assistant', content: JSON.stringify(validQuestionPayload()) } }]
    };

    const { status, body } = await post({
        topic: 'Java',
        difficulty: 'Easy',
        previousQuestions: [],
        previousTypes: []
    });

    assert.strictEqual(status, 200, JSON.stringify(body));
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.question.options.length, 4);
    assert.strictEqual(body.question.difficulty, 'Easy');

    // The domain + quiz settings actually reach the provider.
    assert.strictEqual(lastProviderRequest.model, 'openai/gpt-oss-120b', 'must be a currently supported Groq model');
    assert.notStrictEqual(lastProviderRequest.model, 'llama-3.3-70b-versatile');
    assert.deepStrictEqual(lastProviderRequest.response_format, { type: 'json_object' });
    const outbound = JSON.stringify(lastProviderRequest.messages);
    assert.match(outbound, /Java/, 'topic must reach the provider');
    assert.match(outbound, /Easy/, 'difficulty must reach the provider');
});

test('falls back to Medium when an unknown difficulty is sent', async () => {
    resetMock();
    mockStatus = 200;
    mockBody = {
        choices: [{ message: { role: 'assistant', content: JSON.stringify(validQuestionPayload()) } }]
    };

    const { status } = await post({ topic: 'Python', difficulty: 'Impossible' });
    assert.strictEqual(status, 200);
    assert.match(lastProviderRequest.messages[0].content, /difficulty level "Medium"/);
    assert.match(lastProviderRequest.messages[0].content, /topic: "Python"/);
});

test('GROQ_MODEL_ID is honored end-to-end', async () => {
    resetMock();
    mockStatus = 200;
    mockBody = {
        choices: [{ message: { role: 'assistant', content: JSON.stringify(validQuestionPayload()) } }]
    };
    process.env.GROQ_MODEL_ID = 'openai/gpt-oss-20b';
    try {
        const { status } = await post({ topic: 'DSA', difficulty: 'Easy' });
        assert.strictEqual(status, 200);
        assert.strictEqual(lastProviderRequest.model, 'openai/gpt-oss-20b');
    } finally {
        delete process.env.GROQ_MODEL_ID;
    }
});

test('provider 404 model_not_found becomes a safe 500 with a GROQ_MODEL_ID hint', async () => {
    resetMock();
    mockStatus = 404;
    mockBody = {
        error: {
            message: "The model 'llama-3.3-70b-versatile' does not exist or you do not have access to it.",
            type: 'model_not_found',
            code: 'model_not_found'
        }
    };

    const { status, body } = await post({ topic: 'Java', difficulty: 'Easy' });

    assert.strictEqual(status, 500);
    assert.match(body.error, /GROQ_MODEL_ID/);
    assert.match(body.error, /console\.groq\.com\/docs\/models/);
    assert.strictEqual(body.details, undefined, 'raw provider errors must not be echoed');
    assert.ok(!JSON.stringify(body).includes(TEST_API_KEY), 'API key must never appear in the response');
});

test('provider rate limit surfaces as 429 with a retry hint and no secrets', async () => {
    resetMock();
    mockStatus = 429;
    mockBody = { error: { message: 'rate limit reached', type: 'rate_limit_exceeded' } };

    const { status, body } = await post({ topic: 'Java', difficulty: 'Easy' });

    assert.strictEqual(status, 429);
    assert.match(body.error, /rate limit/i);
    assert.ok(!JSON.stringify(body).includes(TEST_API_KEY));
});

test('provider outage surfaces as 503 with a retry hint', async () => {
    resetMock();
    mockStatus = 503;
    mockBody = { error: { message: 'internal server error', type: 'server_error' } };

    const { status, body } = await post({ topic: 'Java', difficulty: 'Easy' });

    assert.strictEqual(status, 503);
    assert.match(body.error, /temporarily unavailable/i);
    assert.ok(!JSON.stringify(body).includes(TEST_API_KEY));
});

test('unreachable provider (connection refused) surfaces as 503', async () => {
    resetMock();
    // A port that is closed: fast ECONNREFUSED instead of a network hang.
    const probe = http.createServer();
    await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const closedPort = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));

    process.env.GROQ_BASE_URL = `http://127.0.0.1:${closedPort}`;
    try {
        const { status, body } = await post({ topic: 'Java', difficulty: 'Easy' });
        assert.strictEqual(status, 503);
        assert.match(body.error, /unreachable/i);
        assert.ok(!JSON.stringify(body).includes(TEST_API_KEY));
    } finally {
        process.env.GROQ_BASE_URL = mockBaseUrl;
    }
});

test('unusable model output (malformed JSON) surfaces as 502, not a crash', async () => {
    resetMock();
    mockStatus = 200;
    mockBody = { choices: [{ message: { role: 'assistant', content: 'I am not JSON.' } }] };

    const { status, body } = await post({ topic: 'Java', difficulty: 'Easy' });
    assert.strictEqual(status, 502);
    assert.match(body.error, /unusable answer/i);
});
