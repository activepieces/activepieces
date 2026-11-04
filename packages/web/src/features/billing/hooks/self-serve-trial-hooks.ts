import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlatformBillingInformation,
  SelfServeTrialState,
  SelfServeTrialStatus,
  UpgradeLocationInWebApp,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { platformBillingApi } from '../api/billing-plans-api';
import { enterpriseDocs } from '../utils/billing-utils';
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

export function useActionWhenLocked(): ActionWhenLocked {
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const { embedState } = useEmbedding();
  const shouldOfferTrial = selfServeTrialHooks.useShouldOfferTrial();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  if (edition === ApEdition.COMMUNITY) {
    return ActionWhenLocked.SWITCH_EDITION;
  }
  if (!isPlatformAdmin || embedState.isEmbedded) {
    return ActionWhenLocked.ASK_ADMIN;
  }
  if (shouldOfferTrial) {
    return ActionWhenLocked.START_TRIAL;
  }
  if (selfServeTrialTime.hasEnded(platform.selfServeTrial)) {
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
        locationInWebApp: UpgradeLocationInWebApp.DIALOG,
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
      enabled,
    });
  },
  useShouldOfferTrial: (): boolean => {
    const { data } = selfServeTrialHooks.useStatus();
    return data?.state === SelfServeTrialState.ELIGIBLE;
  },
  useStartSelfServeTrial: (
    onStarted?: (status: SelfServeTrialStatus) => void,
  ) => {
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
};

export const SELF_SERVE_TRIAL_DAYS = TRIAL_DAYS;

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
