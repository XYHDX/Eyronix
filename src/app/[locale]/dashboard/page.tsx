'use client';

import * as React from 'react';
import { Loader } from 'lucide-react';
import AdminDashboard from '@/components/admin-dashboard';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Layout handles redirect, but just in case
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        setIsAdmin(profile?.role === 'admin');
      } catch (e) {
        console.error("Dashboard check error", e);
      } finally {
        setLoading(false);
      }
    };
    checkRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return null;
}
