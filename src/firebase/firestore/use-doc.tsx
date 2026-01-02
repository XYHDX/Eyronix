
'use client';

import { useState, useEffect } from 'react';
import { FirestoreError } from 'firebase/firestore';

import { mockDb } from '@/lib/mock-db';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

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

    // Initial Fetch
    if (docKey === 'settings/footer') {
      const settingsWithId = { ...mockDb.settings, id: 'footer' };
      setData(settingsWithId as unknown as WithId<T>);
    } else {
      setData(null);
    }
    setIsLoading(false);

    // Subscribe
    const unsubscribe = mockDb.subscribe(() => {
      if (docKey === 'settings/footer') {
        const settingsWithId = { ...mockDb.settings, id: 'footer' };
        setData(settingsWithId as unknown as WithId<T>);
      }
    });

    return () => unsubscribe();
  }, [docKey]);

  return { data, isLoading, error };
}