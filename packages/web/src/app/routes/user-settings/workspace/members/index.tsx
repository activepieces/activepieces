import { t } from 'i18next';

import { MembersSettings } from '@/app/components/project-settings/members';
import { Separator } from '@/components/ui/separator';

export default function WorkspaceMembersPage() {
  return (
    <div className="max-w-2xl px-8 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold">{t('Members')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Manage who has access to this workspace.')}
        </p>
      </div>

      <Separator />

      <MembersSettings />
    </div>
  );
}
