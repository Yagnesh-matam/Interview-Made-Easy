/**
 * Unit tests for the bounded file reader: success/truncation plus the
 * failure paths (read error, timeout, abort, synchronous failure) that must
 * settle with a coded error instead of leaving the chat stuck loading.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readTextFileBounded } from './boundedRead.js';

// A FileReader stand-in that resolves with the file's `__content`.
class FakeReader {
    constructor() {
        this.aborted = false;
        this.onload = null;
        this.onerror = null;
        this.onabort = null;
    }
    readAsText(file) {
        queueMicrotask(() => {
            if (this.aborted) return;
            if (this.onload) this.onload({ target: { result: file.__content } });
        });
    }
    abort() {
        this.aborted = true;
        // Browsers fire `abort` asynchronously; tests trigger onabort directly
        // where needed.
    }
}

// A reader that never settles — models a hung read until the timeout fires.
class HangingReader {
    constructor() {
        this.abortCalled = false;
        this.onload = null;
        this.onerror = null;
        this.onabort = null;
    }
    readAsText() { /* never settles */ }
    abort() { this.abortCalled = true; }
}

// A reader whose read fails asynchronously with an error.
class ErrorReader {
    constructor() {
        this.onload = null;
        this.onerror = null;
        this.onabort = null;
    }
    readAsText() {
        queueMicrotask(() => { if (this.onerror) this.onerror(); });
    }
    abort() { /* noop */ }
}

// A reader whose read triggers the browser abort event path.
class AbortingReader {
    constructor() {
        this.onload = null;
        this.onerror = null;
        this.onabort = null;
    }
    readAsText() {
        queueMicrotask(() => { if (this.onabort) this.onabort(); });
    }
    abort() { /* noop */ }
}

// A reader whose readAsText throws synchronously (bad file reference).
class ThrowingReader {
    constructor() {
        this.onload = null;
        this.onerror = null;
        this.onabort = null;
    }
    readAsText() { throw new Error('sync-read-failure'); }
    abort() { /* noop */ }
}

test('reads content and truncates to maxChars', async () => {
    const file = { __content: 'ABCDEFGHIJ' };
    const out = await readTextFileBounded(file, 4, { FileReaderImpl: FakeReader });
    assert.equal(out, 'ABCD');
});

test('returns full content when under the cap; empty result yields empty string', async () => {
    const out = await readTextFileBounded({ __content: 'short' }, 100, { FileReaderImpl: FakeReader });
    assert.equal(out, 'short');
    const empty = await readTextFileBounded({ __content: '' }, 100, { FileReaderImpl: FakeReader });
    assert.equal(empty, '');
});

test('async read failure rejects with read-failed (never hangs)', async () => {
    await assert.rejects(
        readTextFileBounded({ __content: 'x' }, 10, { FileReaderImpl: ErrorReader }),
        (err) => err.message === 'read-failed'
    );
});

test('hung read rejects with read-timeout and aborts the reader', async () => {
    await assert.rejects(
        readTextFileBounded({ __content: 'x' }, 10, { FileReaderImpl: HangingReader, timeoutMs: 20 }),
        (err) => err.message === 'read-timeout'
    );
});

test('abort event rejects with read-aborted', async () => {
    await assert.rejects(
        readTextFileBounded({ __content: 'x' }, 10, { FileReaderImpl: AbortingReader }),
        (err) => err.message === 'read-aborted'
    );
});

test('synchronous readAsText failure rejects with the original error', async () => {
    await assert.rejects(
        readTextFileBounded({ __content: 'x' }, 10, { FileReaderImpl: ThrowingReader }),
        (err) => err.message === 'sync-read-failure'
    );
});

test('missing FileReader (unsupported environment) rejects with read-unsupported', async () => {
    await assert.rejects(
        readTextFileBounded({ __content: 'x' }, 10, { FileReaderImpl: null }),
        (err) => err.message === 'read-unsupported'
    );
});
