import { hasActiveSubscription } from '@activepieces/shared';
import { t } from 'i18next';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DangerZone, SettingsRow } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { DeletePlatformDialog } from './delete-platform-dialog';

export const DangerZoneSection = ({ platformName }: DangerZoneSectionProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const hasSubscription = hasActiveSubscription(platform.plan.plan);

  return (
    <DangerZone>
      <SettingsRow
        title={t('Delete platform')}
        description={
          <>
            {t('Once deleted, your platform cannot be recovered.')}
            {hasSubscription
              ? ` ${t(
                  'Cancel your subscription before deleting this platform.',
                )}`
              : ''}
          </>
        }
      >
        <Button
          {...adminControl(AdminControl.GENERAL_PLATFORM_DELETE_OPEN)}
          type="button"
          variant="destructive"
          size="sm"
          disabled={hasSubscription}
          onClick={() => setIsDeleteOpen(true)}
        >
          <Trash2 />
          {t('Delete platform')}
        </Button>
      </SettingsRow>
      <DeletePlatformDialog
        platformName={platformName}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </DangerZone>
  );
};

type DangerZoneSectionProps = {
  platformName: string;
};
