import { ApEdition, ApFlagId } from '@activepieces/shared';

import { flagsHooks } from '@/hooks/flags-hooks';

import { FeatureKey } from '../components/request-trial';
import { FeatureTier } from '../utils/feature-tier';
import { planTiers } from '../utils/plan-tiers';

export function usePlanTier(featureKey: FeatureKey | undefined): PlanTierInfo {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const tier = planTiers.namedTier({ featureKey, edition });
  return {
    tier,
    label: planTiers.includedInLabel(tier),
    isCloud: edition === ApEdition.CLOUD,
    isCommunity: edition === ApEdition.COMMUNITY,
  };
}

export type PlanTierInfo = {
  tier: FeatureTier;
  label: string;
  isCloud: boolean;
  isCommunity: boolean;
};
