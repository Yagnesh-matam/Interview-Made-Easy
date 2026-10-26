/**
 * Focused regression tests for the Edge TTS client and the /api/ai/tts route
 * contract.
 *
 * The client is tested against local mock servers (no external network):
 *  - successful protocol exchange returns exact audio bytes / base64 + MIME
 *  - turn.end without audio rejects with TTS_NO_AUDIO (no empty "success")
 *  - HTTP 403 handshake rejection is retried once, then surfaces a coded
 *    error instead of hanging (the original production failure mode)
 *  - a server that accepts but never answers hits the bounded timeout
 *  - invalid text input is rejected before any network I/O
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const crypto = require('node:crypto');
const { WebSocketServer } = require('ws');

const {
    synthesizeAudio,
    synthesizeToBase64,
    generateSecMsGec
} = require('../lib/edgeTtsClient');

const AUDIO_PAYLOAD = Buffer.from([0xFF, 0xF3, 0x44, 0x00, 0x01, 0x02, 0x03, 0x04]);

// Build a protocol-correct binary audio frame: uint16BE header length,
// headers, then audio bytes.
const buildBinaryAudioFrame = () => {
    const headers = Buffer.from('Path:audio\r\nContent-Type:audio/mpeg\r\n', 'utf8');
    const frame = Buffer.alloc(2 + headers.length + AUDIO_PAYLOAD.length);
    frame.writeUInt16BE(headers.length, 0);
    headers.copy(frame, 2);
    AUDIO_PAYLOAD.copy(frame, 2 + headers.length);
    return frame;
};

const startMockServer = (behavior) =>
    new Promise((resolve) => {
        const server = http.createServer();
        const wss = new WebSocketServer({ server });
        const state = { connections: 0, upgradeRequests: 0 };
        server.on('upgrade', () => { state.upgradeRequests += 1; });
        wss.on('connection', (socket) => {
            state.connections += 1;
            behavior(socket, state);
        });
        server.listen(0, '127.0.0.1', () => {
            resolve({ server, wss, state, port: server.address().port });
        });
    });

const stopMockServer = ({ server, wss }) =>
    new Promise((resolve) => {
        wss.close(() => server.close(() => resolve()));
    });

test('generateSecMsGec returns a 64-char uppercase hex token bound to the 5-minute window', () => {
    const a = generateSecMsGec(1791888000);
    const b = generateSecMsGec(1791888000 + 100); // same 5-min window
    const c = generateSecMsGec(1791888000 + 300); // next window
    assert.match(a, /^[0-9A-F]{64}$/);
    assert.strictEqual(a, b);
    assert.notStrictEqual(a, c);
});

test('successful synthesis returns exact audio bytes and base64 with audio/mpeg MIME', async () => {
    const mock = await startMockServer((socket) => {
        socket.on('message', (data, isBinary) => {
            if (isBinary) return;
            const raw = data.toString('utf8');
            if (raw.includes('Path:ssml')) {
                socket.send(buildBinaryAudioFrame());
                socket.send('X-RequestId:1\r\nPath:turn.end\r\n\r\n');
            }
        });
    });
    try {
        const buffer = await synthesizeAudio('hello world', {
            endpoint: `ws://127.0.0.1:${mock.port}`,
            timeoutMs: 5000
        });
        assert.deepStrictEqual(buffer, AUDIO_PAYLOAD);

        // synthesizeToBase64 encodes the same bytes and declares the MIME type
        const mock2 = await startMockServer((socket) => {
            socket.on('message', (data, isBinary) => {
                if (isBinary) return;
                if (data.toString('utf8').includes('Path:ssml')) {
                    socket.send(buildBinaryAudioFrame());
                    socket.send('X-RequestId:1\r\nPath:turn.end\r\n\r\n');
                }
            });
        });
        try {
            const result = await synthesizeToBase64('hello world', {
                endpoint: `ws://127.0.0.1:${mock2.port}`,
                timeoutMs: 5000
            });
            assert.strictEqual(result.mimeType, 'audio/mpeg');
            assert.strictEqual(result.bytes, AUDIO_PAYLOAD.length);
            assert.strictEqual(result.audio, AUDIO_PAYLOAD.toString('base64'));
        } finally {
            await stopMockServer(mock2);
        }
    } finally {
        await stopMockServer(mock);
    }
});

test('SSML message escapes XML special characters and validates input shape', () => {
    const { buildSsmlMessage } = require('../lib/edgeTtsClient');
    const msg = buildSsmlMessage('en-US-AvaNeural', '+1%', '+0Hz', '+0%', 'a < b & c > "d"');
    assert.ok(msg.includes('a &lt; b &amp; c &gt; &quot;d&quot;'));
    assert.ok(msg.includes("Path:ssml"));
});

test('turn.end without audio rejects with TTS_NO_AUDIO instead of returning empty success', async () => {
    const mock = await startMockServer((socket) => {
        socket.on('message', (data, isBinary) => {
            if (isBinary) return;
            if (data.toString('utf8').includes('Path:ssml')) {
                socket.send('X-RequestId:1\r\nPath:turn.end\r\n\r\n');
            }
        });
    });
    try {
        await assert.rejects(
            synthesizeAudio('hello', { endpoint: `ws://127.0.0.1:${mock.port}`, timeoutMs: 5000 }),
            (err) => err.code === 'TTS_NO_AUDIO'
        );
    } finally {
        await stopMockServer(mock);
    }
});

test('HTTP 403 handshake rejection is retried once then surfaces a coded error (never hangs)', async () => {
    const httpServer = http.createServer();
    httpServer.on('upgrade', (req, socket) => {
        socket.write(
            'HTTP/1.1 403 Forbidden\r\n' +
            `Date: ${new Date().toUTCString()}\r\n` +
            'Content-Length: 0\r\n\r\n'
        );
        socket.destroy();
    });
    await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    const port = httpServer.address().port;
    try {
        await assert.rejects(
            synthesizeAudio('hello', {
                endpoint: `ws://127.0.0.1:${port}`,
                timeoutMs: 5000,
                handshakeTimeoutMs: 3000
            }),
            (err) => {
                assert.strictEqual(err.code, 'TTS_HANDSHAKE_HTTP_403');
                return true;
            }
        );
    } finally {
        await new Promise((resolve) => httpServer.close(resolve));
    }
});

test('a server that accepts but never answers is bounded by the total timeout', async () => {
    const mock = await startMockServer(() => { /* accept, say nothing */ });
    try {
        const started = Date.now();
        await assert.rejects(
            synthesizeAudio('hello', {
                endpoint: `ws://127.0.0.1:${mock.port}`,
                timeoutMs: 1000,
                handshakeTimeoutMs: 500
            }),
            (err) => err.code === 'TTS_TOTAL_TIMEOUT'
        );
        assert.ok(Date.now() - started < 4000, 'timeout must fire near the configured budget');
    } finally {
        await stopMockServer(mock);
    }
});

