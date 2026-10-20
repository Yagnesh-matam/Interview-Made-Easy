/**
 * Groq model configuration + safe error handling for the Adaptive Quiz generator.
 *
 * Why this exists:
 * `llama-3.3-70b-versatile` (and `llama-3.1-8b-instant`) moved to Groq's Enterprise
 * tier in August 2026, so requests from Free/Developer accounts fail with
 * `404 model_not_found: The model 'llama-3.3-70b-versatile' does not exist or you do
 * not have access to it.`
 * The default below is a PRODUCTION text model documented as available on the
 * Developer plan at https://console.groq.com/docs/models, which also supports
 * JSON output (https://console.groq.com/docs/structured-outputs).
 *
 * Everything here is pure (no network, no Groq client) so it can be unit tested.
 */

const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

// Models Groq documents as accepting `reasoning_effort` (low | medium | high):
// https://console.groq.com/docs/reasoning
// Sending `reasoning_effort` to any other model is rejected with a 400, so it is
// only attached when the configured model is known to support it.
const REASONING_EFFORT_MODELS = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'meta-models/muse-spark-open'
];

// Env vars whose values must never appear in logs or API responses.
const SECRET_ENV_KEYS = ['GROQ_API_KEY', 'GEMINI_API_KEY', 'SUPABASE_ANON_KEY'];

/** Thrown when the provider answered but the payload could not be used. */
class InvalidModelResponseError extends Error {
    constructor(reason) {
        super(`Model returned an unusable response: ${reason}`);
        this.name = 'InvalidModelResponseError';
    }
}

/**
 * Resolves the Groq model ID: GROQ_MODEL_ID env var wins, otherwise the
 * documented default. Blank/whitespace values fall back to the default.
 */
const getGroqModelId = (env = process.env) => {
    const raw = typeof env.GROQ_MODEL_ID === 'string' ? env.GROQ_MODEL_ID.trim() : '';
    return raw || DEFAULT_GROQ_MODEL;
};

const supportsReasoningEffort = (modelId) => REASONING_EFFORT_MODELS.includes(modelId);

/**
 * Builds the chat-completion request for one adaptive question.
 *
 * - `max_completion_tokens` (not the deprecated `max_tokens`): GPT-OSS models spend
 *   part of the budget on reasoning tokens, so the budget must cover reasoning + JSON.
 * - `reasoning_effort: 'low'`: keeps a single quiz question fast and cheap.
 * - `temperature: 0.6`: Groq's documented recommended range for reasoning models is 0.5-0.7.
 */
const buildQuizCompletionParams = ({ modelId, messages }) => {
    const params = {
        model: modelId || DEFAULT_GROQ_MODEL,
        messages,
        temperature: 0.6,
        max_completion_tokens: 2048,
        response_format: { type: 'json_object' }
    };
    if (supportsReasoningEffort(params.model)) {
        params.reasoning_effort = 'low';
    }
    return params;
};

/**
 * Strips provider noise (reasoning tags, code fences, leading prose) and returns
 * the JSON object text, or '' when nothing parseable is present.
 */
const extractJsonText = (content) => {
    if (typeof content !== 'string' || !content.trim()) return '';

    // Raw reasoning may be wrapped in <think>...</think> tags.
    let text = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    if (!text.startsWith('{')) {
        const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced) text = fenced[1].trim();
    }
    if (!text.startsWith('{')) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end > start) text = text.slice(start, end + 1);
    }
    return text;
};

/**
 * Removes credentials from any text destined for a log line or an API response.
 * Masks both well-known credential shapes and the actual values of secret env vars.
 */
const redactSecrets = (text, env = process.env) => {
    let out = String(text == null ? '' : text);

    for (const key of SECRET_ENV_KEYS) {
        const value = typeof env[key] === 'string' ? env[key] : '';
        if (value.length >= 8) out = out.split(value).join('[redacted]');
    }
    out = out.replace(/gsk_[A-Za-z0-9_-]+/g, 'gsk_[redacted]');
    out = out.replace(/(bearer\s+)[^\s"']+/gi, '$1[redacted]');
    out = out.replace(/([?&](?:key|api[_-]?key|token|access[_-]?token|authorization)=)[^&\s"']+/gi, '$1[redacted]');
    return out;
};

/**
 * Maps a provider/internal failure to { httpStatus, publicMessage, logMessage }.
 * `publicMessage` is what the client may see (safe: no keys, no raw upstream dumps);
 * `logMessage` is for server logs only and is always redacted.
 */
const classifyProviderError = (error, env = process.env) => {
    const name = (error && error.name) || 'Error';
    const status = error && Number.isInteger(error.status) ? error.status : null;
    const rawMessage = error && typeof error.message === 'string' ? error.message : '';
    const haystack = `${name} ${rawMessage}`;
    const modelId = getGroqModelId(env);

    const logMessage = `[adaptive-quiz] model=${modelId} ${name}${status ? ` ${status}` : ''}: ` +
        redactSecrets(rawMessage || '(no message)', env);

    // 1. Provider answered, but the payload could not be used (malformed/empty JSON).
    if (error instanceof InvalidModelResponseError) {
        return {
            httpStatus: 502,
            publicMessage: 'The AI returned an unusable answer. Please try again.',
            logMessage
        };
    }

    // 2. Timeouts / connection failures (no HTTP status).
    if (status === null && /timeout|connection|network|fetch|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|aborted/i.test(haystack)) {
        return {
            httpStatus: 503,
            publicMessage: 'The AI provider is unreachable right now. Please try again shortly.',
            logMessage
        };
    }

    // 3. Credentials rejected (bad/expired key, insufficient permissions).
    if (status === 401 || status === 403 || /AuthenticationError|PermissionDeniedError|invalid api key|missing credentials/i.test(haystack)) {
        return {
            httpStatus: 500,
            publicMessage: 'The AI provider rejected the server credentials. Check GROQ_API_KEY on the server.',
            logMessage
        };
    }

    // 4. Model missing or not available on this account (the reported failure).
    const isModelError = /model_not_found|does not exist or you do not have access/i.test(haystack)
        || (status === 404 && /model/i.test(rawMessage));
    if (isModelError) {
        return {
            httpStatus: 500,
            publicMessage: `The configured AI model (${modelId}) is not available on this Groq account. `
                + 'Set GROQ_MODEL_ID to a model listed at https://console.groq.com/docs/models.',
            logMessage
        };
    }

    // 5. Provider rate limit.
    if (status === 429 || /RateLimitError/i.test(haystack)) {
        return {
            httpStatus: 429,
            publicMessage: 'The AI provider is rate limiting requests right now. Please try again in a minute.',
            logMessage
        };
    }

    // 6. Provider outage.
    if (status !== null && status >= 500) {
        return {
            httpStatus: 503,
            publicMessage: 'The AI provider is temporarily unavailable. Please try again shortly.',
            logMessage
        };
    }

    // 7. Provider rejected the request (e.g. a parameter the configured model does not support).
    if (status === 400 || status === 422 || /BadRequestError/i.test(haystack)) {
        return {
            httpStatus: 500,
            publicMessage: `The AI provider rejected the generation request. Check that GROQ_MODEL_ID (${modelId}) is correct.`,
            logMessage
        };
    }

    return {
        httpStatus: 500,
        publicMessage: 'Failed to generate question. Please try again.',
        logMessage
    };
};

module.exports = {
    DEFAULT_GROQ_MODEL,
    InvalidModelResponseError,
    getGroqModelId,
    supportsReasoningEffort,
    buildQuizCompletionParams,
    extractJsonText,
    redactSecrets,
    classifyProviderError
};
