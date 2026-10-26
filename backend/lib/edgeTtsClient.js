'use strict';

/**
 * Minimal Microsoft Edge online TTS (neural) WebSocket client.
 *
 * Why this exists: edge-tts-universal@1.4.0 sends the legacy Sec-MS-GEC v1
 * token to speech.platform.bing.com, which Microsoft now rejects with HTTP
 * 403 on the WebSocket handshake (Oct 2026 protocol change, see
 * rany2/edge-tts#490/#491/#492). The package also never rejects when the
 * handshake fails, so synthesis hung forever until a route-level timeout.
 *
 * This client speaks the same wire protocol but targets the endpoint Microsoft
 * Edge itself uses now (api.msedgeservices.com), which still accepts the
 * legacy token — verified live. It always bounds every stage with timeouts
 * and rejects with coded errors instead of hanging.
 */

const crypto = require('crypto');
const WebSocket = require('ws');

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROMIUM_MAJOR_VERSION = '143';
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const SEC_MS_GEC_VERSION = `2-${CHROMIUM_FULL_VERSION}`;
const WIN_EPOCH = 11644473600;
const S_TO_NS = 1e9;

// Synthesis WebSocket (verified working with the legacy token as of Oct 2026).
// The voice list is still served by the legacy host.
const WSS_URL =
    'wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1';

const DEFAULT_HANDSHAKE_TIMEOUT_MS = 8000;
const DEFAULT_TOTAL_TIMEOUT_MS = 12000;

// Clock skew between local time and the service time (seconds). Adjusted from
// the server's Date header when a 403 is observed, mirroring upstream edge-tts.
let clockSkewSeconds = 0;

const generateSecMsGec = (unixSeconds = Date.now() / 1000 + clockSkewSeconds) => {
    let ticks = unixSeconds;
    ticks += WIN_EPOCH;
    ticks -= ticks % 300;
    ticks *= S_TO_NS / 100;
    const strToHash = `${ticks.toFixed(0)}${CHROMIUM_MAJOR_VERSION}${TRUSTED_CLIENT_TOKEN}`;
    return crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
};

const generateMuid = () => crypto.randomBytes(16).toString('hex').toUpperCase();

const escapeXml = (text) =>
    String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const dateToString = () =>
    new Date().toUTCString().replace('GMT', 'GMT+0000 (Coordinated Universal Time)');

const buildConnectId = () => crypto.randomUUID().replace(/-/g, '');

