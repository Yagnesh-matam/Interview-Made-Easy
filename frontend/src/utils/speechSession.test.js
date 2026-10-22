/**
 * Unit tests for the speech-input session controller using a fake
 * SpeechRecognition object (no browser, no network, no real audio).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createSpeechSession, MIC_STATE } from './speechSession.js';

// maxSessionMs: 0 disables the auto-stop timer so tests don't leave pending
// timers holding the process open.
const SESSION_NO_TIMER = { maxSessionMs: 0 };

const makeFakeRecognition = () => {
    const rec = {
        started: false,
        startCalls: 0,
        continuous: null,
        interimResults: null,
        lang: null,
        onstart: null,
        onresult: null,
        onerror: null,
        onend: null,
        start() {
            if (rec.started) throw new Error('invalid state: already started');
            rec.started = true;
            rec.startCalls += 1;
            if (rec.onstart) rec.onstart();
        },
        stop() {
            // Browsers fire `end` asynchronously after stop(); tests trigger
            // `onend` explicitly to model that.
            rec.started = false;
        },
        abort() {
            rec.started = false;
        },
        emitResult(results, resultIndex = 0) {
            if (rec.onresult) rec.onresult({ resultIndex, results });
        },
        emitError(error) {
            if (rec.onerror) rec.onerror({ error });
        }
    };
    return rec;
};

// Build a Web-Speech-shaped result list.
const resultOf = (transcripts, { final = true } = {}) =>
    transcripts.map((t) => Object.assign([ { transcript: t } ], { isFinal: final }));

test('configures continuous=false and interimResults=true', () => {
    const rec = makeFakeRecognition();
    createSpeechSession(rec, SESSION_NO_TIMER);
    assert.equal(rec.continuous, false);
    assert.equal(rec.interimResults, true);
    assert.equal(rec.lang, 'en-US');
});

test('start() enters LISTENING and reports interim transcripts', () => {
    const rec = makeFakeRecognition();
    const states = [];
    const transcripts = [];
    const session = createSpeechSession(rec, {
        ...SESSION_NO_TIMER,
        onState: (s) => states.push(s),
        onTranscript: (text) => transcripts.push(text)
    });
    assert.equal(session.start(), true);
    assert.deepEqual(states, [MIC_STATE.LISTENING]);

    rec.emitResult(resultOf(['hello wor'], { final: false }));
    assert.equal(transcripts.at(-1), 'hello wor');
    assert.equal(session.isListening(), true);
});

test('final results accumulate and seed text is preserved', () => {
    const rec = makeFakeRecognition();
    const transcripts = [];
    const session = createSpeechSession(rec, {
        ...SESSION_NO_TIMER,
        initialText: 'Already typed:',
        onTranscript: (text) => transcripts.push(text)
    });
    session.start();
    rec.emitResult(resultOf(['part one. ']))
    rec.emitResult(resultOf(['part two. ']))
    const finalText = transcripts.at(-1);
    assert.match(finalText, /^Already typed:/);
    assert.match(finalText, /part one\./);
    assert.match(finalText, /part two\./);
});

test('start(seed) overrides the preserved initial text', () => {
    const rec = makeFakeRecognition();
    const transcripts = [];
    const session = createSpeechSession(rec, {
        ...SESSION_NO_TIMER,
        initialText: 'old text',
        onTranscript: (text) => transcripts.push(text)
    });
    session.start('fresh seed');
    rec.emitResult(resultOf(['spoken']))
    assert.match(transcripts.at(-1), /^fresh seed/);
    assert.doesNotMatch(transcripts.at(-1), /old text/);
});

test('interim then final in the same event batch is handled', () => {
    const rec = makeFakeRecognition();
    const transcripts = [];
    const session = createSpeechSession(rec, {
        ...SESSION_NO_TIMER,
        onTranscript: (text, meta) => transcripts.push({ text, meta })
    });
    session.start();
    const mixed = [
        Object.assign([ { transcript: 'finished part. ' } ], { isFinal: true }),
        Object.assign([ { transcript: 'still going' } ], { isFinal: false })
    ];
    rec.emitResult(mixed, 0);
    const last = transcripts.at(-1);
    assert.match(last.text, /finished part\./);
    assert.match(last.text, /still going/);
    assert.equal(last.meta.hasInterim, true);
});

test('duplicate start() is rejected while a session is active', () => {
    const rec = makeFakeRecognition();
    const session = createSpeechSession(rec, SESSION_NO_TIMER);
    assert.equal(session.start(), true);
    assert.equal(session.start(), false); // second attempt ignored
    assert.equal(rec.startCalls, 1);
});

test('permission denied stops the session with DENIED state and error code', () => {
    const rec = makeFakeRecognition();
    const errors = [];
    const states = [];
    const session = createSpeechSession(rec, {
        ...SESSION_NO_TIMER,
        onState: (s) => states.push(s),
        onError: (code) => errors.push(code)
    });
    session.start();
    rec.emitError('not-allowed');
    assert.deepEqual(errors, ['denied']);
    assert.equal(session.state(), MIC_STATE.DENIED);
    assert.equal(session.isListening(), false);
    assert.equal(rec.started, false);
});

test('network and no-mic errors surface distinct codes', () => {
    for (const [error, code] of [['network', 'network'], ['audio-capture', 'no-mic']]) {
        const rec = makeFakeRecognition();
        const errors = [];
        const session = createSpeechSession(rec, { ...SESSION_NO_TIMER, onError: (c) => errors.push(c) });
        session.start();
        rec.emitError(error);
        assert.deepEqual(errors, [code]);
    }
});

test('no-speech error surfaces when nothing was captured (no silent restart loop)', () => {
    const rec = makeFakeRecognition();
    const errors = [];
    const session = createSpeechSession(rec, {
        ...SESSION_NO_TIMER,
        restartOnEnd: false,
        onError: (c) => errors.push(c)
    });
    session.start();
    rec.emitError('no-speech');
    assert.ok(errors.includes('no-speech'));
    assert.equal(session.state(), MIC_STATE.IDLE);
});

test('auto-restart keeps listening across utterances when allowed', async () => {
    const rec = makeFakeRecognition();
    const session = createSpeechSession(rec, { ...SESSION_NO_TIMER, restartOnEnd: true });
    session.start();
    assert.equal(rec.startCalls, 1);
    // Browser ends the utterance…
    rec.started = false;
    if (rec.onend) rec.onend();
    // …session restarts it automatically.
    assert.equal(rec.startCalls, 2);
    assert.equal(session.state(), MIC_STATE.LISTENING);
    session.stop({ finalize: false });
});

test('stop() with finalize goes to PROCESSING then IDLE on end', () => {
    const rec = makeFakeRecognition();
    const states = [];
    const session = createSpeechSession(rec, { ...SESSION_NO_TIMER, onState: (s) => states.push(s) });
    session.start();
    session.stop({ finalize: true });
    // No final result arrived; we show PROCESSING while waiting.
    assert.equal(session.state(), MIC_STATE.PROCESSING);
    // Browser then fires `end` without a final result → session settles.
    rec.started = false;
    if (rec.onend) rec.onend();
    assert.equal(session.state(), MIC_STATE.IDLE);
    assert.equal(session.isListening(), false);
});

test('final result arriving during finalize settles the session', () => {
    const rec = makeFakeRecognition();
    const session = createSpeechSession(rec, SESSION_NO_TIMER);
    session.start();
    session.stop({ finalize: true });
    assert.equal(session.state(), MIC_STATE.PROCESSING);
    rec.emitResult(resultOf(['final words. ']))
    assert.equal(session.state(), MIC_STATE.IDLE);
    assert.equal(session.sessionText(), 'final words.');
});

test('loading-state cleanup: stop() when idle is a no-op (no stuck states)', () => {
    const rec = makeFakeRecognition();
    const session = createSpeechSession(rec, SESSION_NO_TIMER);
    assert.equal(session.state(), MIC_STATE.IDLE);
    session.stop({ finalize: true });
    assert.equal(session.state(), MIC_STATE.IDLE);
    assert.equal(rec.started, false);
});

test('destroy() detaches handlers and stops the recognizer', () => {
    const rec = makeFakeRecognition();
    const session = createSpeechSession(rec, SESSION_NO_TIMER);
    session.start();
    session.destroy();
    assert.equal(rec.onresult, null);
    assert.equal(rec.onerror, null);
    assert.equal(rec.onend, null);
    assert.equal(session.state(), MIC_STATE.IDLE);
});
