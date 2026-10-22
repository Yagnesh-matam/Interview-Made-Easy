/**
 * Pure helpers for turning a browser folder/file selection into a bounded,
 * relevance-ranked set of source attachments for the AI interview chat.
 *
 * No DOM or React imports here so the logic is unit-testable in Node.
 */

export const PROJECT_FILE_LIMITS = {
    // Hard cap on how many files are attached from one selection.
    maxFiles: 10,
    // Individual files larger than this are skipped before reading.
    maxFileBytes: 200 * 1024,
    // Per-file text budget sent to the model.
    perFileChars: 8000,
    // Total attachment text budget. Kept below the backend's 50,000-char
    // per-message validation limit so the user message is never dropped.
    maxTotalChars: 40000
};

// Directories that never contain relevant interview source.
const EXCLUDED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit',
    '.output', '.turbo', '.cache', '.parcel-cache', 'coverage', 'vendor', 'target',
    '__pycache__', '.venv', 'venv', '.gradle', 'bower_components', '.pytest_cache',
    '.mypy_cache', '.idea', '.vscode', 'tmp', 'temp', '.tox', '.eggs'
]);

// File names that must never be uploaded (secrets/credentials).
const SECRET_NAME_PATTERNS = [
    /^\.env($|\.)/i,
    /^credentials?\b/i,
    /^secrets?\b/i,
    /^service[-_]?account/i,
    /^\.?npmrc$/i,
    /^\.?pypirc$/i,
    /^\.netrc$/i,
    /^\.htpasswd$/i,
    /^id_(rsa|dsa|ecdsa|ed25519)(\.|$)/i,
    /\.(pem|key|p12|pfx|keystore|jks)$/i
];

// Binary/media/archive extensions — never read as text.
const BINARY_EXTENSIONS = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico', 'tif', 'tiff', 'psd', 'ai', 'eps',
    'zip', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'rar', '7z', 'jar', 'war', 'apk', 'exe',
    'dll', 'so', 'dylib', 'bin', 'dat', 'iso', 'img', 'wasm', 'class', 'o', 'a',
    'mp3', 'wav', 'flac', 'ogg', 'm4a', 'mp4', 'mov', 'avi', 'mkv', 'webm',
    'ttf', 'otf', 'woff', 'woff2', 'eot', 'db', 'sqlite', 'sqlite3'
]);

// Dependency lockfiles: huge, low-signal.
const LOCKFILE_NAMES = new Set([
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'npm-shrinkwrap.json',
    'composer.lock', 'cargo.lock', 'poetry.lock', 'gemfile.lock', 'pipfile.lock',
    'go.sum', 'bun.lockb'
]);

const DOC_EXTENSIONS = new Set(['md', 'markdown', 'txt', 'rst']);
const SOURCE_EXTENSIONS = new Set([
    'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'py', 'java', 'c', 'cpp', 'cc', 'cxx', 'h',
    'hpp', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'kts', 'scala', 'vue', 'svelte',
    'dart', 'm', 'mm', 'sql', 'sh', 'bash', 'zsh', 'ipynb', 'r', 'rmd'
]);
const SUPPORTED_EXTENSIONS = new Set([
    ...SOURCE_EXTENSIONS, ...DOC_EXTENSIONS,
    'html', 'htm', 'css', 'scss', 'sass', 'less', 'json', 'yml', 'yaml', 'toml',
    'xml', 'csv', 'env.example'
]);

const getExtension = (fileName) => {
    const lower = String(fileName || '').toLowerCase();
    const base = lower.split('/').pop() || lower;
    if (base === '.env' || base.startsWith('.env.')) return 'env';
    const idx = base.lastIndexOf('.');
    return idx > 0 ? base.slice(idx + 1) : '';
};

export const isExcludedPath = (relativePath) => {
    const segments = String(relativePath || '').split('/');
    return segments.slice(0, -1).some((seg) => EXCLUDED_DIRS.has(seg.toLowerCase()));
};

export const isSecretFile = (fileName) => {
    const base = String(fileName || '').split('/').pop() || '';
    return SECRET_NAME_PATTERNS.some((re) => re.test(base));
};

export const isBinaryFile = (fileName) =>
    BINARY_EXTENSIONS.has(getExtension(fileName));

export const isLockfile = (fileName) =>
    LOCKFILE_NAMES.has((String(fileName || '').split('/').pop() || '').toLowerCase()) ||
    /\.min\.(js|css)$/.test(String(fileName || '').toLowerCase());

export const isSupportedFile = (fileName) => {
    const ext = getExtension(fileName);
    if (ext === 'env') return true; // .env is supported-extension-wise but blocked as secret
    return SUPPORTED_EXTENSIONS.has(ext);
};

export const isDocumentFile = (fileName) => DOC_EXTENSIONS.has(getExtension(fileName));

// Relevance score: docs and READMEs first (they explain the project),
// then source code, then config.
export const scoreFileForRelevance = (relativePath) => {
    const base = (String(relativePath || '').split('/').pop() || '').toLowerCase();
    const ext = getExtension(base);
    if (base.startsWith('readme')) return 100;
    if (DOC_EXTENSIONS.has(ext)) return 80;
    if (SOURCE_EXTENSIONS.has(ext)) return 60;
    return 30; // config / misc supported files
};

