'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
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
import { PlusCircle, Database, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase/client';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Service = {
  id: string;
  name: string;
  description: string;
  icon: string;
  image_url?: string;
};

const serviceSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  icon: z.string().min(1, 'Icon is required'),
  image: z.instanceof(File).optional().nullable(),
});

function ServiceForm({
  onSuccess,
  service: initialServiceData,
}: {
  onSuccess: () => void;
  service?: Service;
}) {
  const t = useTranslations('ServicesPage');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: initialServiceData?.name || '',
      description: initialServiceData?.description || '',
      icon: initialServiceData?.icon || 'Wrench',
      image: null,
    },
  });

  React.useEffect(() => {
    form.reset({
      name: initialServiceData?.name || '',
      description: initialServiceData?.description || '',
      icon: initialServiceData?.icon || 'Wrench',
      image: null,
    });
  }, [initialServiceData, form]);

  async function onSubmit(values: z.infer<typeof serviceSchema>) {
    setIsSaving(true);
    let image_url: string | undefined = initialServiceData?.image_url;

    try {
      if (values.image) {
        // Upload new image
        const fileExt = values.image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('services')
          .upload(filePath, values.image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('services')
          .getPublicUrl(filePath);

        image_url = publicUrl;
      }

      const dataToSave = {
        name: values.name,
        description: values.description,
        icon: values.icon,
        image_url
      };

      let error;
      if (initialServiceData?.id) {
        const { error: updateError } = await supabase
          .from('services')
          .update(dataToSave)
          .eq('id', initialServiceData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('services')
          .insert([dataToSave]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: initialServiceData ? t('toasts.updated') : t('toasts.created'),
        description: `${values.name} ${initialServiceData ? t('toasts.updated') : t('toasts.created')}`, // Simplified desc for now or use complex key
      });
      onSuccess();

    } catch (error: any) {
      console.error('Failed to save service:', error);
      toast({
        variant: 'destructive',
        title: t('toasts.error'),
        description: error.message || t('toasts.error'),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{initialServiceData ? t('form.editTitle') : t('form.addTitle')}</DialogTitle>
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
                  <Input placeholder={t('form.name')} {...field} disabled={isSaving} />
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
                  <Input placeholder={t('form.desc')} {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.icon')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form.icon')} {...field} disabled={isSaving} />
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
            {isSaving ? t('form.saving') : (initialServiceData ? t('form.saveChanges') : t('form.save'))}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export default function ServicesPage() {
  const t = useTranslations('ServicesPage');
  const { toast } = useToast();
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState<Service | undefined>(undefined);
  const [itemToDelete, setItemToDelete] = React.useState<Service | null>(null);

  const fetchServices = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchServices();
    // Realtime subscription
    const channel = supabase
      .channel('public:services')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchServices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [fetchServices]);



  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast({
        title: t('toasts.deleted'),
        description: t('toasts.deleted'),
      });
      setItemToDelete(null);
      fetchServices();
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast({ variant: 'destructive', title: t('toasts.error'), description: t('toasts.error') });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenForm = (service?: Service) => {
    setItemToEdit(service);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setItemToEdit(undefined);
    fetchServices(); // Refresh just in case
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
                    {t('addService')}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent onEscapeKeyDown={closeForm} onPointerDownOutside={closeForm}>
                <ServiceForm onSuccess={closeForm} service={itemToEdit} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">{t('table.image')}</TableHead>
                <TableHead>{t('table.name')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('table.description')}</TableHead>
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
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : services && services.length > 0 ? (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="hidden sm:table-cell">
                      {service.image_url ? (
                        <Image
                          alt={service.name}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={service.image_url}
                          width="64"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{service.description}</TableCell>
                    <TableCell>
                      <AlertDialog onOpenChange={(open) => !open && setItemToDelete(null)}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" aria-label="Service actions">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('table.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenForm(service) }}>{t('actions.edit')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-600" onSelect={(e) => { e.preventDefault(); setItemToDelete(service); }}>{t('actions.delete')}</DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {itemToDelete && itemToDelete.id === service.id && (
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
                  <TableCell colSpan={4} className="h-24 text-center">
                    {t('table.noServices')}
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
