import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlatformBillingInformation,
  SelfServeTrialState,
  SelfServeTrialStatus,
  PlatformAdminSurface,
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
import { billingUtils, enterpriseDocs } from '../utils/billing-utils';
import { FeatureKey, platformFeatures } from '../utils/platform-features';
import {
  selfServeTrialTime,
  TRIAL_DAYS,
} from '../utils/self-serve-trial-utils';

import {
  billingDialogHooks,
  SelfServeTrialDialogPayload,
} from './billing-dialog-hooks';
import { billingKeys, refreshBillingCaches } from './billing-hooks';
import { useUpgradeClick } from './use-upgrade-click';

function useCanManageSelfServeTrial(): boolean {
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
  const next = selfServeTrialTime.nextBoundary({ end, now: Date.now() });
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
  status: SelfServeTrialStatus | undefined,
): number | false {
  if (status?.state !== SelfServeTrialState.ACTIVE || isNil(status.endsAt)) {
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
  isPlatformAdmin,
  basePlanName,
}: {
  startedAt: string | Date | null | undefined;
  endsAt: string | Date;
  isPlatformAdmin: boolean;
  basePlanName: string;
}): SelfServeTrial {
  return {
    state: SelfServeTrialState.ACTIVE,
    ...selfServeTrialTime.activeTrialTiming({
      startedAt,
      endsAt,
      now: Date.now(),
    }),
    isPlatformAdmin,
    basePlanName,
  };
}

const NO_TRIAL: SelfServeTrial = {
  state: 'none',
  startedAt: null,
  endsAt: null,
  daysLeft: 0,
  endsToday: false,
  ending: false,
  justStarted: false,
  isPlatformAdmin: false,
  basePlanName: 'Free',
};

const useTrialClockTick = create<TrialClockTick>((set) => ({
  tick: 0,
  advance: () => set((clock) => ({ tick: clock.tick + 1 })),
}));

const trialClocks = new Map<number, TrialClock>();

const BOUNDARY_GRACE_MS = 5 * 1000;

const EXPIRED_POLL_MS = 60 * 1000;

const MAX_POLL_MS = 60 * 60 * 1000;

const MAX_TIMER_MS = 2 ** 31 - 1;

export function useActionWhenLocked(): ActionWhenLocked {
  const trial = selfServeTrialHooks.useTrial();
  const shouldOfferTrial = selfServeTrialHooks.useShouldOfferTrial();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  if (edition === ApEdition.COMMUNITY) {
    return ActionWhenLocked.SWITCH_EDITION;
  }
  if (!trial.isPlatformAdmin) {
    return ActionWhenLocked.ASK_ADMIN;
  }
  if (shouldOfferTrial) {
    return ActionWhenLocked.START_TRIAL;
  }
  if (trial.state === SelfServeTrialState.ENDED) {
    return ActionWhenLocked.UPGRADE_AFTER_TRIAL;
  }
  return ActionWhenLocked.UPGRADE;
}

export function useLockedFeature({
  unlocked,
  featureKey,
}: {
  unlocked: boolean;
  featureKey: FeatureKey;
}): LockedFeature {
  const actionWhenLocked = useActionWhenLocked();
  const openDialog = useOpenLockedFeature();
  const locked = !unlocked;

  const runOrShowLockedDialog: LockedFeature['runOrShowLockedDialog'] = (
    postTrialActivationCallback,
  ) => {
    if (!locked) {
      Promise.resolve(postTrialActivationCallback()).catch(() => undefined);
      return;
    }
    if (actionWhenLocked === ActionWhenLocked.SWITCH_EDITION) {
      window.open(enterpriseDocs.switchToEnterpriseUrl, '_blank', 'noopener');
      return;
    }
    openDialog({ featureKey, postTrialActivationCallback });
  };

  const showLockedDialog = () => openDialog({ featureKey });

  return { actionWhenLocked, locked, runOrShowLockedDialog, showLockedDialog };
}

function useOpenLockedFeature() {
  const actionWhenLocked = useActionWhenLocked();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { openDialog } = billingDialogHooks.useSelfServeTrialDialogStore();
  const upgradeClick = useUpgradeClick();

  return (payload: SelfServeTrialDialogPayload) => {
    if (actionWhenLocked === ActionWhenLocked.UPGRADE_AFTER_TRIAL) {
      upgradeClick({
        feature: payload.featureKey,
        plan: platformFeatures.planThatHasFeature({
          featureKey: payload.featureKey,
          edition,
        }),
        surface: PlatformAdminSurface.DIALOG,
      });
      return;
    }
    openDialog(payload);
  };
}

