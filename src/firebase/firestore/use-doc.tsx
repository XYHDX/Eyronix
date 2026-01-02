
'use client';

import { useState, useEffect } from 'react';
import { FirestoreError } from 'firebase/firestore';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

const MOCK_SETTINGS = {
  id: 'footer',
  phoneNumber: '+963 933 123 456',
  email: 'info@eyronix.sy',
  address: 'Damascus, Syria',
  facebookUrl: 'https://facebook.com/eyronix',
  twitterUrl: 'https://twitter.com/eyronix',
  instagramUrl: 'https://instagram.com/eyronix',
  termsUrl: '/terms',
  privacyUrl: '/privacy'
};

/**
 * Mock implementation of useDoc.
 * Accepts a string key instead of a DocumentReference.
 */
export function useDoc<T = any>(
  docKey: any,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!docKey || typeof docKey !== 'string') {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(() => {
      if (docKey === 'settings/footer') {
        setData(MOCK_SETTINGS as unknown as WithId<T>);
      } else {
        setData(null);
      }
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [docKey]);

  return { data, isLoading, error };
}