import { cookies } from 'next/headers';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Sun, Server, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Header from '@/components/header';
import Footer from '@/components/footer';
import GovLoginForm from './gov-login-form';

export default function GovernmentPage() {
    const cookieStore = cookies();
    const hasAccess = cookieStore.get('gov_access')?.value === 'true';

    if (!hasAccess) {
        return <GovLoginForm />;
    }

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
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 bg-green-100 p-1 rounded-full"><ChevronRight className="w-5 h-5 text-green-700" /></div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Automated Fine Collection</h3>
                                            <p className="text-slate-600">ANPR systems linked to municipal databases for automatic violation processing.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 bg-green-100 p-1 rounded-full"><ChevronRight className="w-5 h-5 text-green-700" /></div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Zero-Electricity Checkpoints</h3>
                                            <p className="text-slate-600">Solar-powered gantries that operate 24/7 without grid dependency.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 bg-green-100 p-1 rounded-full"><ChevronRight className="w-5 h-5 text-green-700" /></div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Flow Optimization</h3>
                                            <p className="text-slate-600">AI analytics to reduce congestion and improve emergency response times.</p>
                                        </div>
                                    </li>
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
                                    <Card>
                                        <CardContent className="p-6 flex flex-col items-center text-center">
                                            <Sun className="w-10 h-10 text-orange-500 mb-3" />
                                            <h3 className="font-bold">Solar Powered</h3>
                                            <p className="text-sm text-muted-foreground">Self-sustaining power management.</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-6 flex flex-col items-center text-center">
                                            <Server className="w-10 h-10 text-blue-500 mb-3" />
                                            <h3 className="font-bold">4G/LT Connectivity</h3>
                                            <p className="text-sm text-muted-foreground">Instant deployment without cables.</p>
                                        </CardContent>
                                    </Card>
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
