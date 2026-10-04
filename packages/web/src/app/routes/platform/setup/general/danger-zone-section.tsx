import { hasActiveSubscription } from '@activepieces/shared';
import { t } from 'i18next';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { platformHooks } from '@/hooks/platform-hooks';
import { adminControl } from '@/lib/admin-control';

import { DeletePlatformDialog } from './delete-platform-dialog';

export const DangerZoneSection = ({ platformName }: DangerZoneSectionProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const hasSubscription = hasActiveSubscription(platform.plan.plan);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{t('Danger zone')}</h2>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium">{t('Delete platform')}</span>
          <span className="text-sm text-gray-11">
            {t('Once deleted, your platform cannot be recovered.')}
            {hasSubscription
              ? ` ${t(
                  'Cancel your subscription before deleting this platform.',
                )}`
              : ''}
          </span>
        </div>
        <Button
          {...adminControl('general.platform-delete.open')}
          variant="destructive"
          size="sm"
          disabled={hasSubscription}
          onClick={() => setIsDeleteOpen(true)}
        >
          <Trash2 className="size-3.5" />
          {t('Delete platform')}
        </Button>
      </div>
      <DeletePlatformDialog
        platformName={platformName}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </div>
  );
};

type DangerZoneSectionProps = {
  platformName: string;
};
