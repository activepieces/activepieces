import { LockedGem } from '../components/locked-gem';
import { FeatureKey } from '../components/request-trial';
import { FeatureTier } from '../utils/feature-tier';

import { useOpenLockedFeature } from './use-enterprise-gate';

export function useFeatureGate({ locked, feature }: UseFeatureGateParams) {
  const openDialog = useOpenLockedFeature();

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
