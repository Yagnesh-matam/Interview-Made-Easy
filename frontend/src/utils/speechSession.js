/**
 * Speech-input session controller for the browser Web Speech API
 * (window.SpeechRecognition / webkitSpeechRecognition).
 *
 * Pure logic — the recognition object is injected, so behavior (interim +
 * final transcript accumulation, error handling, restart control, duplicate
 * session prevention) is unit-testable in Node with a fake recognition.
 *
 * Browser-support notes (deliberately conservative claims):
 *  - interimResults is requested; Chrome/Edge (webkitSpeechRecognition)
 *    deliver interim results. Firefox has no Web Speech recognition and
 *    Safari's support is partial — callers must handle `supported === false`.
 *  - Recognition runs through the browser vendor's service; it is NOT
 *    offline and we make no offline claim.
 */

export const MIC_STATE = {
    IDLE: 'idle',
    LISTENING: 'listening',
    PROCESSING: 'processing', // stopped, waiting for the final result
    DENIED: 'denied',
    ERROR: 'error'
};

const noop = () => {};

/**
 * @param {object} recognition A SpeechRecognition-like instance
 *        ({ start, stop, abort?, continuous, interimResults, lang,
 *           onstart, onresult, onerror, onend }).
 * @param {object} handlers
 * @param {(state: string) => void} [handlers.onState]
 * @param {(text: string, meta: {hasInterim: boolean}) => void} [handlers.onTranscript]
 * @param {(code: string) => void} [handlers.onError] code: denied|network|no-mic|no-speech|other
 * @param {string} [handlers.initialText] text already in the input box (preserved, not overwritten)
 * @param {boolean} [handlers.restartOnEnd] keep listening across utterances
 * @param {number} [handlers.maxSessionMs] auto-stop a runaway session
 * @param {() => boolean} [handlers.shouldRestart] consulted before auto-restart
 * @returns {{
 *   state: () => string,
 *   isListening: () => boolean,
 *   start: () => boolean,
 *   stop: (opts?: {finalize?: boolean}) => void,
 *   sessionText: () => string,
 *   destroy: () => void
 * }}
 */
export const createSpeechSession = (recognition, handlers = {}) => {
    const {
        onState = noop,
        onTranscript = noop,
        onError = noop,
        initialText = '',
        restartOnEnd = true,
        maxSessionMs = 120000,
        shouldRestart = () => true
    } = handlers;

    let state = MIC_STATE.IDLE;
    let finalTranscript = '';
    let seededText = String(initialText || '');
    let sessionActive = false; // user intent: mic should be running
    let sawFinalResult = false;
    let sessionTimer = null;

    const setState = (next) => {
        if (state === next) return;
        state = next;
        onState(next);
    };

    const emitTranscript = (interim = '') => {
        const finalPart = finalTranscript.trim();
        const initial = String(seededText || '').trim();
        const pieces = [initial, finalPart, interim.trim()].filter(Boolean);
        onTranscript(pieces.join(' '), { hasInterim: Boolean(interim) });
    };

    const clearSessionTimer = () => {
        if (sessionTimer) {
            clearTimeout(sessionTimer);
            sessionTimer = null;
        }
    };

    const finishSession = (code) => {
        sessionActive = false;
        clearSessionTimer();
        if (code === 'denied') setState(MIC_STATE.DENIED);
        else if (code) setState(MIC_STATE.ERROR);
        else setState(MIC_STATE.IDLE);
        // Stop the recognizer so the session is deterministically over (a real
        // browser fires `end` after `error`; calling stop() is safe/no-op there).
        try { recognition.stop(); } catch { /* already stopped */ }
        if (code) onError(code);
    };

    recognition.continuous = false; // finalize each utterance quickly; we restart ourselves
    recognition.interimResults = true;
    if (!recognition.lang) recognition.lang = 'en-US';

    recognition.onstart = () => {
        setState(MIC_STATE.LISTENING);
        if (maxSessionMs > 0 && !sessionTimer) {
            sessionTimer = setTimeout(() => {
                // Runaway session guard: stop and finalize whatever we have.
                sessionActive = false;
                try { recognition.stop(); } catch { /* already stopped */ }
                setState(MIC_STATE.IDLE);
                onError('session-timeout');
            }, maxSessionMs);
        }
    };

    recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const result = event.results[i];
            if (result.isFinal) {
                finalTranscript += `${result[0].transcript} `;
                sawFinalResult = true;
            } else {
                interim += result[0].transcript;
            }
        }
        if (state === MIC_STATE.PROCESSING && !interim) {
            // We were waiting for this final result.
            setState(MIC_STATE.IDLE);
            sessionActive = false;
            clearSessionTimer();
        } else {
            setState(MIC_STATE.LISTENING);
        }
        emitTranscript(interim);
    };

    recognition.onerror = (event) => {
        const error = event && event.error;
        if (error === 'not-allowed' || error === 'service-not-allowed') {
            finishSession('denied');
        } else if (error === 'network') {
            finishSession('network');
        } else if (error === 'audio-capture') {
            finishSession('no-mic');
        } else if (error === 'no-speech') {
            // Transient in continuous listening; surfaced only if nothing captured.
            if (!sawFinalResult && !restartOnEnd) {
                sessionActive = false;
                clearSessionTimer();
                setState(MIC_STATE.IDLE);
                onError('no-speech');
            }
        } else if (error !== 'aborted') {
            finishSession('other');
        }
    };

    recognition.onend = () => {
        clearSessionTimer();
        if (!sessionActive) {
            // Keep DENIED/ERROR as terminal states (browsers fire `end` right
            // after `error`); any other inactive session settles to IDLE.
            if (state !== MIC_STATE.DENIED && state !== MIC_STATE.ERROR) {
                setState(MIC_STATE.IDLE);
            }
            return;
        }
        if (restartOnEnd && shouldRestart()) {
            // End of an utterance — restart promptly so the next one is caught.
            // While listening continuously we stay in LISTENING; the UI can show
            // a "listening…" hint based on state alone.
            try {
                recognition.start();
            } catch {
                // start() throws if already started — treat as still listening.
                setState(MIC_STATE.LISTENING);
            }
        } else {
            sessionActive = false;
            setState(MIC_STATE.IDLE);
        }
    };

    return {
        state: () => state,
        isListening: () => state === MIC_STATE.LISTENING || state === MIC_STATE.PROCESSING,
        sessionText: () => finalTranscript.trim(),
        start: (seed) => {
            if (sessionActive) return false; // prevent duplicate sessions
            sessionActive = true;
            sawFinalResult = false;
            finalTranscript = '';
            if (typeof seed === 'string') seededText = seed;
            setState(MIC_STATE.LISTENING);
            emitTranscript('');
            try {
                recognition.start();
            } catch {
                finishSession('other');
                return false;
            }
            return true;
        },
        stop: ({ finalize = true } = {}) => {
            if (!sessionActive && state === MIC_STATE.IDLE) return;
            sessionActive = false;
            clearSessionTimer();
            if (finalize && !sawFinalResult) {
                // Recognition fires `end` (then `onend` runs with sessionActive=false);
                // show PROCESSING until the final result or `end` arrives.
                setState(MIC_STATE.PROCESSING);
            } else {
                setState(MIC_STATE.IDLE);
            }
            try { recognition.stop(); } catch { /* already stopped */ }
        },
        destroy: () => {
            sessionActive = false;
            clearSessionTimer();
            recognition.onstart = null;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            try { recognition.abort(); } catch { /* noop */ }
            setState(MIC_STATE.IDLE);
        }
    };
};
