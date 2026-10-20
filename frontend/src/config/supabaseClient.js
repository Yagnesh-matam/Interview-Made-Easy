import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// True only when real Supabase credentials are present. Used to skip
// persistence calls (and their noise) in unconfigured demo environments.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client = null;
if (isSupabaseConfigured) {
    try {
        client = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
    }
}

if (!client) {
    console.warn('Supabase credentials missing. Initializing mock auth services.');
    client = {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signUp: async () => ({ data: {}, error: new Error('Supabase is not configured.') }),
            signInWithPassword: async () => ({ data: {}, error: new Error('Supabase is not configured.') }),
            signInWithOAuth: async () => ({ error: new Error('Supabase is not configured.') }),
            signOut: async () => ({ error: null }),
            updateUser: async () => ({ data: {}, error: null })
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => ({
                        limit: () => ({
                            single: async () => ({ data: null, error: new Error('Supabase is not configured.') }),
                            maybeSingle: async () => ({ data: null, error: new Error('Supabase is not configured.') })
                        }),
                        single: async () => ({ data: null, error: new Error('Supabase is not configured.') })
                    }),
                    single: async () => ({ data: null, error: new Error('Supabase is not configured.') })
                })
            }),
            insert: async () => ({ data: null, error: new Error('Supabase is not configured.') })
        })
    };
}

export default client;
