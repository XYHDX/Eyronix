
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="48px"
      height="48px"
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.655-3.373-11.26-7.96l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

export default function SignupPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (error) throw error;

      if (data.session) {
        // Auto-login active
        toast({ title: t('accountCreated'), description: t('welcomeMessage') });
        router.push('/dashboard');
      } else if (data.user) {
        // Email confirmation required
        toast({
          title: t('checkEmail'),
          description: t('checkSpam'),
          duration: 10000
        });
        // Optional: Redirect to a "Verify Email" page or just Login
        router.push('/login');
      }

    } catch (error: any) {
      console.error('Email sign-up error:', error);
      toast({ variant: 'destructive', title: t('signUpFailed'), description: error.message || t('couldNotCreate') });
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSigningUp(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      console.error('Google sign-up error', e);
      toast({ variant: 'destructive', title: t('googleFailed') });
      setIsSigningUp(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-14rem)] py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className='mx-auto mb-2'>
            <Image src="/logo.png" alt="Eyronix Logo" width={48} height={48} />
          </div>
          <CardTitle className="text-3xl font-headline">{t('createAccount')}</CardTitle>
          <CardDescription>
            {t('joinEyronix')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleEmailSignUp}>
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName')}</Label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder={t('namePlaceholder')} required className="ps-10" value={name} onChange={(e) => setName(e.target.value)} disabled={isSigningUp} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder={t('emailPlaceholder')} required className="ps-10" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSigningUp} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" required className="ps-10" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSigningUp} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSigningUp}>
              {isSigningUp ? t('signingUp') : t('signUp')}
            </Button>
            <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn} disabled={isSigningUp}>
              <GoogleIcon className="me-2 h-4 w-4" />
              {t('googleSignUp')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t('hasAccount')}{' '}
            <Link href="/login" className="underline">
              {t('signIn')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
