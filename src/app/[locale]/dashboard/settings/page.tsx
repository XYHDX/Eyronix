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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
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
import { supabase } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('SettingsPage');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 'footer')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is code for 0 rows if single() called
          console.error("Error fetching settings:", error);
        }

        if (data) {
          const loadedSettings = {
            facebookUrl: data.facebook_url || '',
            twitterUrl: data.twitter_url || '',
            instagramUrl: data.instagram_url || '',
            phoneNumber: data.phone_number || '',
            email: data.email || '',
            address: data.address || '',
            termsUrl: data.terms_url || '',
            privacyUrl: data.privacy_url || '',
          };
          setSettings(loadedSettings);
          form.reset(loadedSettings);
        }
      } catch (e) {
        console.error("Unexpected error fetching settings:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  async function onSubmit(data: SiteSettings) {
    setIsSaving(true);

    try {
      // Upsert settings (id is strictly 'footer')
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 'footer',
          facebook_url: data.facebookUrl,
          twitter_url: data.twitterUrl,
          instagram_url: data.instagramUrl,
          phone_number: data.phoneNumber,
          email: data.email,
          address: data.address,
          terms_url: data.termsUrl,
          privacy_url: data.privacyUrl
        });

      if (error) throw error;

      toast({
        title: t('toasts.saved'),
        description: t('toasts.savedDesc'),
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({ variant: 'destructive', title: t('toasts.error'), description: error.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  }

  const renderFormFields = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('sections.contactInfo')}</h3>
        <p className="text-sm text-muted-foreground">{t('sections.contactInfoDesc')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.phone')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.phonePlaceholder')} {...field} />
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
              <FormLabel>{t('form.email')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.emailPlaceholder')} {...field} />
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
            <FormLabel>{t('form.address')}</FormLabel>
            <FormControl>
              <Input placeholder={t('form.addressPlaceholder')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="pt-6">
        <h3 className="text-lg font-medium">{t('sections.socialMedia')}</h3>
        <p className="text-sm text-muted-foreground">{t('sections.socialMediaDesc')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="facebookUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.facebook')}</FormLabel>
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
              <FormLabel>{t('form.twitter')}</FormLabel>
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
              <FormLabel>{t('form.instagram')}</FormLabel>
              <FormControl>
                <Input placeholder="https://instagram.com/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="pt-6">
        <h3 className="text-lg font-medium">{t('sections.legalPages')}</h3>
        <p className="text-sm text-muted-foreground">{t('sections.legalPagesDesc')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="termsUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.termsUrl')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.termsUrlPlaceholder')} {...field} />
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
              <FormLabel>{t('form.privacyUrl')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.privacyUrlPlaceholder')} {...field} />
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
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? renderSkeleton() : renderFormFields()}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? t('actions.saving') : t('actions.saveChanges')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
