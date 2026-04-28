import { t } from 'i18next';

import { EnvironmentSettings } from '@/app/components/project-settings/environment';
import { Separator } from '@/components/ui/separator';

export default function WorkspaceEnvironmentPage() {
  return (
    <div className="max-w-xl px-8 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold">{t('Environment')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Manage git sync and deployment environments.')}
        </p>
      </div>

      <Separator />

      <EnvironmentSettings />
    </div>
  );
}
