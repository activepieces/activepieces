import { t } from 'i18next';

import { PiecesSettings } from '@/app/components/project-settings/pieces';
import { Separator } from '@/components/ui/separator';

export default function WorkspacePiecesPage() {
  return (
    <div className="max-w-2xl px-8 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold">{t('Pieces')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Manage which integrations are available in this workspace.')}
        </p>
      </div>

      <Separator />

      <PiecesSettings />
    </div>
  );
}
