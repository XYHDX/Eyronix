const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBjh8onejfBsBvBbo5n4iDz3441B6nbKcw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-311736958-6b4c5.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-311736958-6b4c5",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-311736958-6b4c5.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "51793661969",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:51793661969:web:1a1d7332c611dae095a1b0",
  measurementId: ""
};

// Basic validation
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
for (const key of requiredKeys) {
  if (!config[key as keyof typeof config]) {
    console.warn(`[Firebase Config] Missing value for ${key}. Functionality may be limited.`);
  }
}

export const firebaseConfig = config;
