
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
  useFirestore,
  useDoc,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const settingsFormSchema = z.object({
  facebookUrl: z.string().url().or(z.literal('')),
  twitterUrl: z.string().url().or(z.literal('')),
  instagramUrl: z.string().url().or(z.literal('')),
  phoneNumber: z.string(),
  email: z.string().email(),
  address: z.string(),
  termsUrl: z.string().url().or(z.literal('')),
  privacyUrl: z.string().url().or(z.literal('')),
});

type SiteSettings = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const settingsDocRef = useMemoFirebase(() => {
    return 'settings/footer';
  }, [firestore]);

  const { data: settings, isLoading } = useDoc<SiteSettings>(settingsDocRef);

  const form = useForm<SiteSettings>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      facebookUrl: '',
      twitterUrl: '',
      instagramUrl: '',
      phoneNumber: '',
      email: '',
      address: '',
      termsUrl: '',
      privacyUrl: '',
    },
  });

  React.useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  async function onSubmit(data: SiteSettings) {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
      return;
    }

    setIsSaving(true);
    // Mock save
    new Promise((resolve) => setTimeout(resolve, 500))
      .then(() => {
        toast({
          title: 'Settings Saved',
          description: 'Your site settings have been successfully updated.',
        });
      })
      .catch((error) => {
        console.error("Error saving settings:", error);
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: 'settings/footer',
            operation: 'update',
            requestResourceData: data,
          })
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  const renderFormFields = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Contact Information</h3>
        <p className="text-sm text-muted-foreground">Update phone, email, and address.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+963 912 345 678" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="contact@eyronix.sy" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl>
              <Input placeholder="Damascus, Syria" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="pt-6">
        <h3 className="text-lg font-medium">Social Media</h3>
        <p className="text-sm text-muted-foreground">Enter the full URLs for your social profiles.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="facebookUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facebook URL</FormLabel>
              <FormControl>
                <Input placeholder="https://facebook.com/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="twitterUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Twitter URL</FormLabel>
              <FormControl>
                <Input placeholder="https://twitter.com/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instagramUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram URL</FormLabel>
              <FormControl>
                <Input placeholder="https://instagram.com/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="pt-6">
        <h3 className="text-lg font-medium">Legal Pages</h3>
        <p className="text-sm text-muted-foreground">Links to your terms and privacy policy pages.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="termsUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms of Service URL</FormLabel>
              <FormControl>
                <Input placeholder="/terms" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="privacyUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Privacy Policy URL</FormLabel>
              <FormControl>
                <Input placeholder="/privacy" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-8">
      <div className="space-y-2"> <Skeleton className="h-5 w-40" /> <Skeleton className="h-4 w-64" /> </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div> <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div> </div>
      <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>

      <div className="space-y-2 pt-6"> <Skeleton className="h-5 w-40" /> <Skeleton className="h-4 w-64" /> </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
      </div>
    </div>
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Site Settings</CardTitle>
            <CardDescription>
              Manage global settings for your website, including footer content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? renderSkeleton() : renderFormFields()}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
