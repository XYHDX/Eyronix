
import { getFirebaseAdminApp, firestore, admin } from '../src/firebase/admin';

async function forceAdmin(email: string) {
    console.log(`Getting user by email: ${email}`);
    const auth = getFirebaseAdminApp().auth();

    try {
        const user = await auth.getUserByEmail(email);
        console.log(`Found user: ${user.uid}`);

        // Set custom claims
        console.log('Setting custom claims...');
        await auth.setCustomUserClaims(user.uid, { admin: true });

        // Update Firestore
        console.log('Updating Firestore...');
        await firestore.collection('users').doc(user.uid).set({
            role: 'admin'
        }, { merge: true });

        console.log(`Success! User ${email} is now an admin.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

forceAdmin('admin@gmail.com');
