
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  useAuth,
  useUser,
  useFirestore,
  useStorage,
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';
import { updateUserProfile } from '@/firebase/firestore/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User as UserIcon, Upload, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: 'Display name must be at least 2 characters.',
  }),
  email: z.string().email().optional(),
  photo: z.instanceof(File).optional().nullable(),
});

export default function ProfilePage() {
  const { user, isAdmin } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: {
      displayName: user?.displayName || '',
      email: user?.email || '',
      photo: null,
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        email: user.email || '',
        photo: null,
      });
      setPhotoPreview(user.photoURL);
    }
  }, [user, form]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('photo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: z.infer<typeof profileFormSchema>) {
    const currentUser = auth?.currentUser;
    if (!currentUser || !firestore || !storage) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Services not available. Please try again later.',
      });
      return;
    }

    setIsSaving(true);
    let photoURL = user?.photoURL || null;

    try {
      // Handle photo upload separately
      if (data.photo) {
        const storageRef = ref(storage, `users/${currentUser.uid}/profile.jpg`);
        const snapshot = await uploadBytes(storageRef, data.photo);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      // Update Auth profile
      await updateProfile(currentUser, {
        displayName: data.displayName,
        photoURL: photoURL,
      });

      const userProfileData = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: data.displayName,
        photoURL: photoURL,
      };

      // Update Firestore profile
      await updateUserProfile(firestore, userProfileData);

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      form.reset({ ...data, photo: null });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An error occurred while updating your profile.',
      });
    } finally {
      setIsSaving(false);
    }
  }


  return (
    <Card className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              Manage your personal information and profile picture.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={photoPreview || undefined} />
                <AvatarFallback className="text-3xl">
                  {user ? getInitials(user.displayName) : <UserIcon />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <FormLabel>Profile Picture</FormLabel>
                <div className="flex items-center gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                  <FormField
                    control={form.control}
                    name="photo"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 1MB</p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} disabled={isSaving} />
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="your@email.com" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Role</FormLabel>
                {/* Sync Button Removed - Supabase handles roles via Database directly */}
              </div>
              <div>
                <Badge variant={isAdmin ? 'default' : 'secondary'}>
                  <div className="flex items-center gap-1">
                    {isAdmin ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                    {isAdmin ? 'Admin' : 'User'}
                  </div>
                </Badge>
              </div>
            </FormItem>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card >
  );
}
