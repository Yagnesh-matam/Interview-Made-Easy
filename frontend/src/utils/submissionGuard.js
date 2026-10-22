/**
 * Synchronous duplicate-submission guard.
 *
 * React's `loading` state updates asynchronously, so a fast double-click
 * (or Enter + click) can invoke a handler twice before the first render.
 * This guard flips synchronously on begin() and is always released in the
 * handler's finally block, so the UI can never get stuck "busy".
 */
export const createSubmissionGuard = () => {
    let busy = false;
    return {
        /** @returns {boolean} true if the caller may proceed. */
        begin() {
            if (busy) return false;
            busy = true;
            return true;
        },
        end() {
            busy = false;
        },
        isBusy() {
            return busy;
        }
    };
};
