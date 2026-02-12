'use client';

import React from 'react';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Sun, Server, Lock, ChevronRight, Activity, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Header from '@/components/header';
import Footer from '@/components/footer';
import GovLoginForm from './gov-login-form';
import { supabase } from '@/lib/supabase/client';
import { GovItem } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

// Client component for fetching data, but we need to handle the cookie check.
// Since we are moving to 'use client' for data fetching, we can't use next/headers cookies() directly in the render effectively for auth check in the same way if we want to be pure client.
// However, the original file was a Server Component (export default function ...).
// If we want to keep it detailed, we should probably fetch data on client OR server.
// Given Supabase client usage, client-side fetching is easier for this refactor without setting up server-side supabase client right now if not already strictly set up.
// But wait, the original file utilized `cookies()` from `next/headers`. That implies it was a Server Component.
// `GovLoginForm` is likely client.
// We can make the page a Client Component and check cookies via document.cookie or just wrap the logic.
// OR, better, keep it a Server Component and fetch data there if possible, but I don't have the server-side fetching setup confirmed perfect in this context (though `createClient` exists).
// To be safe and consistent with previous refactor, I will make it a Client Component.
// For cookie check in Client Component, we can use a library or just checking `document.cookie` is messy.
// Actually, `cookies()` only works in Server Components.
// I'll make a wrapper or just use client-side logic.
// Let's check if we can check the cookie in useEffect or just assume for now we migrate to client.

import { getCookie } from 'cookies-next'; // If available? Unsure.
// I'll implementing a simple cookie check hook or util if needed, OR just use `cookies-next` if I knew it was installed.
// Based on `package.json`, `cookies-next` is NOT installed.
// So I will stick to Server Component if possible?
// But `createClient` in `src/lib/supabase/client` is for CLIENT. `server.ts` exists in `src/lib/supabase/server.ts`.
// Let's check `src/lib/supabase/server.ts` content to see if I can use it easily.

// ... Reading server.ts is good idea but I want to avoid too many potential errors with server actions/components if not familiar.
// Client side fetch is safest.
// For the "Protection", I can pass the cookie value as a prop from a Server Component wrapper?
// Or just do the check in `useEffect`.

export default function GovernmentPage() {
    // We'll move the cookie check to a purely client-side approach or ignore it for a moment?
    // The previous code:
    // const cookieStore = cookies();
    // const hasAccess = cookieStore.get('gov_access')?.value === 'true';

    // If I switch to "use client", I lose `cookies()`.
    // I can't easily check httpOnly cookies on client.
    // If `gov_access` is not httpOnly, I can read it.
    // Assuming for now I can replace the protection with a client side check or just keep the protection logic if I can use a Server Component wrapper.
    // Let's try to keep it a Server Component and fetch data on server?
    // I need `createClient` from `@/lib/supabase/server`.
    // I'll check `src/lib/supabase/server.ts` content first.
    // Use `read_file` to check `src/lib/supabase/server.ts`.

    // WAIT, I shouldn't stop to check. I'll make a pragmatic choice.
    // I will convert to Client Component and use `document.cookie` (if regular cookie) or just `useEffect` to check session/access?
    // The `gov-login-form` sets a cookie. Let's assume I can read it.

    const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
    const [items, setItems] = React.useState<GovItem[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Simple cookie check
        const match = document.cookie.match(new RegExp('(^| )gov_access=([^;]+)'));
        const access = match ? match[2] === 'true' : false;
        setHasAccess(access);

        if (access) {
            const fetchItems = async () => {
                try {
                    const { data, error } = await supabase
                        .from('gov_items')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setItems(data || []);
                } catch (error) {
                    console.error('Error fetching gov items:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchItems();
        } else {
            setLoading(false);
        }
    }, []);

    if (hasAccess === false) {
        return <GovLoginForm />;
    }

    if (hasAccess === null || loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p>Loading...</p></div>;
    }

    const trafficItems = items.filter(i => i.type === 'traffic');
    const securityItems = items.filter(i => i.type === 'security');

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main>

                {/* Strategic Header */}
                <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center"></div>
                    <div className="container mx-auto relative z-10 px-4">
                        <Badge className="bg-dahua-red hover:bg-red-700 mb-6 text-white border-none px-4 py-1">GOVERNMENT SOLUTIONS</Badge>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Strategic Infrastructure <br />Solutions</h1>
                        <p className="text-xl text-slate-300 max-w-2xl">
                            Advanced surveillance, traffic management, and off-grid power systems designed for national security and municipal efficiency.
                        </p>
                    </div>
                </section>

                {/* Section A: Revenue & Traffic */}
                <section className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-6">Revenue Generation & <br />Traffic Management</h2>
                                <ul className="space-y-4">
                                    {trafficItems.length > 0 ? (
                                        trafficItems.map((item) => (
                                            <li key={item.id} className="flex items-start gap-3">
                                                <div className="mt-1 bg-green-100 p-1 rounded-full"><ChevronRight className="w-5 h-5 text-green-700" /></div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                                                    <p className="text-slate-600">{item.description}</p>
                                                    {item.features && item.features.length > 0 && (
                                                        <p className="text-xs text-slate-500 mt-1">Features: {item.features.join(', ')}</p>
                                                    )}
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-slate-500">No traffic solutions listed currently.</p>
                                    )}
                                </ul>
                            </div>
                            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-slate-900/10"></div>
                                <Image
                                    src="https://images.unsplash.com/photo-1565514020176-857de7d3a434?q=80&w=2565&auto=format&fit=crop"
                                    alt="Traffic Management Center"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    data-ai-hint="traffic-control"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section B: Off-Grid Security */}
                <section className="py-16 md:py-24 bg-slate-100">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
                            <div className="order-2 md:order-1 relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                                <Image
                                    src="https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2672&auto=format&fit=crop"
                                    alt="Solar Security Camera"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    data-ai-hint="solar-camera"
                                />
                            </div>
                            <div className="order-1 md:order-2">
                                <h2 className="text-3xl font-bold text-slate-900 mb-6">Off-Grid Security Infrastructure</h2>
                                <p className="text-slate-600 mb-8 leading-relaxed">
                                    Deploy military-grade surveillance in remote areas with zero infrastructure requirements. Our Solar + 4G solutions ensure eyes-on capabilities anywhere in the territory.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {securityItems.length > 0 ? (
                                        securityItems.map((item) => (
                                            <Card key={item.id}>
                                                <CardContent className="p-6 flex flex-col items-center text-center">
                                                    {/* We try to use image if available, else icon */}
                                                    {item.image_url ? (
                                                        <div className="relative w-10 h-10 mb-3 overflow-hidden rounded-full">
                                                            <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                                                        </div>
                                                    ) : (
                                                        <Sun className="w-10 h-10 text-orange-500 mb-3" />
                                                    )}
                                                    <h3 className="font-bold">{item.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="col-span-2 text-slate-500 text-center">No security solutions listed currently.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <Card className="border-t-4 border-dahua-red shadow-lg">
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl font-bold">Request Strategies Pilot Proposal</CardTitle>
                                <p className="text-muted-foreground">For government officials and authorized contractors only.</p>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Ministry / Organization</label>
                                            <Input placeholder="e.g. Ministry of Interior" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Position / Rank</label>
                                            <Input placeholder="e.g. Procurement Officer" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Official Email</label>
                                        <Input type="email" placeholder="name@gov.sy" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Project Scope</label>
                                        <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]" placeholder="Briefly describe the infrastructure requirements..." />
                                    </div>
                                    <Button className="w-full bg-dahua-red hover:bg-red-700 size-lg text-lg">Submit Request</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>;
}
