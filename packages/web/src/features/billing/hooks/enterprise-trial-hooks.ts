import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  EnterpriseTrialState,
  EnterpriseTrialStatus,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { useEffect, useReducer } from 'react';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { platformBillingApi } from '../api/billing-plans-api';
import { billingUtils } from '../utils/billing-utils';
import {
  enterpriseTrialTime,
  TRIAL_DAYS,
} from '../utils/enterprise-trial-time';

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
  useStart: (onStarted?: (status: EnterpriseTrialStatus) => void) => {
    const queryClient = useQueryClient();
    const { platform } = platformHooks.useCurrentPlatform();
    return useMutation({
      mutationFn: platformBillingApi.startEnterpriseTrial,
      onSuccess: (status: EnterpriseTrialStatus) => {
        queryClient.setQueryData(enterpriseTrialKey(platform.id), status);
        refreshBillingCaches(queryClient);
        onStarted?.(status);
      },
    });
  },
  useTrial: (): EnterpriseTrial => {
    const { platform } = platformHooks.useCurrentPlatform();
    const { data: status } = enterpriseTrialHooks.useStatus();
    const { embedState } = useEmbedding();
    const isPlatformAdmin = useIsPlatformAdmin();
    const basePlanName = toBasePlanName(platform.plan.plan);
    useTrialClock(
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
        startedAt: status.startedAt ?? platform.plan.enterpriseTrialStartedAt,
        endsAt: status.endsAt,
        extended: status.extended,
        isPlatformAdmin,
        basePlanName,
      });
    }
    if (liveFromPlan) {
      return toActiveTrial({
        startedAt: platform.plan.enterpriseTrialStartedAt,
        endsAt: planEndsAt,
        extended: false,
        isPlatformAdmin,
        basePlanName,
      });
    }
    if (isNil(status) || status.state === 'active') {
      return { ...NO_TRIAL, isPlatformAdmin, basePlanName };
    }
    return {
      ...NO_TRIAL,
      state: status.state,
      endsAt: isNil(status.endsAt) ? null : new Date(status.endsAt),
      isPlatformAdmin,
      basePlanName,
    };
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

function useTrialClock(endsAt: string | Date | null | undefined): void {
  const queryClient = useQueryClient();
  const [tick, rerender] = useReducer((count: number) => count + 1, 0);
  const end = isNil(endsAt) ? null : dayjs(endsAt).valueOf();
  useEffect(() => {
    if (isNil(end)) {
      return;
    }
    const next = enterpriseTrialTime.nextBoundary({ end, now: Date.now() });
    if (isNil(next) || next - Date.now() > MAX_TIMER_MS) {
      return;
    }
    const timer = setTimeout(() => {
      if (Date.now() >= end) {
        queryClient
          .invalidateQueries({ queryKey: ['platform'] })
          .catch(() => undefined);
      }
      rerender();
    }, next - Date.now() + BOUNDARY_GRACE_MS);
    return () => clearTimeout(timer);
  }, [end, tick, queryClient]);
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
  return Math.min(msUntilEnd + BOUNDARY_GRACE_MS, MAX_POLL_MS);
}

function toBasePlanName(plan: string | null | undefined): string {
  if (!billingUtils.isPaidPlan(plan)) {
    return t('Free');
  }
  return plan.charAt(0).toUpperCase() + plan.slice(1).replace(/_/g, ' ');
}

function toActiveTrial({
  startedAt,
  endsAt,
  extended,
  isPlatformAdmin,
  basePlanName,
}: {
  startedAt: string | Date | null | undefined;
  endsAt: string | Date;
  extended: boolean;
  isPlatformAdmin: boolean;
  basePlanName: string;
}): EnterpriseTrial {
  return {
    state: 'active',
    ...enterpriseTrialTime.activeTrialTiming({
      startedAt,
      endsAt,
      now: Date.now(),
    }),
    extended,
    isPlatformAdmin,
    basePlanName,
  };
}

const NO_TRIAL: EnterpriseTrial = {
  state: 'none',
  startedAt: null,
  endsAt: null,
  daysLeft: 0,
  endsToday: false,
  ending: false,
  justStarted: false,
  extended: false,
  isPlatformAdmin: false,
  basePlanName: 'Free',
};

export const ENTERPRISE_TRIAL_DAYS = TRIAL_DAYS;
const BOUNDARY_GRACE_MS = 5 * 1000;
const EXPIRED_POLL_MS = 60 * 1000;
const MAX_POLL_MS = 60 * 60 * 1000;
const MAX_TIMER_MS = 2 ** 31 - 1;

export type EnterpriseTrial = {
  state: EnterpriseTrialState | 'none';
  startedAt: Date | null;
  endsAt: Date | null;
  daysLeft: number;
  endsToday: boolean;
  ending: boolean;
  justStarted: boolean;
  extended: boolean;
  isPlatformAdmin: boolean;
  basePlanName: string;
};
