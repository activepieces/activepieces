import { isEmpty, isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { useEffect, useRef, useState } from 'react';

import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  clearStashedTrialKey,
  readStashedTrialKey,
} from '@/lib/automatic-trial-activation';

import { ActivateLicenseDialog } from './activate-license-dialog';

export const AutomaticTrialActivation = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isPlatformAdmin = useIsPlatformAdmin();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) {
      return;
    }
    const licenseKey = readStashedTrialKey();
    if (isNil(licenseKey)) {
      return;
    }
    consumed.current = true;
    clearStashedTrialKey();
    const platformLicenseKey = platform.plan.licenseKey;
    const alreadyLicensed =
      !isNil(platformLicenseKey) && !isEmpty(platformLicenseKey);
    if (
      edition === ApEdition.COMMUNITY ||
      !isPlatformAdmin ||
      alreadyLicensed
    ) {
      return;
    }
    setPendingKey(licenseKey);
  }, [edition, isPlatformAdmin, platform.plan.licenseKey]);

  if (isNil(pendingKey)) {
    return null;
  }

  return (
    <ActivateLicenseDialog
      isOpen
      onOpenChange={() => setPendingKey(null)}
      isTrialKey
      initialLicenseKey={pendingKey}
      autoSubmit
    />
  );
};
