import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  EnterpriseTrialState,
  EnterpriseTrialStatus,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useReducer } from 'react';

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
      refetchInterval: (query) => refetchAfterTrialEnds(query.state.data),
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
    useRerenderAt(
      status?.state === 'active'
        ? status.endsAt
        : platform.plan.enterpriseTrialEndsAt,
    );
    if (embedState.isEmbedded) {
      return NO_TRIAL;
    }
    const planEndsAt = platform.plan.enterpriseTrialEndsAt;
    const liveFromPlan =
      !isNil(planEndsAt) && dayjs(planEndsAt).isAfter(dayjs());
    if (
      status?.state === 'active' &&
      !isNil(status.endsAt) &&
      !dayjs(status.endsAt).isAfter(dayjs())
    ) {
      return {
        ...NO_TRIAL,
        state: 'ended',
        endsAt: new Date(status.endsAt),
        isPlatformAdmin,
        basePlanName,
      };
    }
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

function useRerenderAt(moment: string | Date | null | undefined): void {
  const [, rerender] = useReducer((tick: number) => tick + 1, 0);
  const at = isNil(moment) ? null : dayjs(moment).valueOf();
  useEffect(() => {
    if (isNil(at)) {
      return;
    }
    const delay = at - Date.now();
    if (delay <= 0 || delay > MAX_TIMER_MS) {
      return;
    }
    const timer = setTimeout(rerender, delay + END_GRACE_MS);
    return () => clearTimeout(timer);
  }, [at]);
}

function refetchAfterTrialEnds(
  status: EnterpriseTrialStatus | undefined,
): number | false {
  if (status?.state !== 'active' || isNil(status.endsAt)) {
    return false;
  }
  const msUntilEnd = dayjs(status.endsAt).diff(dayjs());
  if (msUntilEnd <= 0) {
    return EXPIRED_POLL_MS;
  }
  return Math.min(msUntilEnd + END_GRACE_MS, MAX_POLL_MS);
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
const END_GRACE_MS = 5 * 1000;
const EXPIRED_POLL_MS = 60 * 1000;
const MAX_POLL_MS = 60 * 60 * 1000;
const MAX_TIMER_MS = 2 ** 31 - 1;
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
