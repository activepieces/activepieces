import { hasActiveSubscription } from '@activepieces/shared';
import { t } from 'i18next';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DangerZone } from '@/components/custom/settings-parts';
import { Button } from '@/components/ui/button';
import { platformHooks } from '@/hooks/platform-hooks';

import { DeletePlatformDialog } from './delete-platform-dialog';

export const DangerZoneSection = ({
  platformName,
  selfHosted,
}: DangerZoneSectionProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const hasSubscription = hasActiveSubscription(platform.plan.plan);

  if (selfHosted) {
    return (
      <DangerZone
        actions={[
          {
            title: t('Delete this platform'),
            description: t(
              'On your own machines, deleting the platform means erasing everything on them.',
            ),
            control: null,
          },
        ]}
      />
    );
  }

  return (
    <>
      <DangerZone
        actions={[
          {
            title: t('Delete this platform'),
            description: hasSubscription
              ? t('Cancel the subscription on Billing first.')
              : t('Every project, flow, connection and account is erased.'),
            control: (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={hasSubscription}
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 />
                {t('Delete platform')}
              </Button>
            ),
          },
        ]}
      />
      <DeletePlatformDialog
        platformName={platformName}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
};

type DangerZoneSectionProps = {
  platformName: string;
  selfHosted: boolean;
};
