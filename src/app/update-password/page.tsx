'use client';

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
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSessionValid, setIsSessionValid] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsSessionValid(true);
            }
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
                setIsSessionValid(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            toast({
                title: 'Password updated',
                description: 'Your password has been changed successfully. You can now log in.',
            });
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Update password error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Could not update password.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-14rem)] py-12 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className='mx-auto mb-2'>
                        <Image src="/logo.png" alt="Eyronix Logo" width={48} height={48} />
                    </div>
                    <CardTitle className="text-3xl font-headline">New Password</CardTitle>
                    <CardDescription>
                        Enter your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isSessionValid ? (
                        <div className="text-center py-4">Verifying reset link...</div>
                    ) : (
                        <form className="space-y-4" onSubmit={handleUpdatePassword}>
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        className="pl-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Updating Password...' : 'Update Password'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
