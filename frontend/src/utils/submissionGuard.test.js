/**
 * Duplicate-submission guard tests: a second begin() while in flight is
 * rejected, and end() always restores capacity (loading-state cleanup).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createSubmissionGuard } from './submissionGuard.js';

test('first begin() proceeds, second begin() is rejected', () => {
    const guard = createSubmissionGuard();
    assert.equal(guard.begin(), true);
    assert.equal(guard.begin(), false); // double-click / Enter+click race
    assert.equal(guard.isBusy(), true);
});

test('end() restores capacity exactly once per cycle', () => {
    const guard = createSubmissionGuard();
    guard.begin();
    guard.end();
    assert.equal(guard.isBusy(), false);
    assert.equal(guard.begin(), true);
});

test('end() without begin() is safe (no negative state)', () => {
    const guard = createSubmissionGuard();
    guard.end();
    assert.equal(guard.isBusy(), false);
    assert.equal(guard.begin(), true);
});
