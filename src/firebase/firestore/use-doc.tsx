'use client';

import { useState, useEffect } from 'react';
import { FirestoreError } from 'firebase/firestore';
import { supabase } from '@/lib/supabase/client';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * Supabase implementation of useDoc.
 * Accepts a doc key string like 'settings/footer'.
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

    let mounted = true;
    setIsLoading(true);

    async function fetchDoc() {
      try {
        if (docKey === 'settings/footer') {
          const { data: item, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 'footer')
            .single();

          if (error && error.code !== 'PGRST116') throw error; // PGRST116 is Row not found
          if (mounted) setData(item as WithId<T>);
        } else {
          if (mounted) setData(null);
        }
      } catch (err: any) {
        console.error(`Error fetching doc ${docKey}:`, err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchDoc();

    // Realtime not critical for settings but good to have
    // Assuming 'settings' table changes
    const channel = supabase
      .channel(`public:settings:${docKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        fetchDoc();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [docKey]);

  return { data, isLoading, error };
}