/**
 * Filter + rank a raw selection.
 *
 * @param {Array<{path: string, size?: number}>} entries with browser-relative paths
 * @param {object} [options]
 * @param {string[]} [options.existingPaths] already-attached paths (dedupe)
 * @param {object} [options.limits] override PROJECT_FILE_LIMITS
 * @returns {{selected: Array<{path,name,size,score}>, skipped: {total:number, byReason: Object<string,number>}}}
 */
export const selectProjectFiles = (entries, options = {}) => {
    const limits = { ...PROJECT_FILE_LIMITS, ...(options.limits || {}) };
    const existing = new Set((options.existingPaths || []).map((p) => String(p).toLowerCase()));
    const byReason = {
        dependency: 0,
        secret: 0,
        binary: 0,
        lockfile: 0,
        unsupported: 0,
        tooLarge: 0,
        duplicate: 0,
        overFileLimit: 0
    };

    const candidates = [];
    for (const entry of entries || []) {
        const path = String(entry && entry.path || '').replace(/\\/g, '/');
        if (!path) continue;
        const name = path.split('/').pop();
        const size = Number(entry && entry.size) || 0;

        if (isExcludedPath(path)) { byReason.dependency += 1; continue; }
        if (isSecretFile(name)) { byReason.secret += 1; continue; }
        if (isBinaryFile(name)) { byReason.binary += 1; continue; }
        if (isLockfile(name)) { byReason.lockfile += 1; continue; }
        if (!isSupportedFile(name)) { byReason.unsupported += 1; continue; }
        if (size > limits.maxFileBytes) { byReason.tooLarge += 1; continue; }
        if (existing.has(path.toLowerCase())) { byReason.duplicate += 1; continue; }

        existing.add(path.toLowerCase());
        candidates.push({ path, name, size, score: scoreFileForRelevance(path) });
    }

    // Most relevant first; stable tie-break by path for determinism.
    candidates.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

    let selected = candidates;
    if (candidates.length > limits.maxFiles) {
        byReason.overFileLimit = candidates.length - limits.maxFiles;
        selected = candidates.slice(0, limits.maxFiles);
    }

    const total = Object.values(byReason).reduce((a, b) => a + b, 0);
    return { selected, skipped: { total, byReason } };
};

/**
 * Assign each selected file a character budget without exceeding the total.
 * Later (less relevant) files may receive 0 and are dropped from the budget.
 *
 * @returns {{fits: Array<{path,name,chars}>, droppedForBudget: number}}
 */
export const allocateContentBudget = (selected, limits = PROJECT_FILE_LIMITS) => {
    let remaining = limits.maxTotalChars;
    const fits = [];
    let droppedForBudget = 0;
    for (const file of selected) {
        const chars = Math.min(limits.perFileChars, remaining);
        if (chars <= 0) { droppedForBudget += 1; continue; }
        remaining -= chars;
        fits.push({ path: file.path, name: file.name, chars });
    }
    return { fits, droppedForBudget };
};

/**
 * Human-readable skip summary, e.g.
 * "Skipped 1,203 files: 950 dependency/cache, 12 secrets, 200 binary…"
 */
export const summarizeSkips = (skipped) => {
    if (!skipped || skipped.total === 0) return '';
    const labels = {
        dependency: 'dependency/cache',
        secret: 'secrets',
        binary: 'binary',
        lockfile: 'lock/minified',
        unsupported: 'unsupported type',
        tooLarge: 'too large',
        duplicate: 'already attached',
        overFileLimit: 'over file limit'
    };
    const parts = Object.entries(skipped.byReason)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([reason, count]) => `${count} ${labels[reason] || reason}`);
    return `Skipped ${skipped.total.toLocaleString()} file${skipped.total === 1 ? '' : 's'}: ${parts.join(', ')}.`;
};

/**
 * Build the [SYSTEM ENHANCEMENT …] context block from attached files, keeping
 * the total payload under the backend's per-message validation limit.
 *
 * @param {Array<{name,path,content}>} files
 * @param {number} [maxChars]
 * @returns {string} context block, or '' when nothing fits
 */
export const buildAttachmentContext = (files, maxChars = PROJECT_FILE_LIMITS.maxTotalChars) => {
    if (!Array.isArray(files) || files.length === 0) return '';
    let used = 0;
    const parts = [];
    for (const file of files) {
        const header = `\n=== FILE: ${file.name} (Path: ${file.path}) ===\n\`\`\`\n`;
        const footer = '\n```\n            ';
        const overhead = header.length + footer.length;
        const remaining = maxChars - used - overhead;
        if (remaining <= 0) break;
        const content = String(file.content || '').slice(0, remaining);
        parts.push(`${header}${content}${footer}`);
        used += overhead + content.length;
    }
    if (parts.length === 0) return '';
    return `[SYSTEM ENHANCEMENT: User has attached files for review:\n${parts.join('\n')}Analyze these files in detail and ask highly specific questions about them (whether code files, documents, or resumes)!]`;
};
