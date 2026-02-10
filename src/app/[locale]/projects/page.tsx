'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Server, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function ProjectsPage() {
    const projects = [
        {
            title: "Damascus Municipal Traffic Control",
            description: "Implemented a city-wide ANPR system reducing traffic violations by 40% in the first quarter.",
            image: "https://images.unsplash.com/photo-1542361345-89e58247f2d1?q=80&w=2070&auto=format&fit=crop",
            stats: ["500+ Cameras", "Real-time Processing", "99.9% Uptime"],
            icon: Activity,
            status: "Operational"
        },
        {
            title: "Solar Border Surveillance Network",
            description: "Autonomous off-grid monitoring solution for 50km of critical border infrastructure.",
            image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2072&auto=format&fit=crop",
            stats: ["Zero Grid Power", "4G LTE Connectivity", "Thermal Imaging"],
            icon: Zap,
            status: "Completed"
        },
        {
            title: "Government Data Center Security",
            description: "Biometric access control and perimeter intrusion detection for the National Data Archive.",
            image: "https://images.unsplash.com/photo-1558494949-efc535b5c4c1?q=80&w=2074&auto=format&fit=crop",
            stats: ["Facial Recognition", "Under-Vehicle Scanning", "Integrated Command Center"],
            icon: Server,
            status: "Operational"
        }
    ];

    return (
        <>
            <Header />
            <main className="flex-grow bg-background min-h-screen">
                <section className="py-16 px-4 md:px-8">
                    <div className="container mx-auto">
                        <div className="text-center mb-16">
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-headline text-foreground">Strategic Projects</h1>
                            <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
                                Showcasing our deployment of advanced security infrastructure across critical sectors in Syria.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {projects.map((project, idx) => {
                                const Icon = project.icon;
                                return (
                                    <Card key={idx} className="overflow-hidden border-slate-800 bg-card hover:shadow-xl transition-all duration-300 group">
                                        <div className="relative h-64 w-full overflow-hidden">
                                            <Image
                                                src={project.image}
                                                alt={project.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute top-4 right-4">
                                                <Badge className={`${project.status === 'Operational' ? 'bg-green-600' : 'bg-blue-600'}`}>
                                                    {project.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardHeader>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 rounded-lg bg-dahua-red/10">
                                                    <Icon className="w-6 h-6 text-dahua-red" />
                                                </div>
                                                <CardTitle className="text-xl font-bold">{project.title}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground mb-6 line-clamp-3">
                                                {project.description}
                                            </p>
                                            <div className="space-y-2">
                                                {project.stats.map((stat, i) => (
                                                    <div key={i} className="flex items-center text-sm font-medium text-slate-400">
                                                        <ShieldCheck className="w-4 h-4 mr-2 text-dahua-red" />
                                                        {stat}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
