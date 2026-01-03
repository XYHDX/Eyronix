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
import { Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            toast({
                title: 'Check your email',
                description: 'We sent you a link to reset your password.',
            });
        } catch (error: any) {
            console.error('Reset password error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Could not send reset email.',
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
                    <CardTitle className="text-3xl font-headline">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleResetPassword}>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                        </Button>
                        <Button variant="ghost" className="w-full" asChild>
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Link>
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
