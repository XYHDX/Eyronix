'use client';

import React, { useState, useEffect, useRef } from 'react';
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

import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { User as UserIcon, Upload, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: 'Display name must be at least 2 characters.',
  }),
  email: z.string().email().optional(),
  photo: z.instanceof(File).optional().nullable(),
});

export default function ProfilePage() {
  const t = useTranslations('ProfilePage');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch initial user data
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUser({ ...user, ...profile, displayName: profile?.full_name || user.email });
        setIsAdmin(profile?.role === 'admin');
        setPhotoPreview(profile?.avatar_url || null);
      }
    }
    loadProfile();
  }, []);


  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
      photo: null,
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        email: user.email || '',
        photo: null,
      });
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
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    setIsSaving(true);
    let avatar_url = user?.avatar_url;

    try {
      // Handle photo upload
      if (data.photo) {
        const fileExt = data.photo.name.split('.').pop();
        const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, data.photo);

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatar_url = publicUrl;
      }

      // Update Profile Table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.displayName,
          avatar_url: avatar_url
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Update local state and preview immediately
      setUser(prev => ({ ...prev, displayName: data.displayName, avatar_url }));
      setPhotoPreview(avatar_url);

      toast({
        title: t('toasts.updated'),
        description: t('toasts.updatedDesc'),
      });
      form.reset({ ...data, photo: null });

      // Reload window to update header
      window.location.reload();

    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('toasts.error'),
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
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>
              {t('description')}
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
                <p className="text-sm font-medium">{t('form.profilePicture')}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('form.uploadImage')}
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
                  <p className="text-sm text-muted-foreground">{t('form.imageHelp')}</p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.displayName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.displayNamePlaceholder')} {...field} disabled={isSaving} />
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
                    <Input placeholder="your@email.com" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t('form.role')}</p>
              </div>
              <div>
                <Badge variant={isAdmin ? 'default' : 'secondary'}>
                  <div className="flex items-center gap-1">
                    {isAdmin ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                    {isAdmin ? t('roles.admin') : t('roles.user')}
                  </div>
                </Badge>
              </div>
            </FormItem>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('actions.saving') : t('actions.saveChanges')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card >
  );
}
