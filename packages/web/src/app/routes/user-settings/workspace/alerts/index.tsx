import { t } from 'i18next';

import { AlertsSettings } from '@/app/components/project-settings/alerts';
import { Separator } from '@/components/ui/separator';

export default function WorkspaceAlertsPage() {
  return (
    <div className="max-w-xl px-8 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold">{t('Alert Emails')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Get notified when flows fail.')}
        </p>
      </div>

      <Separator />

      <AlertsSettings />
    </div>
  );
}
