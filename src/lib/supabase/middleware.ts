import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, response?: NextResponse) {
    // Should default to creating a response if none provided
    // BUT we must reference the `response` variable in the closure of setAll
    // So we need to initialize it.
    let finalResponse = response || NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_EYRONIX_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_EYRONIX_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Middleware: Supabase Env Vars missing. Skipping auth check.');
        return finalResponse;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))

                    // If we were passed a response (likely from next-intl), we shouldn't wipe it with NextResponse.next()
                    // unless we are sure we can preserve its properties.
                    // For now, simpler approach: just set cookies on the existing response object.

                    if (!response) {
                        finalResponse = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                    }

                    cookiesToSet.forEach(({ name, value, options }) =>
                        finalResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    try {
        await supabase.auth.getUser()
    } catch (error) {
        // Suppress errors to prevent black screen/500 if supabase is unreachable or key is invalid
        console.error('Middleware Auth Error:', error);
    }

    return response
}
