
'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

export default function MakeMeAdminPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [status, setStatus] = useState('');

    const handleMakeAdmin = async () => {
        if (!user || !firestore) {
            setStatus('Not logged in or firestore not ready');
            return;
        }

        try {
            setStatus('Updating role...');
            // We exploit the loose rules: users can update their own doc
            const userRef = doc(firestore, 'users', user.uid);
            await setDoc(userRef, { role: 'admin' }, { merge: true });
            setStatus('Success! You are now an admin (in Firestore). Please refresh.');
        } catch (e: any) {
            console.error(e);
            setStatus('Error: ' + e.message);
        }
    };

    return (
        <div className="p-10 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold">Emergency Admin Fix</h1>
            <p>Current User: {user?.email || 'None'}</p>
            <Button onClick={handleMakeAdmin}>Make Me Admin</Button>
            <p>{status}</p>
        </div>
    );
}
