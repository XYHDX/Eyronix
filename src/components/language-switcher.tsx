'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLanguage = () => {
        const targetLocale = locale === 'ar' ? 'en' : 'ar';
        router.replace(pathname, { locale: targetLocale });
    };

    return (
        <Button variant="ghost" size="sm" onClick={toggleLanguage} title={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}>
            <span className="font-bold text-sm uppercase">{locale === 'ar' ? 'EN' : 'AR'}</span>
        </Button>
    );
}
