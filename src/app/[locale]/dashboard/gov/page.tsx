'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
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
import { PlusCircle, MoreHorizontal, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { GovItem } from '@/types';

const govItemSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    type: z.enum(['traffic', 'security']),
    features: z.string(), // We'll parse comma-separated string
    image: z.instanceof(File).optional().nullable(),
});

function GovItemForm({
    onSuccess,
    item: initialItemData,
}: {
    onSuccess: () => void;
    item?: GovItem;
}) {
    const t = useTranslations('GovPage');
    const { toast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);

    const form = useForm<z.infer<typeof govItemSchema>>({
        resolver: zodResolver(govItemSchema),
        defaultValues: {
            title: initialItemData?.title ?? '',
            description: initialItemData?.description ?? '',
            type: initialItemData?.type ?? 'traffic',
            features: initialItemData?.features?.join(', ') ?? '',
            image: null,
        },
    });

    React.useEffect(() => {
        form.reset({
            title: initialItemData?.title ?? '',
            description: initialItemData?.description ?? '',
            type: initialItemData?.type ?? 'traffic',
            features: initialItemData?.features?.join(', ') ?? '',
            image: null,
        });
    }, [initialItemData, form]);

    async function onSubmit(values: z.infer<typeof govItemSchema>) {
        setIsSaving(true);
        let image_url: string | null = initialItemData?.image_url || null;

        try {
            if (values.image) {
                const fileExt = values.image.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('gov')
                    .upload(filePath, values.image);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('gov')
                    .getPublicUrl(filePath);

                image_url = publicUrl;
            }

            const itemData = {
                title: values.title,
                description: values.description,
                type: values.type,
                features: values.features.split(',').map(s => s.trim()).filter(s => s.length > 0),
                image_url: image_url,
            };

            if (initialItemData) {
                const { error } = await supabase
                    .from('gov_items')
                    .update(itemData)
                    .eq('id', initialItemData.id);
                if (error) throw error;
                toast({ title: t('toasts.updated'), description: t('toasts.updated') });
            } else {
                const { error } = await supabase
                    .from('gov_items')
                    .insert([itemData]);
                if (error) throw error;
                toast({ title: t('toasts.created'), description: t('toasts.created') });
            }

            form.reset();
            onSuccess();
        } catch (error: any) {
            console.error('Error saving gov item:', error);
            toast({ variant: 'destructive', title: t('toasts.error'), description: error.message || 'Failed to save item.' });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <DialogHeader>
                    <DialogTitle>{initialItemData ? t('form.editTitle') : t('form.addTitle')}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {t('form.description')}
                    </p>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('form.title')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('form.titlePlaceholder')} {...field} disabled={isSaving} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('form.desc')}</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="" {...field} disabled={isSaving} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('form.type')}</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isSaving}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('form.selectType')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="traffic">Traffic</SelectItem>
                                        <SelectItem value="security">Security</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="features"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('form.features')}</FormLabel>
                                <FormControl>
                                    <Input placeholder="ANPR, Solar Powered" {...field} disabled={isSaving} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="image"
                        render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                                <FormLabel>{t('form.image')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                        disabled={isSaving}
                                        {...rest}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onSuccess} disabled={isSaving}>
                        {t('form.cancel')}
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? t('form.saving') : (initialItemData ? t('form.saveChanges') : t('form.save'))}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export default function AdminGovPage() {
    const t = useTranslations('GovPage');
    const [items, setItems] = React.useState<GovItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const { toast } = useToast();

    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isFormOpen, setFormOpen] = React.useState(false);
    const [itemToEdit, setItemToEdit] = React.useState<GovItem | undefined>(undefined);
    const [itemToDelete, setItemToDelete] = React.useState<GovItem | null>(null);

    const fetchItems = React.useCallback(async () => {
        try {
            setLoading(true);
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
    }, []);

    React.useEffect(() => {
        fetchItems();
        const channel = supabase
            .channel('public:gov_items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gov_items' }, () => {
                fetchItems();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [fetchItems]);

    const handleDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);

        try {
            const { error } = await supabase.from('gov_items').delete().eq('id', itemToDelete.id);
            if (error) throw error;

            toast({
                title: t('toasts.deleted'),
                description: t('toasts.deleted'),
            });
            fetchItems();
        } catch (error: any) {
            console.error('Error deleting gov item:', error);
            toast({ variant: 'destructive', title: t('toasts.error'), description: 'Failed to delete item.' });
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    };

    const handleOpenForm = (item?: GovItem) => {
        setItemToEdit(item);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setItemToEdit(undefined);
        fetchItems();
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-1" onClick={() => handleOpenForm()}>
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                        {t('addItem')}
                                    </span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent onEscapeKeyDown={closeForm} onPointerDownOutside={closeForm}>
                                <GovItemForm onSuccess={closeForm} item={itemToEdit} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                    <span className="sr-only">{t('table.image')}</span>
                                </TableHead>
                                <TableHead>{t('table.title')}</TableHead>
                                <TableHead>{t('table.type')}</TableHead>
                                <TableHead>
                                    <span className="sr-only">{t('table.actions')}</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : items && items.length > 0 ? (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="hidden sm:table-cell">
                                            {item.image_url ? (
                                                <Image
                                                    alt={item.title}
                                                    className="aspect-square rounded-md object-cover"
                                                    height="64"
                                                    src={item.image_url}
                                                    width="64"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                                    <ImageIcon className="w-8 h-8" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {item.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <AlertDialog onOpenChange={(open) => !open && setItemToDelete(null)}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost" aria-label="Item actions">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>{t('table.actions')}</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenForm(item) }}>{t('actions.edit')}</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-red-600" onSelect={(e) => { e.preventDefault(); setItemToDelete(item); }}>{t('actions.delete')}</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                {itemToDelete && itemToDelete.id === item.id && (
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t('dialog.title')}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t('dialog.description', { title: itemToDelete.title })}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setItemToDelete(null)} disabled={isDeleting}>{t('actions.edit')}</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
                                                                {isDeleting ? t('toasts.deleted') : t('actions.delete')}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                )}
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        {t('table.noItems')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
