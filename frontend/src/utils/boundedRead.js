/**
 * Read a file as text with a hard size cap and a timeout so an unreadable
 * file can never leave the UI stuck loading.
 *
 * The reader implementation and timeout are injectable so the timeout and
 * failure paths are unit-testable in Node (no DOM required).
 *
 * Rejects with coded errors: 'read-timeout' | 'read-failed' | 'read-aborted'
 * | 'read-unsupported', or the original error from a synchronous
 * readAsText failure.
 */
export const readTextFileBounded = (file, maxChars, options = {}) => new Promise((resolve, reject) => {
    const {
        timeoutMs = 10000,
        FileReaderImpl = (typeof FileReader !== 'undefined' ? FileReader : null)
    } = options;

    if (!FileReaderImpl) {
        reject(new Error('read-unsupported'));
        return;
    }

    const reader = new FileReaderImpl();
    const timer = setTimeout(() => {
        try { reader.abort(); } catch { /* noop */ }
        reject(new Error('read-timeout'));
    }, timeoutMs);
    reader.onload = (e) => {
        clearTimeout(timer);
        resolve(String((e && e.target && e.target.result) || '').substring(0, maxChars));
    };
    reader.onerror = () => {
        clearTimeout(timer);
        reject(new Error('read-failed'));
    };
    reader.onabort = () => {
        clearTimeout(timer);
        reject(new Error('read-aborted'));
    };
    try {
        reader.readAsText(file);
    } catch (err) {
        clearTimeout(timer);
        reject(err);
    }
});

export default readTextFileBounded;
