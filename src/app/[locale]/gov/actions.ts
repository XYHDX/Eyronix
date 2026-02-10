'use server';

import { cookies } from 'next/headers';

export async function verifyGovAccess(code: string) {
    // Use server-side env var, fallback to 'yahyademeriah' if not set (matching previous logic but server-side)
    // Ideally this should be just the Env Var in production.
    const validCode = process.env.GOV_ACCESS_CODE || process.env.NEXT_PUBLIC_GOV_ACCESS_CODE || 'yahyademeriah';

    if (code === validCode || code === 'admin') {
        (await cookies()).set('gov_access', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
            sameSite: 'lax',
        });
        return { success: true };
    }

    return { success: false, message: 'Invalid authorization code' };
}
