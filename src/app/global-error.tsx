'use client';

import * as React from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    React.useEffect(() => {
        console.error('GLOBAL ERROR CAUGHT:', error);
    }, [error]);

    return (
        <html>
            <body className="bg-background text-foreground min-h-screen flex flex-col items-center justify-center p-4">
                <div className="max-w-md space-y-4 text-center">
                    <h1 className="text-4xl font-bold">Something went wrong!</h1>
                    <div className="p-4 bg-muted rounded-lg text-left overflow-auto max-h-[300px]">
                        <p className="font-mono text-sm text-red-500 break-words">{error.message}</p>
                        {error.message.includes('Supabase') && (
                            <div className="mt-4 p-2 bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-sm">
                                <p className="font-semibold">Troubleshooting:</p>
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li>Check if your <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code> is correct.</li>
                                    <li>It should be a JWT (starts with <code>eyJ...</code>), not a publishable key.</li>
                                </ul>
                            </div>
                        )}
                        {error.digest && <p className="text-xs text-muted-foreground mt-2">Digest: {error.digest}</p>}
                    </div>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
