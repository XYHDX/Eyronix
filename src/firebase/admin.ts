
import admin from 'firebase-admin';

// Memoization container for the Firebase Admin App instance.
let app: admin.app.App;

/**
 * Returns the memoized Firebase Admin App instance, initializing it if necessary.
 * This prevents re-initialization on every server action or hot-reload.
 */
export function getFirebaseAdminApp(): admin.app.App {
  if (app) {
    return app;
  }

  // Check if the app is already initialized by name to be safe.
  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }

  // Initialize the app with application default credentials.
  try {
    admin.initializeApp({
      projectId: 'studio-311736958-6b4c5',
      credential: admin.credential.applicationDefault(),
    });
  } catch (e: any) {
    if (e.code !== 'app/duplicate-app') {
      console.error('Firebase admin initialization error', e);
    }
  }

  app = admin.app();
  return app;
}

// Initialize the app on module load so that firestore can be exported.
const adminApp = getFirebaseAdminApp();

// Export a memoized firestore instance.
const firestore = admin.firestore(adminApp);

export { admin, firestore };
