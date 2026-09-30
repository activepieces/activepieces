import { hasActiveSubscription } from '@activepieces/shared';
import { t } from 'i18next';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { PageSection } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { platformHooks } from '@/hooks/platform-hooks';

import { DeletePlatformDialog } from './delete-platform-dialog';

export const DangerZoneSection = ({ platformName }: DangerZoneSectionProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const hasSubscription = hasActiveSubscription(platform.plan.plan);

  return (
    <PageSection title={t('Danger zone')}>
      <Panel flush>
        <SettingRows>
          <SettingRow
            title={t('Delete platform')}
            description={`${t(
              'Once deleted, your platform cannot be recovered.',
            )}${
              hasSubscription
                ? ` ${t(
                    'Cancel your subscription before deleting this platform.',
                  )}`
                : ''
            }`}
          >
            <Button
              variant="destructive"
              size="sm"
              disabled={hasSubscription}
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 />
              {t('Delete platform')}
            </Button>
          </SettingRow>
        </SettingRows>
      </Panel>
      <DeletePlatformDialog
        platformName={platformName}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </PageSection>
  );
};

type DangerZoneSectionProps = {
  platformName: string;
};
