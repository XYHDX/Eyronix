
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import { hasPermission } from '@/lib/permissions';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = React.useState<any>(null);
  const [role, setRole] = React.useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/login-required');
          return;
        }

        setUser(session.user);

        // Fetch usage role from public.profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const userRole = profile?.role || 'user';
        setRole(userRole);

        // Check permissions
        // Remove locale prefix (e.g., /en, /ar) to check against permissions which are defined as /dashboard/...
        const cleanPathname = pathname.replace(/^\/(?:en|ar)/, '') || '/';
        const hasAccess = hasPermission(userRole, cleanPathname);

        if (!hasAccess) {
          if (userRole === 'admin') {
            router.replace('/dashboard/users');
          } else {
            router.replace('/dashboard/profile');
          }
        }

      } catch (error) {
        console.error("Auth check failed", error);
        router.replace('/login-required');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login-required');
      }
    });

    return () => subscription.unsubscribe();

  }, [pathname, router]);

  // While auth state is loading, show a full-screen spinner.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is done and we have no user (redirect happening), return null
  if (!user) {
    return null;
  }

  // The main layout for the dashboard.
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <div className="flex flex-1">
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
