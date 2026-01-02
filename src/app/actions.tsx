
"use server";

import { z } from "zod";
import { aiMotionDetectionAlert } from "@/ai/flows/ai-motion-detection-alert";
import { revalidatePath } from "next/cache";
import { getFirebaseAdminApp, firestore } from '@/firebase/admin';

export async function analyzeImage(imageDataUri: string) {
    try {
        if (!imageDataUri) {
            throw new Error("Image data is required");
        }

        const result = await aiMotionDetectionAlert({
            cameraFeed: imageDataUri,
        });

        return result;

    } catch (error) {
        console.error("AI analysis error:", error);
        // Ensure a consistent return shape on error
        return { alertMessage: 'Failed to analyze the image due to a server error.' };
    }
}

export async function revalidateServices() {
    revalidatePath('/dashboard/services');
    revalidatePath('/');
}

export async function revalidateProducts() {
    revalidatePath('/dashboard/products');
    revalidatePath('/');
}

export async function revalidatePricing() {
    revalidatePath('/dashboard/pricing');
    revalidatePath('/');
}

export async function setAdminRole(uid: string, isAdminRole: boolean) {
    try {
        const adminApp = getFirebaseAdminApp();
        const auth = adminApp.auth();
        const userRef = firestore.collection('users').doc(uid);

        let isAdmin = isAdminRole;

        const userRecord = await auth.getUser(uid);

        // This server action is now the single source of truth for making a user an admin.
        // It checks if this is the first user ever, and if so, forces them to be an admin.
        // ALSO: Force admin for the hardcoded super-admin email.
        const usersSnap = await firestore.collection('users').get();
        if (usersSnap.docs.length <= 1 || userRecord.email === 'admin@eyronix.com' || userRecord.email === 'admin@gmail.com') {
            isAdmin = true;
        }

        if (isAdmin) {
            // Set the custom claim. This is the source of truth for security rules.
            await auth.setCustomUserClaims(uid, { admin: true });

            // Also update the role in the user's Firestore document for client-side display.
            await userRef.set({ role: 'admin' }, { merge: true });
        } else {
            await auth.setCustomUserClaims(uid, { admin: false });
            await userRef.set({ role: 'user' }, { merge: true });
        }

        return { success: true, madeAdmin: isAdmin };
    } catch (error: any) {
        console.error("Failed to set admin role:", error);
        return { success: false, error: error.message };
    }
}

export async function updateUserRole(uid: string, newRole: 'admin' | 'user') {
    try {
        const adminApp = getFirebaseAdminApp();
        const auth = adminApp.auth();

        // Server-side check to prevent removing the last admin
        if (newRole === 'user') {
            const usersRef = firestore.collection('users');
            const adminUsersQuery = usersRef.where('role', '==', 'admin');
            const adminUsersSnap = await adminUsersQuery.get();

            if (adminUsersSnap.docs.length <= 1) {
                const lastAdmin = adminUsersSnap.docs[0];
                if (lastAdmin.id === uid) {
                    throw new Error("Cannot remove the last admin.");
                }
            }
        }

        const userRef = firestore.collection('users').doc(uid);

        await auth.setCustomUserClaims(uid, { admin: newRole === 'admin' });
        await userRef.set({ role: newRole }, { merge: true });

        // Revalidate the path to ensure the UI updates everywhere
        revalidatePath(`/dashboard/users`);

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update user role:", error);
        return { success: false, error: error.message };
    }
}
