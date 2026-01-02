
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import { hasPermission } from '@/lib/permissions';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Wait until loading is complete before doing anything.
    if (loading) {
      return;
    }

    // If there's no user, redirect to the login-required page.
    if (!user) {
      router.replace('/login-required');
      return;
    }

    // If the user is loaded, check permissions for the current path
    const role = isAdmin ? 'admin' : 'user';
    const hasAccess = hasPermission(role, pathname);

    if (!hasAccess) {
      // If they don't have access to the *specific* page they are on,
      // redirect them to a safe default.
      if (isAdmin) {
        // Admins should generally have access, but if they hit a weird route, send to users
        router.replace('/dashboard/users');
      } else {
        // Users should go to profile
        router.replace('/dashboard/profile');
      }
    }

  }, [user, loading, isAdmin, pathname, router]);

  // While auth state is loading, show a full-screen spinner.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // After loading, if there's still no user, we render nothing, as the
  // redirect is already in progress.
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
