
'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { Loader } from 'lucide-react';
import AdminDashboard from '@/components/admin-dashboard';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading, isAdmin } = useUser();
  const router = useRouter();

  // The layout now handles all redirection logic.
  // This page just needs to decide what to render based on the final state.
  // The layout now handles all redirection logic based on permissions.
  // We just wait for auth to load.
  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login-required');
    }
  }, [user, loading, router]);


  // While loading, show a spinner. This prevents a flash of incorrect content.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // After loading, if the user is an admin, show the full admin dashboard.
  // If not, the useEffect above will have already initiated a redirect to their profile,
  // so we can just return null here to avoid rendering anything for a split second.
  if (isAdmin) {
    return <AdminDashboard />;
  }

  return null;
}
