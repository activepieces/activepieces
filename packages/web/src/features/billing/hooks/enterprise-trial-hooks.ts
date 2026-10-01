import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  EnterpriseTrialStatus,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { platformBillingApi } from '../api/billing-plans-api';

import { refreshBillingCaches } from './billing-hooks';

export const enterpriseTrialHooks = {
  useStatus: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    const enabled = useCanManageEnterpriseTrial();
    return useQuery({
      queryKey: enterpriseTrialKey(platform.id),
      queryFn: platformBillingApi.getEnterpriseTrial,
      staleTime: 60 * 1000,
      enabled,
    });
  },
  useOffer: (): boolean => {
    const { data } = enterpriseTrialHooks.useStatus();
    return data?.state === 'eligible';
  },
  useStart: () => {
    const queryClient = useQueryClient();
    const { platform } = platformHooks.useCurrentPlatform();
    return useMutation({
      mutationFn: platformBillingApi.startEnterpriseTrial,
      onSuccess: (status: EnterpriseTrialStatus) => {
        queryClient.setQueryData(enterpriseTrialKey(platform.id), status);
        refreshBillingCaches(queryClient);
      },
    });
  },
  useLiveTrialEndsAt: (): Date | null => {
    const { platform } = platformHooks.useCurrentPlatform();
    const endsAt = platform.plan.enterpriseTrialEndsAt;
    if (isNil(endsAt)) {
      return null;
    }
    const date = new Date(endsAt);
    return date.getTime() > Date.now() ? date : null;
  },
};

function useCanManageEnterpriseTrial(): boolean {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isPlatformAdmin = useIsPlatformAdmin();
  const { embedState } = useEmbedding();
  return (
    edition !== ApEdition.COMMUNITY &&
    !isNil(edition) &&
    isPlatformAdmin &&
    !embedState.isEmbedded
  );
}

function enterpriseTrialKey(platformId: string) {
  return ['enterprise-trial', platformId] as const;
}
