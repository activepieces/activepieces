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

function useTrialClock(endsAt: string | Date | null | undefined): void {
  const queryClient = useQueryClient();
  const [tick, rerender] = useReducer((count: number) => count + 1, 0);
  const end = isNil(endsAt) ? null : dayjs(endsAt).valueOf();
  useEffect(() => {
    if (isNil(end)) {
      return;
    }
    const next = nextTrialBoundary({ end, now: Date.now() });
    if (isNil(next)) {
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

function nextTrialBoundary({
  end,
  now,
}: {
  end: number;
  now: number;
}): number | null {
  const candidates = [
    end - LAST_DAY_HOURS * HOUR_MS,
    end,
    dayjs(now).add(1, 'day').startOf('day').valueOf(),
  ].filter((moment) => moment > now && moment <= end + HOUR_MS);
  if (candidates.length === 0) {
    return null;
  }
  const next = Math.min(...candidates);
  return next - now > MAX_TIMER_MS ? null : next;
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
  const endsTodayOrTomorrow = !end.isAfter(dayjs().add(1, 'day').endOf('day'));
  return {
    state: 'active',
    endsAt: end.toDate(),
    daysLeft: Math.max(1, Math.ceil(hoursLeft / 24)),
    endingSoon: endsTodayOrTomorrow,
    lastDay: hoursLeft <= LAST_DAY_HOURS,
    isPlatformAdmin,
    basePlanName,
  };
}

const NO_TRIAL: EnterpriseTrial = {
  state: 'none',
  endsAt: null,
  daysLeft: 0,
  endingSoon: false,
  lastDay: false,
  isPlatformAdmin: false,
  basePlanName: 'Free',
};

export const ENTERPRISE_TRIAL_DAYS = 7;
const LAST_DAY_HOURS = 36;
const HOUR_MS = 60 * 60 * 1000;
const BOUNDARY_GRACE_MS = 5 * 1000;
const EXPIRED_POLL_MS = 60 * 1000;
const MAX_POLL_MS = 60 * 60 * 1000;
const MAX_TIMER_MS = 2 ** 31 - 1;

export type EnterpriseTrial = {
  state: EnterpriseTrialState | 'none';
  endsAt: Date | null;
  daysLeft: number;
  endingSoon: boolean;
  lastDay: boolean;
  isPlatformAdmin: boolean;
  basePlanName: string;
};