export const selfServeTrialHooks = {
  useStatus: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    const enabled = useCanManageSelfServeTrial();
    return useQuery({
      queryKey: billingKeys.platformSubscription(platform.id),
      queryFn: platformBillingApi.getSubscriptionInfo,
      select: (info: PlatformBillingInformation) => info.selfServeTrial,
      staleTime: 60 * 1000,
      refetchInterval: (query) =>
        refetchAfterTrialEnds(query.state.data?.selfServeTrial),
      enabled,
    });
  },
  useShouldOfferTrial: (): boolean => {
    const { data } = selfServeTrialHooks.useStatus();
    return data?.state === SelfServeTrialState.ELIGIBLE;
  },
  useStart: (onStarted?: (status: SelfServeTrialStatus) => void) => {
    const queryClient = useQueryClient();
    const { platform } = platformHooks.useCurrentPlatform();
    return useMutation({
      mutationFn: platformBillingApi.startSelfServeTrial,
      onSuccess: (status: SelfServeTrialStatus) => {
        queryClient.setQueryData<PlatformBillingInformation>(
          billingKeys.platformSubscription(platform.id),
          (info) => (isNil(info) ? info : { ...info, selfServeTrial: status }),
        );
        refreshBillingCaches(queryClient);
        onStarted?.(status);
      },
      onError: () => {
        refreshBillingCaches(queryClient);
      },
    });
  },
  useTrial: (): SelfServeTrial => {
    const { platform } = platformHooks.useCurrentPlatform();
    const { data: status } = selfServeTrialHooks.useStatus();
    const { embedState } = useEmbedding();
    const isPlatformAdmin = useIsPlatformAdmin();
    const basePlanName = toBasePlanName(platform.plan.plan);
    useTrialClock(
      status?.state === SelfServeTrialState.ACTIVE
        ? status.endsAt
        : platform.selfServeTrial?.endsAt,
    );
    if (embedState.isEmbedded) {
      return NO_TRIAL;
    }
    const planEndsAt = platform.selfServeTrial?.endsAt;
    if (status?.state === SelfServeTrialState.ACTIVE && !isNil(status.endsAt)) {
      if (!dayjs(status.endsAt).isAfter(dayjs())) {
        return {
          ...NO_TRIAL,
          state: SelfServeTrialState.ENDED,
          endsAt: new Date(status.endsAt),
          isPlatformAdmin,
          basePlanName,
        };
      }
      return toActiveTrial({
        startedAt: status.startedAt ?? platform.selfServeTrial?.startedAt,
        endsAt: status.endsAt,
        isPlatformAdmin,
        basePlanName,
      });
    }
    if (!isNil(planEndsAt) && dayjs(planEndsAt).isAfter(dayjs())) {
      return toActiveTrial({
        startedAt: platform.selfServeTrial?.startedAt,
        endsAt: planEndsAt,
        isPlatformAdmin,
        basePlanName,
      });
    }
    if (isNil(status) || status.state === SelfServeTrialState.ACTIVE) {
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

export const SELF_SERVE_TRIAL_DAYS = TRIAL_DAYS;

type TrialClockTick = {
  tick: number;
  advance: () => void;
};

type TrialClock = {
  subscribers: number;
  timer: ReturnType<typeof setTimeout> | null;
};

export type SelfServeTrial = {
  state: SelfServeTrialState | 'none';
  startedAt: Date | null;
  endsAt: Date | null;
  daysLeft: number;
  endsToday: boolean;
  ending: boolean;
  justStarted: boolean;
  isPlatformAdmin: boolean;
  basePlanName: string;
};

export enum ActionWhenLocked {
  SWITCH_EDITION = 'switch_edition',
  ASK_ADMIN = 'ask_admin',
  START_TRIAL = 'start_trial',
  UPGRADE_AFTER_TRIAL = 'upgrade_after_trial',
  UPGRADE = 'upgrade',
}

export type LockedFeature = {
  actionWhenLocked: ActionWhenLocked;
  locked: boolean;
  runOrShowLockedDialog: (
    postTrialActivationCallback: () => Promise<unknown> | void,
  ) => void;
  showLockedDialog: () => void;
};
