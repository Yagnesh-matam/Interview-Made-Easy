/**
 * Supabase authentication middleware.
 *
 * Verifies the Supabase access token attached by the frontend (Authorization: Bearer <jwt>)
 * directly against the Supabase auth service. The user identity returned by Supabase is the
 * ONLY identity the backend trusts — client-supplied user IDs in bodies/queries are ignored.
 */
const { createClient } = require('@supabase/supabase-js');

let supabaseAdmin = null;

const getSupabase = () => {
    if (supabaseAdmin) return supabaseAdmin;

    const supabaseUrl = process.env.SUPABASE_URL;
    // The anon/publishable key is safe on the server; it is only used to validate user JWTs.
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('[auth] SUPABASE_URL / SUPABASE_ANON_KEY not configured — protected endpoints will reject all requests.');
        return null;
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
    return supabaseAdmin;
};

const extractBearerToken = (req) => {
    const header = req.headers.authorization || req.headers.Authorization;
    if (typeof header !== 'string') return null;
    const [scheme, token] = header.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
    return token.trim();
};

const requireAuth = async (req, res, next) => {
    try {
        const token = extractBearerToken(req);
        if (!token) {
            return res.status(401).json({ error: 'Authentication required. Please sign in.' });
        }

        const supabase = getSupabase();
        if (!supabase) {
            return res.status(503).json({ error: 'Authentication service is not configured on the server.' });
        }

        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data || !data.user) {
            return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
        }

        // Verified identity — downstream handlers must use req.user.id, never client-supplied IDs.
        req.user = { id: data.user.id, email: data.user.email || null };
        return next();
    } catch (err) {
        console.error('[auth] Verification failed:', err.message);
        return res.status(401).json({ error: 'Session verification failed. Please sign in again.' });
    }
};

module.exports = { requireAuth };
