import { createClient } from '@supabase/supabase-js';

// User specified prefix is EYRONIX
const supabaseUrl = process.env.NEXT_PUBLIC_EYRONIX_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_EYRONIX_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase env vars missing. Check .env.local');
}

// Safe client creation
// If url/key are missing, we mock the client to prevent a crash,
// but requests will fail safely.
const isValid = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http');

export const supabase = isValid
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => Promise.resolve({ data: [], error: { message: 'Supabase keys missing' } }),
            insert: () => Promise.resolve({ error: { message: 'Supabase keys missing' } }),
            update: () => Promise.resolve({ error: { message: 'Supabase keys missing' } }),
            delete: () => Promise.resolve({ error: { message: 'Supabase keys missing' } }),
            eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase keys missing' } }) })
        }),
        auth: {
            getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase keys missing' } }),
            getSession: () => Promise.resolve({ data: { session: null }, error: { message: 'Supabase keys missing' } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase keys missing' } }),
            signInWithOAuth: () => Promise.resolve({ error: { message: 'Supabase keys missing' } }),
            signOut: () => Promise.resolve({ error: null })
        }
    } as any;
