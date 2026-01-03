
'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type SiteSettings = {
  id: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  terms_url?: string;
  privacy_url?: string;
};


import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'footer')
        .single();
      if (data) {
        setSettings(data);
      }
    }

    fetchSettings();

    // Subscribe to changes
    const channel = supabase
      .channel('public:settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.footer' }, (payload) => {
        setSettings(payload.new as SiteSettings);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, []);

  const facebook = settings?.facebook_url || '#';
  const twitter = settings?.twitter_url || '#';
  const instagram = settings?.instagram_url || '#';
  const phone = settings?.phone_number || '+963 912 345 678';
  const email = settings?.email || 'contact@eyronix.sy';
  const address = settings?.address || 'Damascus, Syria';
  const terms = settings?.terms_url || '#';
  const privacy = settings?.privacy_url || '#';


  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.png" alt="Eyronix Syria Logo" width={32} height={32} />
              <span className="font-bold text-xl font-headline">Eyronix Syria</span>
            </Link>
            <p className="text-muted-foreground">
              {t('tagline')}
            </p>
            <div className="flex space-x-4">
              <Link href={facebook} aria-label="Facebook" className="text-muted-foreground hover:text-primary"><Facebook size={20} /></Link>
              <Link href={twitter} aria-label="Twitter" className="text-muted-foreground hover:text-primary"><Twitter size={20} /></Link>
              <Link href={instagram} aria-label="Instagram" className="text-muted-foreground hover:text-primary"><Instagram size={20} /></Link>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold font-headline mb-4">{t('quickLinks')}</h3>
            <ul className="space-y-2">
              <li><Link href="/#services" className="text-muted-foreground hover:text-primary">{t('services')}</Link></li>
              <li><Link href="/#pricing" className="text-muted-foreground hover:text-primary">{t('pricing')}</Link></li>
              <li><Link href="/#survey" className="text-muted-foreground hover:text-primary">{t('requestSurvey')}</Link></li>
              <li><Link href="/products" className="text-muted-foreground hover:text-primary">{t('products')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold font-headline mb-4">{t('contactUs')}</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <Mail size={18} className="me-3 mt-1 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-primary">{email}</a>
              </li>
              <li className="flex items-start">
                <Phone size={18} className="me-3 mt-1 shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-primary">{phone}</a>
              </li>
              <li className="flex items-start">
                <MapPin size={18} className="me-3 mt-1 shrink-0" />
                <span>{address}</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold font-headline mb-4">{t('legal')}</h3>
            <ul className="space-y-2">
              <li><Link href={privacy} className="text-muted-foreground hover:text-primary">{t('privacyPolicy')}</Link></li>
              <li><Link href={terms} className="text-muted-foreground hover:text-primary">{t('termsOfService')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Eyronix Syria. {t('rightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}
