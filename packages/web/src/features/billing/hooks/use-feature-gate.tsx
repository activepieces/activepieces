import { LockedGem } from '../components/locked-gem';
import { FeatureKey } from '../components/request-trial';
import { FeatureTier } from '../utils/feature-tier';

import { billingDialogHooks } from './billing-dialog-hooks';

export function useFeatureGate({ locked, feature }: UseFeatureGateParams) {
  const { openDialog } = billingDialogHooks.useEnterpriseTrialDialogStore();

  return {
    locked,
    crown: locked ? <LockedGem /> : null,
    open: () => openDialog({ featureKey: feature.featureKey }),
  };
}

export type PlatformFeature = {
  featureKey: FeatureKey;
  title: string;
  description: string;
  bullets?: string[];
  tier?: FeatureTier;
  documentationUrl?: string;
  videoUrl?: string;
};

export type UseFeatureGateParams = {
  locked: boolean;
  feature: PlatformFeature;
};
