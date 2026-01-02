import { createClient } from '@supabase/supabase-js';

// User specified prefix is EYRONIX
const supabaseUrl = process.env.NEXT_PUBLIC_EYRONIX_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_EYRONIX_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase env vars missing. Check .env.local');
}

// Safe client creation
// If url/key are missing or invalid (non-JWT), we mock the client to prevent a crash.
// Real Supabase Anon Keys are JWTs and start with 'eyJ'.
const isValid = supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http');

const createMockBuilder = () => {
    const builder: any = {
        select: () => builder,
        insert: () => builder,
        update: () => builder,
        delete: () => builder,
        eq: () => builder,
        single: () => builder,
        maybeSingle: () => builder,
        order: () => builder,
        limit: () => builder,
        then: (resolve: any) => resolve({ data: [], error: { message: 'Supabase keys missing' } })
    };
    return builder;
};

export const supabase = isValid
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => createMockBuilder(),
        auth: {
            getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase keys missing' } }),
            getSession: () => Promise.resolve({ data: { session: null }, error: { message: 'Supabase keys missing' } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase keys missing' } }),
            signInWithOAuth: () => Promise.resolve({ error: { message: 'Supabase keys missing' } }),
            signOut: () => Promise.resolve({ error: null })
        },
        channel: () => ({
            on: () => ({ subscribe: () => { } }),
            subscribe: () => { }
        }),
        removeChannel: () => { }
    } as any;
