import { isEmpty, isNil, tryCatchSync } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export const useStashTrialKeyFromUrl = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const licenseKey = searchParams.get(TRIAL_KEY_QUERY_PARAM)?.trim();
    if (isNil(licenseKey) || isEmpty(licenseKey)) {
      return;
    }
    stashTrialKey(licenseKey);
    const remaining = new URLSearchParams(searchParams);
    remaining.delete(TRIAL_KEY_QUERY_PARAM);
    setSearchParams(remaining, { replace: true });
  }, [searchParams, setSearchParams]);
};

export const AutomaticTrialActivation = () => {
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isPlatformAdmin = useIsPlatformAdmin();
  const { mutate: activateTrialKey } = platformHooks.useUpdateLisenceKey({
    queryClient,
    messages: {
      success: t('Your trial is active'),
      error: t('We could not start your trial, please contact sales'),
    },
  });
  const attempted = useRef(false);

  useEffect(() => {
    const licenseKey = readStashedTrialKey();
    if (isNil(licenseKey) || attempted.current) {
      return;
    }
    attempted.current = true;
    const platformLicenseKey = platform.plan.licenseKey;
    const alreadyLicensed =
      !isNil(platformLicenseKey) && !isEmpty(platformLicenseKey);
    if (
      edition === ApEdition.COMMUNITY ||
      !isPlatformAdmin ||
      alreadyLicensed
    ) {
      clearStashedTrialKey();
      return;
    }
    activateTrialKey(licenseKey, {
      onSettled: () => clearStashedTrialKey(),
    });
  }, [edition, isPlatformAdmin, platform.plan.licenseKey, activateTrialKey]);

  return null;
};

function readStashedTrialKey(): string | undefined {
  const { data } = tryCatchSync(() =>
    window.sessionStorage.getItem(STORAGE_KEY),
  );
  return isNil(data) || isEmpty(data) ? undefined : data;
}

function stashTrialKey(licenseKey: string): void {
  tryCatchSync(() => window.sessionStorage.setItem(STORAGE_KEY, licenseKey));
}

function clearStashedTrialKey(): void {
  tryCatchSync(() => window.sessionStorage.removeItem(STORAGE_KEY));
}

const STORAGE_KEY = 'ap-pending-trial-key';
const TRIAL_KEY_QUERY_PARAM = 'licenseKey';
