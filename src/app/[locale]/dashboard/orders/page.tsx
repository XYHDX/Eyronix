'use client';

import * as React from 'react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Filter } from 'lucide-react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

type Sale = {
    id: string;
    created_at: string;
    user_id: string;
    item_details: any;
    type: string;
    amount: number;
    status: string;
    address?: string;
    phone?: string;
    profiles?: { display_name: string; email: string }; // joined data
};

export default function OrdersPage() {
    const t = useTranslations('OrdersPage');
    const [sales, setSales] = React.useState<Sale[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filterStatus, setFilterStatus] = React.useState<string>('all');
    const { toast } = useToast();

    const fetchOrders = React.useCallback(async () => {
        try {
            setLoading(true);

            // We need to join with profiles to get user info if possible
            // Note: Supabase JS select can join if relationship exists. 
            // Assuming 'sales.user_id' references 'profiles.id'

            let query = supabase
                .from('sales')
                .select(`
                    *,
                    profiles:user_id ( display_name, email )
                `)
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                if (filterStatus === 'pending') {
                    query = query.eq('status', 'Pending Approval');
                } else if (filterStatus === 'active') {
                    query = query.in('status', ['Preparing', 'Shipping']);
                } else if (filterStatus === 'completed') {
                    query = query.eq('status', 'Completed');
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            setSales(data || []);

        } catch (error) {
            console.error('Error fetching admin orders:', error);
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    React.useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('sales')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            toast({ title: t('toasts.statusUpdated'), description: t('toasts.statusUpdatedDesc', { status: newStatus }) });
            fetchOrders();
        } catch (error) {
            console.error("Failed to update status", error);
            toast({ variant: "destructive", title: t('toasts.error'), description: "Failed to update status." });
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending Info':
                return <Badge variant="outline" className="text-gray-500">{t('badges.pendingInfo')}</Badge>;
            case 'Pending Approval':
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">{t('badges.needsApproval')}</Badge>;
            case 'Preparing':
                return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">{t('badges.preparing')}</Badge>;
            case 'Shipping':
                return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">{t('badges.shipping')}</Badge>;
            case 'Completed':
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{t('badges.completed')}</Badge>;
            case 'Rejected':
                return <Badge variant="destructive">{t('badges.rejected')}</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                    <Tabs defaultValue="all" onValueChange={setFilterStatus} className="w-[400px]">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
                            <TabsTrigger value="pending">{t('tabs.pending')}</TabsTrigger>
                            <TabsTrigger value="active">{t('tabs.active')}</TabsTrigger>
                            <TabsTrigger value="completed">{t('tabs.done')}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('table.date')}</TableHead>
                            <TableHead>{t('table.customer')}</TableHead>
                            <TableHead>{t('table.details')}</TableHead>
                            <TableHead>{t('table.amount')}</TableHead>
                            <TableHead>{t('table.info')}</TableHead>
                            <TableHead>{t('table.status')}</TableHead>
                            <TableHead className="text-right">{t('table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : sales && sales.length > 0 ? (
                            sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="text-xs text-muted-foreground">{format(new Date(sale.created_at), 'MMM dd, HH:mm')}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{sale.profiles?.display_name || t('table.guest')}</span>
                                            <span className="text-xs text-muted-foreground">{sale.profiles?.email || sale.user_id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                        {sale.item_details?.name}
                                    </TableCell>
                                    <TableCell>${sale.amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        {sale.address ? (
                                            <div className="flex flex-col text-xs">
                                                <span>{sale.address}</span>
                                                <span className="text-muted-foreground">{sale.phone}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">{t('table.noDetails')}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(sale.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{t('actions.updateStatus')}</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {sale.status === 'Pending Approval' && (
                                                    <DropdownMenuItem onClick={() => updateStatus(sale.id, 'Preparing')}>
                                                        {t('actions.approvePrepare')}
                                                    </DropdownMenuItem>
                                                )}
                                                {sale.status === 'Preparing' && (
                                                    <DropdownMenuItem onClick={() => updateStatus(sale.id, 'Shipping')}>
                                                        {t('actions.markShipped')}
                                                    </DropdownMenuItem>
                                                )}
                                                {sale.status === 'Shipping' && (
                                                    <DropdownMenuItem onClick={() => updateStatus(sale.id, 'Completed')}>
                                                        {t('actions.markDelivered')}
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600" onClick={() => updateStatus(sale.id, 'Rejected')}>
                                                    {t('actions.reject')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
