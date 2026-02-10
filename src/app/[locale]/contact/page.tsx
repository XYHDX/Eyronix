'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import Footer from '@/components/footer';

const formSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email.' }),
    phone: z.string().min(8, { message: 'Please enter a valid phone number.' }),
    message: z.string().min(10, { message: 'Message must be at least 10 characters.' }).max(500),
});

export default function ContactPage() {
    const t = useTranslations('HomePage'); // Reusing existing translations for now
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            message: '',
        },
    });

    async function onSurveySubmit(values: z.infer<typeof formSchema>) {
        try {
            const { error } = await supabase.from('survey_requests').insert([{
                name: values.name,
                email: values.email,
                phone: values.phone,
                message: values.message,
                status: 'New'
            }]);

            if (error) throw error;

            toast({
                title: 'Request Sent!',
                description: "We've received your request and will contact you shortly.",
            });
            form.reset();
        } catch (error) {
            console.error("Survey submission error:", error);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'Could not send your request. Please try again.',
            });
        }
    }

    return (
        <>
            <Header />
            <main className="flex-grow bg-background">
                <section className="py-16 md:py-24">
                    <div className="container mx-auto max-w-3xl px-4">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-headline text-foreground">Contact Us</h1>
                            <p className="text-muted-foreground text-lg">
                                Get in touch with our strategic planning team for your infrastructure needs.
                            </p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSurveySubmit)} className="space-y-6 bg-card p-8 rounded-xl shadow-lg border border-border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formLabels.fullName')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Full Name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('formLabels.email')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="email@agency.gov" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('formLabels.phone')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+963 9XX XXX XXX" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('formLabels.message')}</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Describe your project requirements..." className="min-h-[150px]" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="text-center pt-4">
                                    <Button type="submit" size="lg" className="w-full md:w-auto min-w-[200px] bg-dahua-red hover:bg-red-700" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? t('sending') : t('submitRequest')}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
