
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
import { PlusCircle, Database, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useStorage,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
  useUser,
} from '@/firebase';
import { revalidateServices } from '../../actions';
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
import { collection, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { PlaceHolderImages } from '@/lib/placeholder-images';


type Service = {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl?: string;
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
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
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
    if (!firestore || !storage) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database, or Storage not available.' });
      return;
    }

    setIsSaving(true);
    let imageUrl: string | undefined = initialServiceData?.imageUrl;

    if (values.image) {
      if (initialServiceData?.imageUrl && initialServiceData.imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
        try {
          const oldImageRef = ref(storage, initialServiceData.imageUrl);
          await deleteObject(oldImageRef);
        } catch (storageError: any) {
          if (storageError.code !== 'storage/object-not-found') {
            console.warn("Could not delete old image from storage:", storageError);
          }
        }
      }

      const storageRef = ref(storage, `services/${Date.now()}-${values.image.name}`);
      const snapshot = await uploadBytes(storageRef, values.image);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const dataToSave = {
      name: values.name,
      description: values.description,
      icon: values.icon,
      imageUrl
    };

    const operation = initialServiceData
      ? updateDoc(doc(firestore, 'services', initialServiceData.id), dataToSave)
      : addDoc(collection(firestore, 'services'), dataToSave);

    operation
      .then(async () => {
        await revalidateServices();
        toast({
          title: `Service ${initialServiceData ? 'Updated' : 'Added'}`,
          description: `${values.name} has been successfully ${initialServiceData ? 'updated' : 'added'}.`,
        });
        onSuccess();
      })
      .catch((error: any) => {
        console.error('Failed to save service:', error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: initialServiceData ? `services/${initialServiceData.id}` : 'services',
          operation: initialServiceData ? 'update' : 'create',
          requestResourceData: dataToSave,
        }));
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{initialServiceData ? 'Edit' : 'Add New'} Service</DialogTitle>
          <DialogDescription>
            Fill in the details for the service.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., CCTV Systems" {...field} disabled={isSaving} />
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="A short description of the service" {...field} disabled={isSaving} />
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
                <FormLabel>Icon Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Camera" {...field} disabled={isSaving} />
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
                <FormLabel>Service Image</FormLabel>
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
            {isSaving ? 'Saving...' : `Save ${initialServiceData ? 'Changes' : 'Service'}`}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


export default function ServicesPage() {
  const firestore = useFirestore();
  const storage = useStorage();
  const servicesCollection = 'services';
  const { data: services, isLoading: loading } = useCollection<Service>(servicesCollection);
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState<Service | undefined>(undefined);
  const [itemToDelete, setItemToDelete] = React.useState<Service | null>(null);

  const sampleServices = [
    { name: 'CCTV Systems', description: 'High-definition surveillance solutions for homes and businesses. Secure your premises with our reliable CCTV technology.', icon: 'Camera', imageUrl: PlaceHolderImages.find(i => i.id === 'cctv-service')?.imageUrl },
    { name: 'Dashcam Installation', description: 'Capture every moment on the road. Protect yourself from false claims with crystal-clear dashcam footage.', icon: 'Car', imageUrl: PlaceHolderImages.find(i => i.id === 'dashcam-service')?.imageUrl },
    { name: 'System Maintenance', description: 'Ensure your security systems are always running at peak performance with our expert maintenance services.', icon: 'Wrench', imageUrl: PlaceHolderImages.find(i => i.id === 'maintenance-service')?.imageUrl },
  ];

  const handleSeedData = async () => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
      return;
    }
    setIsSeeding(true);

    const servicesCollectionRef = collection(firestore, 'services');
    const batch = writeBatch(firestore);
    sampleServices.forEach((service) => {
      const docRef = doc(servicesCollectionRef);
      batch.set(docRef, service);
    });

    batch.commit()
      .then(async () => {
        await revalidateServices();
        toast({ title: 'Success', description: 'Sample services have been added.' });
      })
      .catch((error) => {
        console.error("Error seeding services:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'services',
          operation: 'write',
          requestResourceData: sampleServices,
        }));
      })
      .finally(() => {
        setIsSeeding(false);
      });
  };

  const handleDelete = async () => {
    if (!itemToDelete || !firestore || !storage) return;
    setIsDeleting(true);

    if (itemToDelete.imageUrl && itemToDelete.imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
      const imageRef = ref(storage, itemToDelete.imageUrl);
      await deleteObject(imageRef).catch(err => {
        if (err.code !== 'storage/object-not-found') {
          console.warn("Could not delete old image from storage:", err);
        }
      });
    }

    const serviceDocRef = doc(firestore, 'services', itemToDelete.id);
    deleteDoc(serviceDocRef)
      .then(async () => {
        await revalidateServices();
        toast({
          title: 'Service Deleted',
          description: `${itemToDelete.name} has been successfully deleted.`,
        });
      })
      .catch((error) => {
        console.error("Error deleting service:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `services/${itemToDelete.id}`,
          operation: 'delete',
        }));
      })
      .finally(() => {
        setIsDeleting(false);
        setItemToDelete(null);
      });
  };

  const handleOpenForm = (service?: Service) => {
    setItemToEdit(service);
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
            <CardTitle>Services</CardTitle>
            <CardDescription>Manage your company's service offerings.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gap-1" onClick={handleSeedData} disabled={isSeeding || (services && services.length > 0) || loading}>
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
                    Add Service
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
                <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                <TableHead>Service Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
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
                      {service.imageUrl ? (
                        <Image
                          alt={service.name}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={service.imageUrl}
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenForm(service) }}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-red-600" onSelect={(e) => { e.preventDefault(); setItemToDelete(service); }}>Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {itemToDelete && itemToDelete.id === service.id && (
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                <span className="font-bold"> {itemToDelete?.name} </span> service.
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
                  <TableCell colSpan={4} className="h-24 text-center">
                    No services found. Try seeding sample data or add a new service.
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
