
import { type NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp, firestore } from '@/firebase/admin';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email') || 'admin@gmail.com';

    try {
        const adminApp = getFirebaseAdminApp();
        const auth = adminApp.auth();

        const user = await auth.getUserByEmail(email);

        // Set custom claims
        await auth.setCustomUserClaims(user.uid, { admin: true });

        // Update Firestore
        await firestore.collection('users').doc(user.uid).set({
            role: 'admin'
        }, { merge: true });

        return NextResponse.json({ success: true, message: `User ${email} is now an admin. Please sign out and sign back in.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
