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
import { PlusCircle, Database, MoreHorizontal, ShoppingBag, Loader2 } from 'lucide-react';
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { revalidateProducts } from '../../actions';
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

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  net_price: number;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  image_url?: string | null;
  image_id?: string | null;
};

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  price: z.coerce.number().positive('Price must be a positive number'),
  netPrice: z.coerce.number().positive('Net Price must be a positive number'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  status: z.enum(['In Stock', 'Low Stock', 'Out of Stock']),
  image: z.instanceof(File).optional().nullable(),
});

function ProductForm({
  onSuccess,
  product: initialProductData,
}: {
  onSuccess: () => void;
  product?: Product;
}) {
  const t = useTranslations('ProductsPage');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialProductData?.name ?? '',
      sku: initialProductData?.sku ?? '',
      price: initialProductData?.price ?? 0,
      netPrice: initialProductData?.net_price ?? 0,
      stock: initialProductData?.stock ?? 0,
      status: initialProductData?.status ?? 'In Stock',
      image: null,
    },
  });

  React.useEffect(() => {
    form.reset({
      name: initialProductData?.name ?? '',
      sku: initialProductData?.sku ?? '',
      price: initialProductData?.price ?? 0,
      netPrice: initialProductData?.net_price ?? 0,
      stock: initialProductData?.stock ?? 0,
      status: initialProductData?.status ?? 'In Stock',
      image: null,
    });
  }, [initialProductData, form]);

  async function onSubmit(values: z.infer<typeof productSchema>) {
    setIsSaving(true);
    let image_url: string | null = initialProductData?.image_url || null;

    try {
      if (values.image) {
        // Upload to Supabase Storage
        const fileExt = values.image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, values.image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        image_url = publicUrl;
      }

      const productData = {
        name: values.name,
        sku: values.sku,
        price: values.price,
        net_price: values.netPrice,
        stock: values.stock,
        status: values.status,
        image_url: image_url,
      };

      if (initialProductData) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', initialProductData.id);
        if (error) throw error;
        toast({ title: t('toasts.updated'), description: t('toasts.updated') });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
        toast({ title: t('toasts.created'), description: t('toasts.created') });
      }

      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({ variant: 'destructive', title: t('toasts.error'), description: error.message || 'Failed to save product.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{initialProductData ? t('form.editTitle') : t('form.addTitle')}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t('form.description')}
          </p>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form.namePlaceholder')} {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.sku')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form.skuPlaceholder')} {...field} disabled={isSaving} />
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
                  <Input type="number" placeholder="199.99" {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="netPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.netPrice')}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100.00" {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.stock')}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100" {...field} disabled={isSaving} />
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
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
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
            {isSaving ? t('form.saving') : (initialProductData ? t('form.saveChanges') : t('form.save'))}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export default function ProductsPage() {
  const t = useTranslations('ProductsPage');
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const [isSeeding, setIsSeeding] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState<Product | undefined>(undefined);
  const [itemToDelete, setItemToDelete] = React.useState<Product | null>(null);

  const fetchProducts = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProducts();
    // Realtime
    const channel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [fetchProducts]);

  const getProductImage = (product: Product): ImagePlaceholder | undefined => {
    if (!product.image_id) return undefined;
    return PlaceHolderImages.find((img) => img.id === product.image_id);
  }

  const sampleProducts = [
    { name: 'Dome Security Camera', sku: 'CAM-DOME-HD', price: 199.99, net_price: 120.00, stock: 50, status: 'In Stock' as const, image_id: 'product-1' },
    { name: 'Bullet Outdoor Camera', sku: 'CAM-BULL-4K', price: 249.50, net_price: 150.00, stock: 8, status: 'Low Stock' as const, image_id: 'product-2' },
    { name: '8-Channel NVR', sku: 'NVR-08CH-2TB', price: 499.00, net_price: 300.00, stock: 20, status: 'In Stock' as const, image_id: 'product-3' },
    { name: 'Micro Dashcam', sku: 'DASH-MICRO-1080P', price: 99.00, net_price: 60.00, stock: 0, status: 'Out of Stock' as const, image_id: 'dashcam-service' },
  ];

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const { error } = await supabase.from('products').insert(sampleProducts);
      if (error) throw error;
      toast({ title: t('toasts.created'), description: 'Sample products have been added.' });
      fetchProducts();
    } catch (error: any) {
      console.error("Error seeding products:", error);
      toast({ variant: 'destructive', title: t('toasts.error'), description: 'Failed to seed products.' });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase.from('products').delete().eq('id', itemToDelete.id);
      if (error) throw error;

      toast({
        title: t('toasts.deleted'),
        description: t('toasts.deleted'),
      });
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({ variant: 'destructive', title: t('toasts.error'), description: 'Failed to delete product.' });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleOpenForm = (product?: Product) => {
    setItemToEdit(product);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setItemToEdit(undefined);
    fetchProducts();
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
            <Button size="sm" className="gap-1" onClick={handleSeedData} disabled={isSeeding || (products && products.length > 0) || loading}>
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {isSeeding ? t('seeding') : t('seedData')}
              </span>
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1" onClick={() => handleOpenForm()}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('addProduct')}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent onEscapeKeyDown={closeForm} onPointerDownOutside={closeForm}>
                <ProductForm onSuccess={closeForm} product={itemToEdit} />
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
                <TableHead>{t('table.name')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('table.netPrice')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('table.sellPrice')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('table.stock')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('table.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : products && products.length > 0 ? (
                products.map((product) => {
                  const productImageObj = product.image_url ? { imageUrl: product.image_url, imageHint: product.name } : getProductImage(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="hidden sm:table-cell">
                        {productImageObj ? (
                          <Image
                            alt={product.name}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={productImageObj.imageUrl}
                            width="64"
                            data-ai-hint={productImageObj.imageHint}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'In Stock' ? 'secondary' : product.status === 'Low Stock' ? 'destructive' : 'outline'}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">${(product.net_price || 0).toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell font-bold">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
                      <TableCell>
                        <AlertDialog onOpenChange={(open) => !open && setItemToDelete(null)}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost" aria-label="Product actions">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('table.actions')}</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenForm(product) }}>{t('actions.edit')}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600" onSelect={(e) => { e.preventDefault(); setItemToDelete(product); }}>{t('actions.delete')}</DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {itemToDelete && itemToDelete.id === product.id && (
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
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {t('table.noProducts')}
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
