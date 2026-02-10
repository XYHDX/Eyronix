'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { verifyGovAccess } from './actions';

export default function GovLoginForm() {
    const [accessCode, setAccessCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await verifyGovAccess(accessCode);

            if (result.success) {
                toast({ title: "Access Granted", description: "Welcome to the Strategic Infrastructure Portal." });
                router.refresh(); // Refresh to trigger server component re-render with new cookie
            } else {
                toast({ variant: "destructive", title: "Access Denied", description: result.message || "Invalid code." });
            }
        } catch (error) {
            console.error("Login error:", error);
            toast({ variant: "destructive", title: "Error", description: "An error occurred during verification." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="flex flex-col items-center">
                    <ShieldCheck className="w-16 h-16 text-dahua-red mb-4" />
                    <h1 className="text-3xl font-bold tracking-tight">Restricted Access</h1>
                    <p className="text-slate-400 mt-2">Strategic Infrastructure Solutions Portal</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        type="password"
                        placeholder="Enter Clearance Code"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                        disabled={isLoading}
                    />
                    <Button type="submit" className="w-full bg-dahua-red hover:bg-red-700" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify Credentials'}
                    </Button>
                </form>
                <p className="text-xs text-slate-600">Authorized Personnel Only. All access is logged.</p>
            </div>
        </div>
    );
}
