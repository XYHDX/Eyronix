import { useState, useEffect } from 'react';
import { FirestoreError } from 'firebase/firestore';
import { supabase } from '@/lib/supabase/client';

export interface UseCollectionResult<T> {
  data: T[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * Supabase implementation of useCollection.
 * Accepts a table name string.
 */
export function useCollection<T = any>(
  tableName: any,
): UseCollectionResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!tableName || typeof tableName !== 'string') {
      setData(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);

    async function fetchData() {
      try {
        const { data: results, error } = await supabase
          .from(tableName)
          .select('*');

        if (error) throw error;
        if (mounted) setData(results as T[]);
      } catch (err: any) {
        console.error(`Error fetching ${tableName}:`, err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchData();

    // Realtime Subscription
    const channel = supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        // Simplest strategy: refetch on any change. 
        // Could optimize to merge payload.new/old but fetching is safer for consistency.
        fetchData();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [tableName]);

  return { data, isLoading, error };
}