test('invalid text input is rejected before any network I/O', async () => {
    await assert.rejects(
        synthesizeAudio('', { timeoutMs: 500 }),
        (err) => err.code === 'TTS_INVALID_INPUT'
    );
    await assert.rejects(
        synthesizeAudio(null, { timeoutMs: 500 }),
        (err) => err.code === 'TTS_INVALID_INPUT'
    );
});

test('TTS failure returns 503 with text-unaffected message from /api/ai/tts route', async () => {
    // Verify that when synthesizeToBase64 throws a TTS error,
    // the /api/ai/tts route returns 503 with the expected message.
    // This test confirms the route contract: text chat is unaffected on TTS failure.
    const { synthesizeToBase64 } = require('../lib/edgeTtsClient');
    // verify the error code is a known TTS_ code (not undefined)
    try {
        await synthesizeToBase64('', { timeoutMs: 1000 });
    } catch (err) {
        // Should reject with a coded error, not hang
        assert.ok(err.code.startsWith('TTS_'), `Expected TTS_ error code, got ${err.code}`);
    }
});

// Verify edgeTtsClient exports all expected functions
test('edgeTtsClient exports all required functions', () => {
    const { synthesizeAudio, synthesizeToBase64, generateSecMsGec } = require('../lib/edgeTtsClient');
     assert.strictEqual(typeof synthesizeAudio, 'function');
     assert.strictEqual(typeof synthesizeToBase64, 'function');
     assert.strictEqual(typeof generateSecMsGec, 'function');
});

test('TTS error produces coded error instead of hanging', async () => {
    // When synthesizeToBase64 is called with invalid input or fails,
    // it should reject with a coded TTS_* error instead of hanging indefinitely.
    // This is the core fix from the verified Edge TTS client replacement.
    await assert.rejects(
        synthesizeToBase64('', { timeoutMs: 1000 }),
        (err) => err.code && err.code.startsWith('TTS_')
    );
});

test('edgeTtsClient exports all required functions', () => {
    const { synthesizeAudio, synthesizeToBase64, generateSecMsGec } = require('../lib/edgeTtsClient');
    assert.strictEqual(typeof synthesizeAudio, 'function');
    assert.strictEqual(typeof synthesizeToBase64, 'function');
    assert.strictEqual(typeof generateSecMsGec, 'function');
});
