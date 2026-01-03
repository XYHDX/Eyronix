import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // SYNC PROFILE DATA (Avatar, Name)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { user_metadata: { avatar_url, full_name, name } } = user;
                // Only update if we have data
                if (avatar_url || full_name || name) {
                    await supabase.from('profiles').upsert({
                        id: user.id,
                        updated_at: new Date().toISOString(),
                        ...(avatar_url && { avatar_url }),
                        ...(full_name || name ? { full_name: full_name || name } : {})
                    }, { onConflict: 'id' });
                }
            }

            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`)
}
