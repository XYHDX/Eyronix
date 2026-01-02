
'use client';

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { mockDb } from '@/lib/mock-db';

// Mock User Interface resembling Firebase User
export interface UserWithAdmin extends Partial<User> {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin?: boolean;
  photoURL?: string | null;
}

export interface UseUserResult {
  user: UserWithAdmin | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
}

export function useUser(): UseUserResult {
  // HARDCODED MOCK USER
  const mockUser: UserWithAdmin = {
    uid: 'mock-admin-uid-123',
    email: 'admin@gmail.com',
    displayName: 'Mock Admin',
    photoURL: null,
    isAdmin: true, // Force Admin
  };

  // Simulate a short loading delay for realism (optional, can be 0)
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserWithAdmin | null>(null);

  useEffect(() => {
    // Initial fetch
    setUser(mockDb.currentUser);
    setLoading(false);

    // Subscribe to changes
    const unsubscribe = mockDb.subscribe(() => {
      setUser(mockDb.currentUser);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    error: null,
    isAdmin: user?.isAdmin || false
  };
}
