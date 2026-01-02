
'use client';

import {
  doc,
  setDoc,
  serverTimestamp,
  type Firestore,
  getDoc,
  collection,
  getDocs,
  limit,
  query,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { setAdminRole } from '@/app/actions';

/**
 * Creates or updates a user's profile document in Firestore.
 * This function is designed to be idempotent and can be called
 * on user creation or when updating profile information.
 * @param firestore - The Firestore instance.
 * @param user - The Firebase Auth user object, can be partial for updates.
 */
export async function updateUserProfile(firestore: Firestore, user: Partial<User>) {
  if (!user || !user.uid) {
    console.error("updateUserProfile called with invalid user object");
    return;
  };

  const userDocRef = doc(firestore, 'users', user.uid);

  try {
    const docSnap = await getDoc(userDocRef);
    const isNewUser = !docSnap.exists();

    const userData: {
      uid: string;
      email?: string | null;
      displayName?: string | null;
      photoURL?: string | null;
      lastUpdatedAt: any; // serverTimestamp return type is opaque
      createdAt?: any;
      role?: string;
    } = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastUpdatedAt: serverTimestamp(),
    };

    if (isNewUser) {
      // do not set role here, security rules likely block it. 
      // Roles should be managed by server actions or cloud functions.
      userData.createdAt = serverTimestamp();
    }

    // Await the Firestore write operation to ensure it completes before proceeding.
    await setDoc(userDocRef, userData, { merge: true });



  } catch (error) {
    console.error("Error in updateUserProfile logic:", error);
    const permissionError = new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'write',
      requestResourceData: { uid: user.uid },
    });
    errorEmitter.emit('permission-error', permissionError);
    // Re-throw the error so the calling function knows something went wrong.
    throw error;
  }
}
