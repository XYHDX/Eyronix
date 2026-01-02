
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
import { PlusCircle, Database, MoreHorizontal, ShoppingBag } from 'lucide-react';
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';
import {
  useCollection,
  useFirestore,
  useStorage,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
  useUser,
} from '@/firebase';
import { mockDb } from '@/lib/mock-db';
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';


type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  netPrice: number;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  imageUrl?: string | null;
  imageId?: string | null;
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
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialProductData?.name ?? '',
      sku: initialProductData?.sku ?? '',
      price: initialProductData?.price ?? 0,
      netPrice: initialProductData?.netPrice ?? 0,
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
      netPrice: initialProductData?.netPrice ?? 0,
      stock: initialProductData?.stock ?? 0,
      status: initialProductData?.status ?? 'In Stock',
      image: null,
    });
  }, [initialProductData, form]);

  async function onSubmit(values: z.infer<typeof productSchema>) {
    // Basic check for user context
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User not authenticated.',
      });
      return;
    }

    setIsSaving(true);

    let imageUrl: string | null = initialProductData?.imageUrl || null;
    let imageId: string | null = initialProductData?.imageId || null;

    // Handle mock image upload (just simulate)
    if (values.image) {
      // Only try unique file upload if we have real storage, otherwise mock url
      if (storage) {
        const storageRef = ref(storage, `products/${Date.now()}-${values.image.name}`);
        try {
          const snapshot = await uploadBytes(storageRef, values.image);
          imageUrl = await getDownloadURL(snapshot.ref);
        } catch (e) {
          console.warn("Real storage upload failed, using fallback mock URL");
          imageUrl = URL.createObjectURL(values.image);
        }
      } else {
        // Fallback for mock environment
        imageUrl = URL.createObjectURL(values.image);
      }
      imageId = null;
    }

    const productData = {
      name: values.name,
      sku: values.sku,
      price: values.price,
      netPrice: values.netPrice,
      stock: values.stock,
      status: values.status,
      imageUrl,
      imageId,
    };

    try {
      if (firestore) {
        const operation = initialProductData
          ? updateDoc(doc(firestore, 'products', initialProductData.id), productData)
          : addDoc(collection(firestore, 'products'), productData);
        await operation;
      } else {
        // Mock DB Operation
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        if (initialProductData) {
          mockDb.updateProduct(initialProductData.id, productData);
        } else {
          mockDb.addProduct(productData);
        }
      }

      await revalidateProducts();
      toast({
        title: `Product ${initialProductData ? 'Updated' : 'Added'}`,
        description: `${productData.name} has been successfully ${initialProductData ? 'updated' : 'added'}.`,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save product:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save product.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{initialProductData ? 'Edit' : 'Add New'} Product</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fill in the details for the product.
          </p>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Dome Camera" {...field} disabled={isSaving} />
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
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="CAM-DOME-01" {...field} disabled={isSaving} />
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
                <FormLabel>Sell Price ($)</FormLabel>
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
                <FormLabel>Net Price (Cost) ($)</FormLabel>
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
                <FormLabel>Stock</FormLabel>
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
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSaving}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
                <FormLabel>Product Image</FormLabel>
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
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : `Save ${initialProductData ? 'Changes' : 'Product'}`}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export default function ProductsPage() {
  const firestore = useFirestore();
  const productsCollection = 'products';
  const { data: products, isLoading: loading } = useCollection<Product>(productsCollection);
  const storage = useStorage();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState<Product | undefined>(undefined);
  const [itemToDelete, setItemToDelete] = React.useState<Product | null>(null);

  const getProductImage = (product: Product): ImagePlaceholder | undefined => {
    if (!product.imageId) return undefined;
    return PlaceHolderImages.find((img) => img.id === product.imageId);
  }

  const sampleProducts = [
    { name: 'Dome Security Camera', sku: 'CAM-DOME-HD', price: 199.99, netPrice: 120.00, stock: 50, status: 'In Stock' as const, imageId: 'product-1' },
    { name: 'Bullet Outdoor Camera', sku: 'CAM-BULL-4K', price: 249.50, netPrice: 150.00, stock: 8, status: 'Low Stock' as const, imageId: 'product-2' },
    { name: '8-Channel NVR', sku: 'NVR-08CH-2TB', price: 499.00, netPrice: 300.00, stock: 20, status: 'In Stock' as const, imageId: 'product-3' },
    { name: 'Micro Dashcam', sku: 'DASH-MICRO-1080P', price: 99.00, netPrice: 60.00, stock: 0, status: 'Out of Stock' as const, imageId: 'dashcam-service' },
  ];

  const handleSeedData = async () => {
    setIsSeeding(true);

    try {
      if (firestore) {
        const productsCollectionRef = collection(firestore, 'products');
        const batch = writeBatch(firestore);
        sampleProducts.forEach((product) => {
          const docRef = doc(productsCollectionRef);
          batch.set(docRef, product);
        });
        await batch.commit();
      } else {
        // Mock Seed
        await new Promise(resolve => setTimeout(resolve, 1000));
        sampleProducts.forEach(p => mockDb.addProduct(p));
      }

      await revalidateProducts();
      toast({ title: 'Success', description: 'Sample products have been added.' });
    } catch (error) {
      console.error("Error seeding products:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to seed products.' });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      if (firestore && storage) {
        if (itemToDelete.imageUrl && itemToDelete.imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
          // Try delete image logic...
          const imageRef = ref(storage, itemToDelete.imageUrl);
          await deleteObject(imageRef).catch(console.warn);
        }
        const productDocRef = doc(firestore, 'products', itemToDelete.id);
        await deleteDoc(productDocRef);
      } else {
        // Mock Delete
        await new Promise(resolve => setTimeout(resolve, 500));
        mockDb.deleteProduct(itemToDelete.id);
      }

      await revalidateProducts();
      toast({
        title: 'Product Deleted',
        description: `${itemToDelete.name} has been successfully deleted.`,
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete product.' });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }

  const handleOpenForm = (product?: Product) => {
    setItemToEdit(product);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setItemToEdit(undefined);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your product inventory.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={handleSeedData} disabled={isSeeding || (products && products.length > 0) || loading}>
              <Database className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {isSeeding ? 'Seeding...' : 'Seed Sample Data'}
              </span>
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1" onClick={() => handleOpenForm()}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Product
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
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Net Price</TableHead>
                <TableHead className="hidden md:table-cell">Sell Price</TableHead>
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
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
                  const image = product.imageUrl ? { imageUrl: product.imageUrl, imageHint: product.name } : getProductImage(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="hidden sm:table-cell">
                        {image ? (
                          <Image
                            alt={product.name}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={image.imageUrl}
                            width="64"
                            data-ai-hint={image.imageHint}
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
                      <TableCell className="hidden md:table-cell text-muted-foreground">${(product.netPrice || 0).toFixed(2)}</TableCell>
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
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenForm(product) }}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600" onSelect={(e) => { e.preventDefault(); setItemToDelete(product); }}>Delete</DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {itemToDelete && itemToDelete.id === product.id && (
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the
                                  <span className="font-bold"> {itemToDelete?.name} </span> product.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setItemToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
                                  {isDeleting ? 'Deleting...' : 'Delete'}
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    No products found. Try seeding sample data or add a new product.
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
