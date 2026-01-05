'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
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
import { PlusCircle, Database, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase/client';


type PricingPackage = {
  id: string;
  name: string;
  price: number;
  features: string[];
  status: 'Active' | 'Draft';
  popular: boolean;
};

const packageSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  features: z.string().min(1, 'Please enter at least one feature, separated by commas'),
  status: z.enum(['Active', 'Draft']),
  popular: z.boolean(),
});

function PackageForm({
  onSuccess,
  pkg: initialPkgData,
}: {
  onSuccess: () => void;
  pkg?: PricingPackage;
}) {
  const t = useTranslations('PricingPage');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<z.infer<typeof packageSchema>>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: initialPkgData?.name || '',
      price: initialPkgData?.price || 0,
      features: initialPkgData?.features.join(', ') || '',
      status: initialPkgData?.status || 'Active',
      popular: initialPkgData?.popular || false,
    },
  });

  React.useEffect(() => {
    form.reset({
      name: initialPkgData?.name || '',
      price: initialPkgData?.price || 0,
      features: initialPkgData?.features.join(', ') || '',
      status: initialPkgData?.status || 'Active',
      popular: initialPkgData?.popular || false,
    });
  }, [initialPkgData, form]);

  async function onSubmit(values: z.infer<typeof packageSchema>) {
    setIsSaving(true);

    const featuresArray = values.features
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f);
    const dataToSave = { ...values, features: featuresArray };

    try {
      let error;
      if (initialPkgData?.id) {
        const { error: updateError } = await supabase
          .from('pricing')
          .update(dataToSave)
          .eq('id', initialPkgData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('pricing')
          .insert([dataToSave]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: initialPkgData ? t('toasts.updated') : t('toasts.created'),
        description: `${values.name} ${initialPkgData ? t('toasts.updated') : t('toasts.created')}`,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save package:', error);
      toast({
        variant: 'destructive',
        title: t('toasts.error'),
        description: t('toasts.error'),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{initialPkgData ? t('form.editTitle') : t('form.addTitle')}</DialogTitle>
          <DialogDescription>
            {t('form.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.name')}</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Basic, Standard" {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.price')}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="499" {...field} disabled={isSaving} />
                </FormControl>
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
                  <Input placeholder="e.g., 2 Full HD Cameras" {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.status')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSaving}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectStatus')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="popular"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {t('form.popular')}
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isSaving}>
            {t('form.cancel')}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t('form.saving') : (initialPkgData ? t('form.saveChanges') : t('form.save'))}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export default function PricingPage() {
  const t = useTranslations('PricingPage');
  const { toast } = useToast();
  const [packages, setPackages] = React.useState<PricingPackage[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState<PricingPackage | undefined>(undefined);
  const [itemToDelete, setItemToDelete] = React.useState<PricingPackage | null>(null);

  const fetchPackages = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pricing')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching pricing:', error);
    } else {
      setPackages(data || []);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchPackages();
    // Realtime subscription
    const channel = supabase
      .channel('public:pricing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pricing' }, () => {
        fetchPackages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [fetchPackages]);



  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('pricing')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast({
        title: t('toasts.deleted'),
        description: t('toasts.deleted'),
      });
      setItemToDelete(null);
      fetchPackages();
    } catch (error: any) {
      console.error("Error deleting package:", error);
      toast({ variant: 'destructive', title: t('toasts.error'), description: t('toasts.error') });
    } finally {
      setIsDeleting(false);
    }
  }

  const handleOpenForm = (pkg?: PricingPackage) => {
    setItemToEdit(pkg);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setItemToEdit(undefined);
    fetchPackages();
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
                    {t('addPackage')}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent onEscapeKeyDown={closeForm} onPointerDownOutside={closeForm}>
                <PackageForm onSuccess={closeForm} pkg={itemToEdit} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.name')}</TableHead>
                <TableHead>{t('table.price')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('table.features')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('table.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : packages && packages.length > 0 ? (
                packages.sort((a, b) => a.price - b.price).map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{pkg.price > 0 ? `$${pkg.price.toLocaleString()}` : 'Custom'}</TableCell>
                    <TableCell className="hidden md:table-cell">{pkg.features.join(', ')}</TableCell>
                    <TableCell>
                      <Badge variant={pkg.status === 'Active' ? 'default' : 'outline'}>
                        {pkg.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AlertDialog onOpenChange={(open) => !open && setItemToDelete(null)}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" aria-label="Pricing actions">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('table.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenForm(pkg) }}>{t('actions.edit')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-600" onSelect={(e) => { e.preventDefault(); setItemToDelete(pkg); }}>{t('actions.delete')}</DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {itemToDelete && itemToDelete.id === pkg.id && (
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('dialog.title')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('dialog.description', { name: itemToDelete.name })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setItemToDelete(null)} disabled={isDeleting}>{t('actions.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
                                {isDeleting ? t('actions.deleting') : t('actions.confirm')}
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
                  <TableCell colSpan={5} className="h-24 text-center">
                    {t('table.noPackages')}
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
