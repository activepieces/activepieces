import { t } from 'i18next';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { billingUtils } from '@/features/billing';
import { platformHooks } from '@/hooks/platform-hooks';

import { DeletePlatformDialog } from './delete-platform-dialog';

export const DangerZoneSection = ({ platformName }: DangerZoneSectionProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const hasSubscription = billingUtils.isPaidPlan(platform.plan.plan);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{t('Danger zone')}</h2>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium">{t('Delete platform')}</span>
          <span className="text-sm text-muted-foreground">
            {t('Once deleted, your platform cannot be recovered.')}
            {hasSubscription
              ? ` ${t(
                  'Cancel your subscription before deleting this platform.',
                )}`
              : ''}
          </span>
        </div>
        <Button
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
