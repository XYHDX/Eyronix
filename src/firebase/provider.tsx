
'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Mock Context State
export interface FirebaseContextState {
  firebaseApp: any;
  firestore: any;
  auth: any;
  storage: any;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp?: any;
  firestore?: any;
  auth?: any;
  storage?: any;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  // Mock values to prevent crashes if something tries to use them
  const contextValue = {
    firebaseApp: {},
    firestore: {},
    auth: {},
    storage: {}
  };

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  // Return empty context if undefined to handle edge cases
  if (context === undefined) {
    return { firebaseApp: {}, firestore: {}, auth: {}, storage: {} };
  }
  return context;
};

export const useAuth = () => {
  return null;
};

export const useFirestore = () => {
  return null;
};

export const useStorage = () => {
  return null;
};

export const useFirebaseApp = () => {
  return null;
};

// Re-export hook for convenience
export { useUser } from './auth/use-user';

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  // Simple pass-through for mock
  return factory();
}
