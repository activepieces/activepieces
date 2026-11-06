import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlatformBillingInformation,
  SelfServeTrialState,
  SelfServeTrialInfo,
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
import { selfServeTrialFeatures } from '../utils/self-serve-trial-features';
import { TRIAL_DAYS } from '../utils/self-serve-trial-utils';

import {
  billingDialogHooks,
  SelfServeTrialDialogPayload,
} from './billing-dialog-hooks';
import { billingKeys, refreshBillingCaches } from './billing-hooks';
import { useUpgradeClick } from './use-upgrade-click';

export function useActionWhenLocked({
  featureKey,
}: {
  featureKey: FeatureKey | undefined;
}): ActionWhenLocked {
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
  if (
    shouldOfferTrial &&
    selfServeTrialFeatures.isIncludedInTrial(featureKey)
  ) {
    return ActionWhenLocked.START_TRIAL;
  }
  if (platform.selfServeTrial?.state === SelfServeTrialState.ENDED) {
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
  const actionWhenLocked = useActionWhenLocked({ featureKey });
  const openDialog = useOpenLockedFeature({ featureKey });
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

function useOpenLockedFeature({ featureKey }: { featureKey: FeatureKey }) {
  const actionWhenLocked = useActionWhenLocked({ featureKey });
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
    onStarted?: (status: SelfServeTrialInfo) => void,
  ) => {
    const queryClient = useQueryClient();
    const { platform } = platformHooks.useCurrentPlatform();
    return useMutation({
      mutationFn: platformBillingApi.startSelfServeTrial,
      onSuccess: (status: SelfServeTrialInfo) => {
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
