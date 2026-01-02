
'use client';

import * as React from 'react';
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
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { revalidatePricing } from '../../actions';
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
import { collection, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';


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
  const { toast } = useToast();
  const firestore = useFirestore();
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
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database not available.',
      });
      return;
    }

    setIsSaving(true);

    const featuresArray = values.features
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f);
    const dataToSave = { ...values, features: featuresArray };

    const operationPromise = initialPkgData
      ? updateDoc(doc(firestore, 'pricing', initialPkgData.id), dataToSave)
      : addDoc(collection(firestore, 'pricing'), dataToSave);

    operationPromise
      .then(async () => {
        await revalidatePricing();
        toast({
          title: `Package ${initialPkgData ? 'Updated' : 'Added'}`,
          description: `${values.name} has been successfully ${initialPkgData ? 'updated' : 'added'
            }.`,
        });
        onSuccess();
      })
      .catch((error) => {
        console.error('Failed to save package:', error);
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: initialPkgData
              ? `pricing/${initialPkgData.id}`
              : 'pricing',
            operation: initialPkgData ? 'update' : 'create',
            requestResourceData: dataToSave,
          })
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{initialPkgData ? 'Edit' : 'Add New'} Pricing Package</DialogTitle>
          <DialogDescription>
            Fill in the details for the pricing package.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Package Name</FormLabel>
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
                <FormLabel>Price</FormLabel>
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
                <FormLabel>Features (comma-separated)</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., 2 Full HD Cameras, 1 TB Storage" {...field} disabled={isSaving} />
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
                    Mark as Popular
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : `Save ${initialPkgData ? 'Changes' : 'Package'}`}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export default function PricingPage() {
  const firestore = useFirestore();
  const pricingCollection = 'pricing';
  const { data: packages, isLoading: loading } = useCollection<PricingPackage>(pricingCollection);
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState<PricingPackage | undefined>(undefined);
  const [itemToDelete, setItemToDelete] = React.useState<PricingPackage | null>(null);

  const samplePackages = [
    { name: 'Basic', price: 499, features: ['2 Full HD Cameras', '1 TB Storage', 'Mobile Viewing', 'Basic Installation'], status: 'Active' as const, popular: false },
    { name: 'Standard', price: 999, features: ['4 Full HD Cameras', '2 TB Storage', 'Mobile Viewing', 'AI Motion Alerts', 'Professional Installation'], status: 'Active' as const, popular: true },
    { name: 'Pro', price: 1899, features: ['8 4K UHD Cameras', '4 TB Storage', 'Advanced AI Analytics', '24/7 Support', 'Custom Installation'], status: 'Active' as const, popular: false },
    { name: 'Enterprise', price: 0, features: ['Custom Solution'], status: 'Draft' as const, popular: false },
  ];

  const handleSeedData = async () => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
      return;
    }
    setIsSeeding(true);
    const pricingCollectionRef = collection(firestore, 'pricing');
    const batch = writeBatch(firestore);
    samplePackages.forEach((pkg) => {
      const docRef = doc(pricingCollectionRef);
      batch.set(docRef, pkg);
    });

    batch.commit()
      .then(async () => {
        await revalidatePricing();
        toast({ title: 'Success', description: 'Sample pricing packages have been added.' });
      })
      .catch((error) => {
        console.error("Error seeding pricing:", error);
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: 'pricing',
            operation: 'write',
            requestResourceData: samplePackages,
          })
        );
      })
      .finally(() => {
        setIsSeeding(false);
      });
  };

  const handleDelete = async () => {
    if (!itemToDelete || !firestore) return;
    setIsDeleting(true);
    const pkgDocRef = doc(firestore, 'pricing', itemToDelete.id);

    deleteDoc(pkgDocRef)
      .then(async () => {
        await revalidatePricing();
        toast({
          title: 'Package Deleted',
          description: `${itemToDelete.name} has been successfully deleted.`,
        });
      })
      .catch((error) => {
        console.error("Error deleting package:", error);
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: `pricing/${itemToDelete.id}`,
            operation: 'delete',
          })
        );
      })
      .finally(() => {
        setIsDeleting(false);
        setItemToDelete(null);
      });
  }

  const handleOpenForm = (pkg?: PricingPackage) => {
    setItemToEdit(pkg);
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
            <CardTitle>Packages</CardTitle>
            <CardDescription>Manage your security packages.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={handleSeedData} disabled={isSeeding || (packages && packages.length > 0) || loading}>
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
                    Add Package
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
                <TableHead>Package Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden md:table-cell">Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenForm(pkg) }}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-600" onSelect={(e) => { e.preventDefault(); setItemToDelete(pkg); }}>Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {itemToDelete && itemToDelete.id === pkg.id && (
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                <span className="font-bold"> {itemToDelete?.name} </span> package.
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No pricing packages found. Try seeding sample data or add a new package.
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
