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
        const nextLocale = locale === 'bs' ? 'en' : locale === 'en' ? 'ar' : 'en'; // Assuming 'bs' was a typo or example? Project has 'ar'.
        // Logic: Toggle between 'en' and 'ar'.
        const targetLocale = locale === 'ar' ? 'en' : 'ar';

        router.replace(pathname, { locale: targetLocale });
    };

    return (
        <Button variant="ghost" size="icon" onClick={toggleLanguage} title={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}>
            <Globe className="h-5 w-5" />
            <span className="sr-only">{locale === 'en' ? 'العربية' : 'English'}</span>
            <span className="ml-2 font-bold text-xs uppercase hidden md:inline-block">{locale === 'ar' ? 'EN' : 'AR'}</span>
        </Button>
    );
}
