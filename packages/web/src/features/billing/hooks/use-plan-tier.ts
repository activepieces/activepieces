import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { FeatureKey } from '../components/request-trial';
import { FeatureTier } from '../utils/feature-tier';
import { planTiers } from '../utils/plan-tiers';

export function usePlanTier(featureKey: FeatureKey | undefined): PlanTierInfo {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { platform } = platformHooks.useCurrentPlatform();
  const tier = planTiers.namedTier({ featureKey, edition });
  const projectLimit = platform.plan.billedTeamProjectsLimit;
  const reachedOwnPlanLimit =
    isProjectsFeature(featureKey) &&
    !isNil(projectLimit) &&
    projectLimit > 0 &&
    planTiers.planIncludes({ plan: platform.plan.plan, featureKey });
  return {
    tier,
    label: reachedOwnPlanLimit
      ? t(
          "You've reached your plan's {count, plural, =1 {1 team project} other {# team projects}}",
          { count: projectLimit },
        )
      : planTiers.includedInLabel(tier),
    reachedOwnPlanLimit,
    isCloud: edition === ApEdition.CLOUD,
    isCommunity: edition === ApEdition.COMMUNITY,
  };
}

function isProjectsFeature(featureKey: FeatureKey | undefined): boolean {
  return featureKey === 'PROJECTS' || featureKey === 'TEAM';
}

export type PlanTierInfo = {
  tier: FeatureTier;
  label: string;
  reachedOwnPlanLimit: boolean;
  isCloud: boolean;
  isCommunity: boolean;
};
