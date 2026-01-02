import { createClient } from '@supabase/supabase-js';

// User specified prefix is EYRONIX
const supabaseUrl = process.env.NEXT_PUBLIC_EYRONIX_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_EYRONIX_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase env vars missing. Check .env.local');
}

// Create a safe client or a mock to prevent app crash if keys are missing
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({ select: () => Promise.resolve({ data: [], error: new Error('Missing Supabase Keys') }), insert: () => Promise.resolve({ error: new Error('Missing Supabase Keys') }), update: () => Promise.resolve({ error: new Error('Missing Supabase Keys') }), delete: () => Promise.resolve({ error: new Error('Missing Supabase Keys') }), eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Missing Supabase Keys') }) }) }),
        auth: {
            getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Missing Supabase Keys') }),
            getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Missing Supabase Keys') }),
            signInWithPassword: () => Promise.resolve({ data: { user: null }, error: new Error('Missing Supabase Keys') }),
            signInWithOAuth: () => Promise.resolve({ data: {}, error: new Error('Missing Supabase Keys') }),
            signOut: () => Promise.resolve({ error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
        }
    } as any;
