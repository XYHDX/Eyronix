'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Sale = {
    id: string;
    created_at: string;
    item_details: any; // JSONB
    type: string;
    amount: number;
    status: string;
    address?: string;
    phone?: string;
};

const checkoutSchema = z.object({
    address: z.string().min(5, "Address must be at least 5 characters."),
    phone: z.string().min(8, "Phone number must be at least 8 characters."),
})

function CompleteOrderDialog({ orderId, onSuccess }: { orderId: string, onSuccess: () => void }) {
    const t = useTranslations('MyOrdersPage');
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof checkoutSchema>>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            address: "",
            phone: "",
        },
    })

    async function onSubmit(values: z.infer<typeof checkoutSchema>) {
        try {
            const { error, count } = await supabase
                .from('sales')
                .update({
                    address: values.address,
                    phone: values.phone,
                    status: 'Pending Approval'
                }, { count: 'exact' })
                .eq('id', orderId);

            if (count === 0) throw new Error("Access denied");

            if (error) throw error;

            toast({ title: t('toasts.orderUpdated'), description: t('toasts.orderUpdatedDesc') });
            setOpen(false);
            onSuccess();
        } catch (error: any) {
            console.error("Failed to update order", error);
            toast({ variant: "destructive", title: t('toasts.error'), description: error.message || t('toasts.submitError') });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="default" className="bg-red-600 hover:bg-red-700 text-white animate-pulse">
                    {t('completeOrderDialog.trigger')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('completeOrderDialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('completeOrderDialog.desc')}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('completeOrderDialog.address')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main St, City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('completeOrderDialog.phone')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+963 9..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">{t('completeOrderDialog.submit')}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function MyOrdersPage() {
    const t = useTranslations('MyOrdersPage');
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setSales([]);
                return;
            }

            const { data, error } = await supabase
                .from('sales')
                .select('*')
                .eq('user_id', user.id)
                .neq('status', 'Cancelled')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSales(data || []);

        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCancelOrder = async (sale: Sale) => {
        try {
            // Restore stock for product
            if (sale.type === 'product' && sale.item_details?.id) {
                const { data: product } = await supabase
                    .from('products')
                    .select('stock')
                    .eq('id', sale.item_details.id)
                    .single();

                if (product) {
                    await supabase
                        .from('products')
                        .update({ stock: product.stock + 1 })
                        .eq('id', sale.item_details.id);
                }
            }

            // Update sale status to Cancelled first (to ensure it's hidden if delete is soft/fails)
            const { error: updateError, count: updateCount } = await supabase
                .from('sales')
                .update({ status: 'Cancelled' }, { count: 'exact' })
                .eq('id', sale.id);

            if (updateError) throw updateError;

            // If update didn't affect any rows, it means RLS is hiding it or it doesn't exist
            if (updateCount === 0) {
                throw new Error("Access denied: Unable to update this order.");
            }

            // Try to hard delete
            const { error: deleteError, count: deleteCount } = await supabase
                .from('sales')
                .delete({ count: 'exact' })
                .eq('id', sale.id);

            // If delete fails, we just log it, but the order is hidden thanks to status update
            if (deleteError) {
                console.warn("Soft delete fallback: Could not hard delete order", deleteError);
            } else if (deleteCount === 0) {
                console.warn("Soft delete fallback: Delete count was 0 (RLS restricted hard delete)");
            }

            toast({ title: t('toasts.cancelled'), description: t('toasts.cancelledDesc') });
            fetchOrders();

        } catch (error: any) {
            console.error("Failed to cancel order", error);
            toast({ variant: "destructive", title: t('toasts.error'), description: error.message || t('toasts.cancelError') });
        }
    };

    React.useEffect(() => {
        fetchOrders();

        // Update last viewed timestamp in local storage
        const now = new Date().toISOString();
        localStorage.setItem('lastViewedOrders', now);
        // Dispatch custom event to update header immediately
        window.dispatchEvent(new Event('orders-viewed'));

        const channel = supabase
            .channel('my-orders-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [fetchOrders]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending Info':
                return <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">{t('status.pendingInfo')}</Badge>;
            case 'Pending Approval':
                return <Badge variant="outline" className="border-yellow-200 text-yellow-700 bg-yellow-50">{t('status.pendingApproval')}</Badge>;
            case 'Preparing':
                return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">{t('status.preparing')}</Badge>;
            case 'Shipping':
                return <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">{t('status.shipping')}</Badge>;
            case 'Completed':
                return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">{t('status.completed')}</Badge>;
            case 'Rejected':
                return <Badge variant="destructive">{t('status.rejected')}</Badge>;
            case 'Cancelled':
                return <Badge variant="outline" className="text-gray-500 border-gray-300">{t('status.cancelled')}</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('table.date')}</TableHead>
                            <TableHead>{t('table.item')}</TableHead>
                            <TableHead>{t('table.type')}</TableHead>
                            <TableHead>{t('table.amount')}</TableHead>
                            <TableHead>{t('table.status')}</TableHead>
                            <TableHead className="text-right">{t('table.action')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : sales && sales.length > 0 ? (
                            sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell>{format(new Date(sale.created_at), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell className="font-medium">
                                        {sale.item_details?.name || t('table.unknownItem')}
                                    </TableCell>
                                    <TableCell className="capitalize">{sale.type}</TableCell>
                                    <TableCell>${sale.amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        {getStatusBadge(sale.status)}
                                    </TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        {sale.status === 'Pending Info' && (
                                            <CompleteOrderDialog orderId={sale.id} onSuccess={fetchOrders} />
                                        )}
                                        {['Pending Info', 'Pending Approval'].includes(sale.status) && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                        {t('cancelDialog.trigger')}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('cancelDialog.title')}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {t('cancelDialog.desc')}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('cancelDialog.keep')}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleCancelOrder(sale)} className="bg-red-600 hover:bg-red-700">
                                                            {t('cancelDialog.confirm')}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    {t('table.noOrders')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
