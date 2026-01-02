
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, LayoutDashboard, Moon, Sun, User, Wrench, Package, DollarSign, Mail, Users, Settings, ShoppingBag, Activity } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from './ui/dropdown-menu';
import { getInitials } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { hasPermission } from '@/lib/permissions';
import { supabase } from '@/lib/supabase/client';


export default function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setTheme, theme } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);

  // Auth Status Subscription
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          // Check admin status
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          setIsAdmin(profile?.role === 'admin');
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Header Auth Check Error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Re-check admin on auth change if needed, or rely on initial check + session persistence
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setIsAdmin(profile?.role === 'admin');
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchNotificationStatus = useCallback(async () => {
    if (!user) {
      setPendingCount(0);
      return;
    }

    const { data: orders, error } = await supabase
      .from('sales')
      .select('status, updated_at')
      .eq('user_id', user.id);

    if (error || !orders) {
      console.error('Error fetching orders for notification:', error);
      return;
    }

    const lastViewed = localStorage.getItem('lastViewedOrders');
    const lastViewedDate = lastViewed ? new Date(lastViewed) : new Date(0); // Default to epoch if never viewed

    const hasPendingInfo = orders.some(o => o.status === 'Pending Info');
    const hasNewUpdates = orders.some(o => {
      if (!o.updated_at) return false;
      return new Date(o.updated_at) > lastViewedDate;
    });

    setPendingCount(hasPendingInfo || hasNewUpdates ? 1 : 0);
  }, [user]);

  useEffect(() => {
    fetchNotificationStatus();

    const channel = supabase
      .channel('header-notification')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        fetchNotificationStatus();
      })
      .subscribe();

    const handleOrdersViewed = () => fetchNotificationStatus();
    window.addEventListener('orders-viewed', handleOrdersViewed);
    window.addEventListener('storage', handleOrdersViewed);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('orders-viewed', handleOrdersViewed);
      window.removeEventListener('storage', handleOrdersViewed);
    }
  }, [fetchNotificationStatus]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({ title: "You've been logged out." });
      // Reset state
      setUser(null);
      setIsAdmin(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({ variant: 'destructive', title: 'Logout failed.' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center relative">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Image src="/logo.png" alt="Eyronix Syria Logo" width={32} height={32} />
          <span className="font-bold text-lg font-headline">Eyronix Syria</span>
        </Link>
        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center space-x-6 text-sm font-medium">
          <Link href="/#services" className="transition-colors hover:text-foreground/80 text-foreground/60">Services</Link>
          <Link href="/products" className="transition-colors hover:text-foreground/80 text-foreground/60">Products</Link>
          <Link href="/#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Packages</Link>
          <Link href="/#survey" className="transition-colors hover:text-foreground/80 text-foreground/60">Contact</Link>
        </nav>
        <div className="flex ml-auto items-center justify-end space-x-2">

          {user && (
            <Button variant="ghost" size="icon" asChild className="mr-2 relative">
              <Link href="/dashboard/my-orders">
                <ShoppingBag className="h-5 w-5" />
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-background animate-pulse" />
                )}
                <span className="sr-only">My Orders</span>
              </Link>
            </Button>
          )}

          {loading ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.user_metadata?.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(user.user_metadata?.full_name || user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                {hasPermission(isAdmin ? 'admin' : 'user', '/dashboard') && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Manage</DropdownMenuLabel>

                {hasPermission(isAdmin ? 'admin' : 'user', '/dashboard/settings') && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {hasPermission(isAdmin ? 'admin' : 'user', '/dashboard/users') && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/users">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Users</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {hasPermission(isAdmin ? 'admin' : 'user', '/dashboard/requests') && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/requests">
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Requests</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {hasPermission(isAdmin ? 'admin' : 'user', '/dashboard/services') && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/services">
                      <Wrench className="mr-2 h-4 w-4" />
                      <span>Services</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {hasPermission(isAdmin ? 'admin' : 'user', '/dashboard/products') && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/products">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Products</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {hasPermission(isAdmin ? 'admin' : 'user', '/dashboard/pricing') && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/pricing">
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>Packages</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/dashboard/my-orders">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>My Orders</span>
                  </Link>
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/orders">
                      <Activity className="mr-2 h-4 w-4" />
                      <span>All Orders</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  <span>Toggle Theme</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
