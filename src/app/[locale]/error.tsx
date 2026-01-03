'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    React.useEffect(() => {
        console.error('SEGMENT ERROR CAUGHT:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
            <h2 className="text-2xl font-bold">Something went wrong!</h2>
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg max-w-lg w-full">
                <p className="font-mono text-sm text-red-600 dark:text-red-400 break-words">{error.message}</p>
            </div>
            <Button onClick={() => reset()}>Try again</Button>
        </div>
    );
}
