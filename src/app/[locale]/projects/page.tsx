'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Server, ShieldCheck, Zap, Activity, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Project } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectsPage() {
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProjects(data || []);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    // Helper to get icon based on title or description (mocking logic since we don't store icon)
    const getIcon = (project: Project) => {
        const text = (project.title + project.description).toLowerCase();
        if (text.includes('solar') || text.includes('power')) return Zap;
        if (text.includes('server') || text.includes('data')) return Server;
        if (text.includes('traffic') || text.includes('road')) return Activity;
        return ShieldCheck;
    };

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
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <Card key={i} className="overflow-hidden border-slate-800 bg-card">
                                        <div className="h-64 w-full bg-muted animate-pulse" />
                                        <CardHeader>
                                            <Skeleton className="h-8 w-3/4 mb-2" />
                                        </CardHeader>
                                        <CardContent>
                                            <Skeleton className="h-4 w-full mb-2" />
                                            <Skeleton className="h-4 w-5/6 mb-6" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </CardContent>
                                    </Card>
                                ))
                            ) : projects.length > 0 ? (
                                projects.map((project, idx) => {
                                    const Icon = getIcon(project);
                                    return (
                                        <Card key={idx} className="overflow-hidden border-slate-800 bg-card hover:shadow-xl transition-all duration-300 group">
                                            <div className="relative h-64 w-full overflow-hidden">
                                                {project.image_url ? (
                                                    <Image
                                                        src={project.image_url}
                                                        alt={project.title}
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                                        <ImageIcon className="w-12 h-12" />
                                                    </div>
                                                )}
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
                                                    {project.stats && project.stats.map((stat, i) => (
                                                        <div key={i} className="flex items-center text-sm font-medium text-slate-400">
                                                            <ShieldCheck className="w-4 h-4 mr-2 text-dahua-red" />
                                                            {stat}
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            ) : (
                                <div className="col-span-full text-center py-20 text-muted-foreground">
                                    No projects found.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