const buildWssUrl = () =>
    `${WSS_URL}?Ocp-Apim-Subscription-Key=${TRUSTED_CLIENT_TOKEN}` +
    `&Sec-MS-GEC=${generateSecMsGec()}` +
    `&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

const buildSpeechConfigMessage = () =>
    `X-Timestamp:${dateToString()}\r\n` +
    'Content-Type:application/json; charset=utf-8\r\n' +
    'Path:speech.config\r\n\r\n' +
    '{"context":{"synthesis":{"audio":{"metadataoptions":{' +
    '"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},' +
    '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}';

const buildSsmlMessage = (voice, rate, pitch, volume, text) => {
    const ssml =
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
        `<voice name='${escapeXml(voice)}'>` +
        `<prosody pitch='${escapeXml(pitch)}' rate='${escapeXml(rate)}' volume='${escapeXml(volume)}'>` +
        `${escapeXml(text)}</prosody></voice></speak>`;
    return (
        `X-RequestId:${buildConnectId()}\r\n` +
        'Content-Type:application/ssml+xml\r\n' +
        `X-Timestamp:${dateToString()}Z\r\n` +
        'Path:ssml\r\n\r\n' +
        ssml
    );
};

const parseTextHeaders = (raw) => {
    const headers = {};
    const headerEnd = raw.indexOf('\r\n\r\n');
    const headerString = headerEnd === -1 ? raw : raw.slice(0, headerEnd);
    for (const line of headerString.split('\r\n')) {
        const idx = line.indexOf(':');
        if (idx > 0) headers[line.slice(0, idx)] = line.slice(idx + 1).trim();
    }
    return headers;
};

const adjustClockSkewFromHeaders = (headers) => {
    const serverDate = headers && headers.date;
    if (!serverDate) return false;
    const serverMs = Date.parse(serverDate);
    if (Number.isNaN(serverMs)) return false;
    clockSkewSeconds += serverMs / 1000 - Date.now() / 1000;
    return true;
};

const makeError = (message, code) => {
    const err = new Error(message);
    err.code = code;
    return err;
};

/**
 * Synthesize speech over the Edge neural TTS WebSocket.
 *
 * @param {string} text Plain text to speak (already sanitized by the caller).
 * @param {object} [options]
 * @param {string} [options.voice] Voice name, e.g. 'en-US-AvaNeural'.
 * @param {string} [options.rate] Prosody rate, e.g. '+1%'.
 * @param {string} [options.pitch] Prosody pitch, e.g. '+0Hz'.
 * @param {string} [options.volume] Prosody volume, e.g. '+0%'.
 * @param {number} [options.timeoutMs] Total synthesis budget (default 12000).
 * @param {number} [options.handshakeTimeoutMs] WS handshake budget (default 8000).
 * @param {string} [options.endpoint] Override WSS URL (tests only).
 * @returns {Promise<Buffer>} Raw MP3 audio bytes.
 */
const synthesizeAudio = (text, options = {}) => new Promise((resolve, reject) => {
    const {
        voice = 'en-US-AvaNeural',
        rate = '+0%',
        pitch = '+0Hz',
        volume = '+0%',
        timeoutMs = DEFAULT_TOTAL_TIMEOUT_MS,
        handshakeTimeoutMs = DEFAULT_HANDSHAKE_TIMEOUT_MS,
        endpoint
    } = options;

    if (typeof text !== 'string' || text.trim().length === 0) {
        return reject(makeError('Text input for TTS must be a non-empty string.', 'TTS_INVALID_INPUT'));
    }

    const url = endpoint
        ? `${endpoint}?Sec-MS-GEC=${generateSecMsGec()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`
        : buildWssUrl();

    let settled = false;
    let audioReceived = false;
    const audioChunks = [];
    let socket = null;
    let handshakeTimer = null;
    let totalTimer = null;

    const cleanup = () => {
        if (handshakeTimer) clearTimeout(handshakeTimer);
        if (totalTimer) clearTimeout(totalTimer);
        if (socket) {
            socket.removeAllListeners();
            // Post-cleanup socket errors (e.g. "closed before established") are
            // irrelevant — the result has already been settled.
            socket.on('error', () => {});
            try { socket.terminate(); } catch { /* already closed */ }
        }
    };

    const finish = (err, buffer) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (err) reject(err);
        else resolve(buffer);
    };

    const connect = (allowRetryOn403) => {
        socket = new WebSocket(url, {
            headers: {
                'User-Agent':
                    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ` +
                    `(KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 ` +
                    `Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
                'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
                'Cookie': `muid=${generateMuid()};`
            }
        });

        handshakeTimer = setTimeout(() => {
            finish(makeError('TTS WebSocket handshake timed out.', 'TTS_HANDSHAKE_TIMEOUT'));
        }, handshakeTimeoutMs);

        totalTimer = setTimeout(() => {
            finish(makeError('TTS synthesis exceeded its time budget.', 'TTS_TOTAL_TIMEOUT'));
        }, timeoutMs);

        socket.on('open', () => {
            if (handshakeTimer) { clearTimeout(handshakeTimer); handshakeTimer = null; }
            socket.send(buildSpeechConfigMessage());
            socket.send(buildSsmlMessage(voice, rate, pitch, volume, text));
        });

        socket.on('message', (data, isBinary) => {
            if (isBinary) {
                const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
                if (buf.length < 2) {
                    return finish(makeError('Malformed TTS binary frame.', 'TTS_PROTOCOL_ERROR'));
                }
                const headerLength = buf.readUInt16BE(0);
                if (headerLength + 2 > buf.length) {
                    return finish(makeError('TTS binary frame header overrun.', 'TTS_PROTOCOL_ERROR'));
                }
                const headers = parseTextHeaders(buf.slice(2, 2 + headerLength).toString('utf8'));
                const audio = buf.slice(2 + headerLength);
                if (headers['Content-Type'] === 'audio/mpeg' && audio.length > 0) {
                    audioReceived = true;
                    audioChunks.push(audio);
                }
                return;
            }

            const raw = data.toString('utf8');
            const headers = parseTextHeaders(raw);
            const path = headers['Path'] || '';
            if (path === 'turn.end') {
                if (!audioReceived || audioChunks.length === 0) {
                    return finish(makeError('TTS completed without returning audio.', 'TTS_NO_AUDIO'));
                }
                return finish(null, Buffer.concat(audioChunks));
            }
            // 'response', 'turn.start', 'audio.metadata' are informational — ignore.
        });

        socket.on('unexpected-response', (_req, res) => {
            const status = res.statusCode;
            const dateHeader = res.headers && res.headers.date;
            res.resume();
            if (status === 403 && allowRetryOn403) {
                adjustClockSkewFromHeaders({ date: dateHeader });
                cleanup();
                socket = null;
                connect(false); // one bounded retry with a re-derived token
                return;
            }
            finish(makeError(
                `TTS WebSocket handshake rejected with HTTP ${status}.`,
                `TTS_HANDSHAKE_HTTP_${status || 'UNKNOWN'}`
            ));
        });

        socket.on('error', (err) => {
            finish(makeError(`TTS WebSocket error: ${err.message}`, 'TTS_WS_ERROR'));
        });

        socket.on('close', () => {
            if (!audioReceived) {
                finish(makeError('TTS connection closed before audio was received.', 'TTS_CLOSED_NO_AUDIO'));
            }
        });
    };

    connect(true);
});

/**
 * Synthesize and encode as base64 with an explicit MIME type.
 *
 * @returns {Promise<{audio: string, mimeType: 'audio/mpeg', bytes: number}>}
 * @throws coded Error (TTS_*) on failure.
 */
const synthesizeToBase64 = async (text, options = {}) => {
    const audioBuffer = await synthesizeAudio(text, options);
    if (!audioBuffer || audioBuffer.length === 0) {
        throw makeError('TTS synthesis produced empty audio.', 'TTS_NO_AUDIO');
    }
    return {
        audio: audioBuffer.toString('base64'),
        mimeType: 'audio/mpeg',
        bytes: audioBuffer.length
    };
};

module.exports = {
    synthesizeAudio,
    synthesizeToBase64,
    // exported for tests
    generateSecMsGec,
    buildWssUrl,
    buildSsmlMessage
};
