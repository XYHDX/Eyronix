import { useState, useEffect } from 'react';
import { mockDb } from '@/lib/mock-db';

// Mock implementation of useCollection
export function useCollection(collectionNameOrQuery: any, options?: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let name = '';

    if (typeof collectionNameOrQuery === 'string') {
      name = collectionNameOrQuery;
    } else if (collectionNameOrQuery === null) {
      setData([]);
      setLoading(false);
      return;
    }

    const fetchData = () => {
      let mockData: any[] = [];
      switch (name) {
        case 'users':
          mockData = mockDb.users;
          break;
        case 'products':
          mockData = mockDb.products;
          break;
        case 'services':
          mockData = mockDb.services;
          break;
        case 'survey-requests':
          mockData = mockDb.requests;
          break;
        case 'pricing':
          mockData = mockDb.pricing;
          break;
        default:
          mockData = [];
      }
      setData([...mockData]); // Spread to ensure new reference
      setLoading(false);
    };

    // Initial fetch
    fetchData();

    // Subscribe to changes
    const unsubscribe = mockDb.subscribe(() => {
      fetchData();
    });

    return () => unsubscribe();
  }, [collectionNameOrQuery]);

  return {
    data,
    loading: false,
    isLoading: loading,
    error: null,
    snapshot: null
  };
}