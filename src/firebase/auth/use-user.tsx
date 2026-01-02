
'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export interface UserWithAdmin extends User {
  isAdmin?: boolean;
  role?: string;
  photoURL?: string | null;
  displayName?: string | null;
}

export interface UseUserResult {
  user: UserWithAdmin | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<UserWithAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function getUserProfile(sessionUser: User | null) {
      if (!sessionUser) {
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch role from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, avatar_url')
          .eq('id', sessionUser.id)
          .single();

        const role = profile?.role || 'user';
        const isUserAdmin = role === 'admin';

        if (mounted) {
          setUser({
            ...sessionUser,
            isAdmin: isUserAdmin,
            role: role,
            displayName: profile?.full_name || sessionUser.email?.split('@')[0],
            photoURL: profile?.avatar_url
          });
          setIsAdmin(isUserAdmin);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      getUserProfile(session?.user ?? null);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      getUserProfile(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    error: null,
    isAdmin
  };
}
