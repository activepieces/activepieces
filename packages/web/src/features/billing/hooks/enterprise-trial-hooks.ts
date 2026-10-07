import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  EnterpriseTrialState,
  EnterpriseTrialStatus,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { platformBillingApi } from '../api/billing-plans-api';
import { billingUtils } from '../utils/billing-utils';

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
  useTrial: (): EnterpriseTrial => {
    const { platform } = platformHooks.useCurrentPlatform();
    const { data: status } = enterpriseTrialHooks.useStatus();
    const { embedState } = useEmbedding();
    const isPlatformAdmin = useIsPlatformAdmin();
    const basePlanName = toBasePlanName(platform.plan.plan);
    if (embedState.isEmbedded) {
      return NO_TRIAL;
    }
    const planEndsAt = platform.plan.enterpriseTrialEndsAt;
    const liveFromPlan =
      !isNil(planEndsAt) && dayjs(planEndsAt).isAfter(dayjs());
    if (status?.state === 'active' && !isNil(status.endsAt)) {
      return toActiveTrial({
        endsAt: status.endsAt,
        isPlatformAdmin,
        basePlanName,
      });
    }
    if (liveFromPlan) {
      return toActiveTrial({
        endsAt: planEndsAt,
        isPlatformAdmin,
        basePlanName,
      });
    }
    if (isNil(status) || status.state === 'active') {
      return NO_TRIAL;
    }
    return {
      ...NO_TRIAL,
      state: status.state,
      endsAt: isNil(status.endsAt) ? null : new Date(status.endsAt),
      isPlatformAdmin,
      basePlanName,
    };
  },
  useLiveTrialEndsAt: (): Date | null => {
    const trial = enterpriseTrialHooks.useTrial();
    return trial.state === 'active' ? trial.endsAt : null;
  },
};

export function enterpriseTrialKey(platformId: string) {
  return ['enterprise-trial', platformId] as const;
}

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

function toBasePlanName(plan: string | null | undefined): string {
  if (!billingUtils.isPaidPlan(plan)) {
    return 'Free';
  }
  return plan.charAt(0).toUpperCase() + plan.slice(1).replace(/_/g, ' ');
}

function toActiveTrial({
  endsAt,
  isPlatformAdmin,
  basePlanName,
}: {
  endsAt: string | Date;
  isPlatformAdmin: boolean;
  basePlanName: string;
}): EnterpriseTrial {
  const end = dayjs(endsAt);
  const hoursLeft = Math.max(0, end.diff(dayjs(), 'hour'));
  const daysLeft = Math.max(1, Math.ceil(hoursLeft / 24));
  return {
    state: 'active',
    endsAt: end.toDate(),
    hoursLeft,
    daysLeft,
    elapsedRatio: Math.min(
      1,
      Math.max(0, 1 - hoursLeft / (ENTERPRISE_TRIAL_DAYS * 24)),
    ),
    endingSoon: hoursLeft <= ENDING_SOON_HOURS,
    lastDay: hoursLeft <= LAST_DAY_HOURS,
    isPlatformAdmin,
    basePlanName,
  };
}

const NO_TRIAL: EnterpriseTrial = {
  state: 'none',
  endsAt: null,
  hoursLeft: 0,
  daysLeft: 0,
  elapsedRatio: 0,
  endingSoon: false,
  lastDay: false,
  isPlatformAdmin: false,
  basePlanName: 'Free',
};

export const ENTERPRISE_TRIAL_DAYS = 7;
const ENDING_SOON_HOURS = 48;
const LAST_DAY_HOURS = 36;

export type EnterpriseTrial = {
  state: EnterpriseTrialState | 'none';
  endsAt: Date | null;
  hoursLeft: number;
  daysLeft: number;
  elapsedRatio: number;
  endingSoon: boolean;
  lastDay: boolean;
  isPlatformAdmin: boolean;
  basePlanName: string;
};
