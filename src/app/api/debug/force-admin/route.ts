import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email') || 'admin@gmail.com';

    // Requires Service Role Key to bypass RLS and update other users
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        return NextResponse.json({ success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_EYRONIX_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        serviceRoleKey
    );

    try {
        // 1. Find user by email (using admin auth api)
        // This is tricky if listing is restricted, but admin client can lists users
        // But simpler: just update the profiles table where email matches, if I have email column there?
        // My profiles table schema has `email`? Let's assume yes or rely on `id`.
        // If I only have email, I need to look up ID.

        // Try to find in profiles directly if email is stored there (it usually is in my schema)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        let userId = profile?.id;

        if (!userId) {
            // If not found in profiles, try auth admin list (expensive) or just fail
            // Supabase Admin: listUsers
            const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
            if (authError) throw authError;
            const user = users.find(u => u.email === email);
            if (!user) {
                return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
            }
            userId = user.id;
        }

        // 2. Update Role
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .upsert({ id: userId, email: email, role: 'admin' }); // Upsert to ensure it exists

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: `User ${email} is now an admin.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
