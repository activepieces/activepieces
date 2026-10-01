import { ApEdition, ApFlagId } from '@activepieces/shared';

import { AppearanceSection } from '@/app/routes/platform/setup/general/appearance-section';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { DangerZoneSection } from './danger-zone-section';
import { PlatformOwnerRow } from './platform-owner-row';

export const GeneralPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: user } = userHooks.useCurrentUser();

  const isCloud = edition === ApEdition.CLOUD;
  const isOwner = platform.ownerId === user?.id;

  return (
    <AppearanceSection
      ownerRow={<PlatformOwnerRow ownerId={platform.ownerId} />}
      dangerZone={
        !isCloud || isOwner ? (
          <DangerZoneSection
            platformName={platform.name}
            selfHosted={!isCloud}
          />
        ) : null
      }
    />
  );
};
