import { t } from 'i18next';

import { Separator } from '@/components/ui/separator';

import LanguageToggle from '../../../components/account-settings/language-toggle';
import ThemeToggle from '../../../components/account-settings/theme-toggle';

export default function PreferencesSettingsPage() {
  return (
    <div className="max-w-xl px-8 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold">{t('Preferences')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Customize your appearance and language.')}
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </div>
  );
}
