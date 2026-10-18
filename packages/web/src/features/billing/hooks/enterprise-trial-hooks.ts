import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  EnterpriseTrialState,
  EnterpriseTrialStatus,
} from '@activepieces/shared';
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { useEffect } from 'react';
import { create } from 'zustand';

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
      onError: () => {
        queryClient
          .invalidateQueries({ queryKey: enterpriseTrialKey(platform.id) })
          .catch(() => undefined);
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
    useTrialClock(
      status?.state === 'active'
        ? status.endsAt
        : platform.plan.enterpriseTrialEndsAt,
    );
    if (embedState.isEmbedded) {
      return NO_TRIAL;
    }
    const planEndsAt = platform.plan.enterpriseTrialEndsAt;
    if (status?.state === 'active' && !isNil(status.endsAt)) {
      if (!dayjs(status.endsAt).isAfter(dayjs())) {
        return {
          ...NO_TRIAL,
          state: 'ended',
          endsAt: new Date(status.endsAt),
          isPlatformAdmin,
          basePlanName,
        };
      }
      return toActiveTrial({
        startedAt: status.startedAt ?? platform.plan.enterpriseTrialStartedAt,
        endsAt: status.endsAt,
        extended: status.extended,
        isPlatformAdmin,
        basePlanName,
      });
    }
    if (!isNil(planEndsAt) && dayjs(planEndsAt).isAfter(dayjs())) {
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
  useTrialClockTick((clock) => clock.tick);
  const end = isNil(endsAt) ? null : dayjs(endsAt).valueOf();
  useEffect(() => {
    if (isNil(end)) {
      return;
    }
    return subscribeToTrialClock({ end, queryClient });
  }, [end, queryClient]);
}

function subscribeToTrialClock({
  end,
  queryClient,
}: {
  end: number;
  queryClient: QueryClient;
}): () => void {
  const clock = trialClocks.get(end) ?? { subscribers: 0, timer: null };
  clock.subscribers += 1;
  trialClocks.set(end, clock);
  if (isNil(clock.timer)) {
    scheduleTrialBoundary({ end, queryClient });
  }
  return () => {
    clock.subscribers -= 1;
    if (clock.subscribers > 0) {
      return;
    }
    if (!isNil(clock.timer)) {
      clearTimeout(clock.timer);
    }
    trialClocks.delete(end);
  };
}

function scheduleTrialBoundary({
  end,
  queryClient,
}: {
  end: number;
  queryClient: QueryClient;
}): void {
  const clock = trialClocks.get(end);
  if (isNil(clock)) {
    return;
  }
  const next = enterpriseTrialTime.nextBoundary({ end, now: Date.now() });
  if (isNil(next) || next - Date.now() > MAX_TIMER_MS) {
    clock.timer = null;
    return;
  }
  clock.timer = setTimeout(() => {
    clock.timer = null;
    if (Date.now() >= end) {
      queryClient
        .invalidateQueries({ queryKey: ['platform'] })
        .catch(() => undefined);
    }
    useTrialClockTick.getState().advance();
    scheduleTrialBoundary({ end, queryClient });
  }, next - Date.now() + BOUNDARY_GRACE_MS);
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

const useTrialClockTick = create<TrialClockTick>((set) => ({
  tick: 0,
  advance: () => set((clock) => ({ tick: clock.tick + 1 })),
}));

const trialClocks = new Map<number, TrialClock>();

type TrialClockTick = {
  tick: number;
  advance: () => void;
};

type TrialClock = {
  subscribers: number;
  timer: ReturnType<typeof setTimeout> | null;
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
