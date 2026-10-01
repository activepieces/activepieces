import { hasActiveSubscription } from '@activepieces/shared';
import { t } from 'i18next';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
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
      <Panel title={t('Danger zone')}>
        <p className="text-sm text-gray-11">
          {t(
            'On your own machines, deleting the platform means erasing everything on them.',
          )}
        </p>
      </Panel>
    );
  }

  return (
    <Panel title={t('Danger zone')} flush>
      <SettingRows>
        <SettingRow
          title={t('Delete this platform')}
          description={
            hasSubscription
              ? t('Cancel the subscription on Billing first.')
              : t('Every project, flow, connection and account is erased.')
          }
        >
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
        </SettingRow>
      </SettingRows>
      <DeletePlatformDialog
        platformName={platformName}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </Panel>
  );
};

type DangerZoneSectionProps = {
  platformName: string;
  selfHosted: boolean;
};
