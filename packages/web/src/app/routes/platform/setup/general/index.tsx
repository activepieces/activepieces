import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { CenteredPage } from '@/app/components/centered-page';
import { AppearanceSection } from '@/app/routes/platform/setup/general/appearance-section';
import { Separator } from '@/components/ui/separator';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { DangerZoneSection } from './danger-zone-section';

export const GeneralPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: user } = userHooks.useCurrentUser();

  const canDeletePlatform =
    edition === ApEdition.CLOUD && platform.ownerId === user?.id;

  return (
    <CenteredPage
      title={t('General')}
      description={t('Change the settings for your platform.')}
    >
      <AppearanceSection />
      {canDeletePlatform && (
        <>
          <Separator className="my-8" />
          <DangerZoneSection platformName={platform.name} />
        </>
      )}
    </CenteredPage>
  );
};

export default GeneralPage;
