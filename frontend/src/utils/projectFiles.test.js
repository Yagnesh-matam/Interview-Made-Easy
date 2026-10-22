/**
 * Unit tests for the folder/file attachment pipeline.
 * Synthetic file entries only — no real files, no credentials.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    selectProjectFiles,
    allocateContentBudget,
    summarizeSkips,
    buildAttachmentContext,
    isExcludedPath,
    isSecretFile,
    isBinaryFile,
    scoreFileForRelevance,
    PROJECT_FILE_LIMITS
} from './projectFiles.js';

const entriesOf = (paths) => paths.map((p) => ({ path: p, size: 1024 }));

test('small folder: multiple source files are all selected and ranked', () => {
    const { selected, skipped } = selectProjectFiles(entriesOf([
        'proj/src/App.jsx',
        'proj/src/util.js',
        'proj/README.md',
        'proj/index.html'
    ]));
    assert.equal(selected.length, 4);
    assert.equal(skipped.total, 0);
    // README outranks source, source outranks html/config.
    assert.equal(selected[0].path, 'proj/README.md');
    assert.ok(selected.findIndex((f) => f.path.endsWith('.jsx')) <
        selected.findIndex((f) => f.path.endsWith('index.html')));
});

test('excludes dependency, VCS, build, cache directories', () => {
    assert.ok(isExcludedPath('proj/node_modules/pkg/index.js'));
    assert.ok(isExcludedPath('proj/.git/config'));
    assert.ok(isExcludedPath('proj/dist/bundle.js'));
    assert.ok(isExcludedPath('proj/build/out.js'));
    assert.ok(isExcludedPath('proj/frontend/.next/server.js'));
    assert.ok(isExcludedPath('proj/__pycache__/mod.pyc'));
    assert.ok(!isExcludedPath('proj/src/index.js'));

    const { selected, skipped } = selectProjectFiles(entriesOf([
        'proj/node_modules/react/index.js',
        'proj/.git/HEAD',
        'proj/src/main.js'
    ]));
    assert.deepEqual(selected.map((f) => f.path), ['proj/src/main.js']);
    assert.equal(skipped.byReason.dependency, 2);
    assert.equal(skipped.total, 2);
});

test('excludes secrets, env files, keys and credential files', () => {
    assert.ok(isSecretFile('.env'));
    assert.ok(isSecretFile('app/.env.local'));
    assert.ok(isSecretFile('config/secrets.json'));
    assert.ok(isSecretFile('credentials.json'));
    assert.ok(isSecretFile('id_rsa'));
    assert.ok(isSecretFile('server.pem'));
    assert.ok(isSecretFile('service-account.json'));
    assert.ok(!isSecretFile('src/secretsManager.js')); // must not block normal source
    assert.ok(!isSecretFile('src/auth.js'));
    assert.ok(!isSecretFile('credentialsHelper.js')); // exact-prefix boundary: no match

    const { selected, skipped } = selectProjectFiles(entriesOf([
        'proj/.env',
        'proj/config/secrets.json',
        'proj/id_rsa',
        'proj/src/auth.js'
    ]));
    assert.deepEqual(selected.map((f) => f.path), ['proj/src/auth.js']);
    assert.equal(skipped.byReason.secret, 3);
});

test('excludes binary files and lock/minified files', () => {
    assert.ok(isBinaryFile('logo.png'));
    assert.ok(isBinaryFile('archive.zip'));
    assert.ok(isBinaryFile('lib.so'));
    const { selected, skipped } = selectProjectFiles(entriesOf([
        'proj/assets/logo.png',
        'proj/vendor.zip',
        'proj/package-lock.json',
        'proj/app.min.js',
        'proj/src/app.js'
    ]));
    assert.deepEqual(selected.map((f) => f.path), ['proj/src/app.js']);
    assert.equal(skipped.byReason.binary, 2);
    assert.equal(skipped.byReason.lockfile, 2);
});

test('oversized files and folders are bounded by limits', () => {
    // Single file over the per-file byte cap.
    const { selected, skipped } = selectProjectFiles([
        { path: 'proj/huge.js', size: PROJECT_FILE_LIMITS.maxFileBytes + 1 },
        { path: 'proj/small.js', size: 100 }
    ]);
    assert.equal(selected.length, 1);
    assert.equal(skipped.byReason.tooLarge, 1);

    // Folder with far more eligible files than maxFiles.
    const many = Array.from({ length: 50 }, (_, i) => ({ path: `proj/f${i}.js`, size: 10 }));
    const big = selectProjectFiles(many);
    assert.equal(big.selected.length, PROJECT_FILE_LIMITS.maxFiles);
    assert.equal(big.skipped.byReason.overFileLimit, 40);

    // Content budget never exceeds maxTotalChars.
    const files = big.selected.map((f) => ({ ...f, content: 'x'.repeat(PROJECT_FILE_LIMITS.perFileChars) }));
    const context = buildAttachmentContext(files);
    assert.ok(context.length <= PROJECT_FILE_LIMITS.maxTotalChars + 200,
        `context ${context.length} exceeds budget`);
});

test('content budget allocation stops at maxTotalChars and reports drops', () => {
    const selected = Array.from({ length: 10 }, (_, i) => ({ path: `p/f${i}.js`, name: `f${i}.js`, size: 1 }));
    const { fits, droppedForBudget } = allocateContentBudget(selected);
    const total = fits.reduce((sum, f) => sum + f.chars, 0);
    assert.ok(total <= PROJECT_FILE_LIMITS.maxTotalChars);
    assert.equal(fits.length + droppedForBudget, 10);
    assert.ok(total >= PROJECT_FILE_LIMITS.maxTotalChars - PROJECT_FILE_LIMITS.perFileChars);
});

test('duplicate paths are skipped (already attached)', () => {
    const { selected, skipped } = selectProjectFiles(
        entriesOf(['proj/src/a.js', 'proj/src/b.js']),
        { existingPaths: ['proj/src/a.js'] }
    );
    assert.deepEqual(selected.map((f) => f.path), ['proj/src/b.js']);
    assert.equal(skipped.byReason.duplicate, 1);
});

test('unsupported file types are skipped', () => {
    const { selected, skipped } = selectProjectFiles(entriesOf([
        'proj/photo.svg', // svg not in supported list
        'proj/movie.mp4', // classified as binary
        'proj/main.py'
    ]));
    assert.deepEqual(selected.map((f) => f.path), ['proj/main.py']);
    assert.equal(skipped.byReason.unsupported, 1);
    assert.equal(skipped.byReason.binary, 1);
});

test('summarizeSkips produces a clear human-readable report', () => {
    const { skipped } = selectProjectFiles(entriesOf([
        'p/node_modules/x.js', 'p/.env', 'p/a.png', 'p/src/main.js'
    ]));
    const summary = summarizeSkips(skipped);
    assert.match(summary, /Skipped 3 files/);
    assert.match(summary, /dependency\/cache/);
    assert.match(summary, /secrets/);
    assert.match(summary, /binary/);
    assert.equal(summarizeSkips({ total: 0, byReason: {} }), '');
});

test('buildAttachmentContext wraps contents in FILE blocks and truncates per budget', () => {
    const ctx = buildAttachmentContext([
        { name: 'a.js', path: 'src/a.js', content: 'const a = 1;' },
        { name: 'b.js', path: 'src/b.js', content: 'const b = 2;' }
    ], 400);
    assert.match(ctx, /SYSTEM ENHANCEMENT/);
    assert.match(ctx, /FILE: a\.js \(Path: src\/a\.js\)/);
    assert.match(ctx, /const a = 1;/);
    assert.ok(ctx.length <= 400 + 200);
    assert.equal(buildAttachmentContext([], 400), '');
});

test('relevance scoring: README > docs > source > config', () => {
    assert.ok(scoreFileForRelevance('p/README.md') > scoreFileForRelevance('p/docs/guide.md'));
    assert.ok(scoreFileForRelevance('p/docs/guide.md') > scoreFileForRelevance('p/src/main.js'));
    assert.ok(scoreFileForRelevance('p/src/main.js') > scoreFileForRelevance('p/tsconfig.json'));
});
