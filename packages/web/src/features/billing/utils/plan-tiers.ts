import { isNil } from '@activepieces/core-utils';
import { ApEdition, PlanName } from '@activepieces/shared';
import { t } from 'i18next';

import { FeatureKey } from '../components/request-trial';

import { FeatureTier } from './feature-tier';
import { PLATFORM_FEATURES } from './platform-features';

function tierOfFeature(featureKey: FeatureKey | undefined): FeatureTier {
  if (featureKey === undefined) {
    return 'enterprise';
  }
  const listed = Object.values(PLATFORM_FEATURES).find(
    (feature) => feature.featureKey === featureKey,
  );
  return listed?.tier ?? EXTRA_TIERS[featureKey] ?? 'enterprise';
}

function tierOfPlan(plan: string | null | undefined): FeatureTier | null {
  if (isNil(plan) || plan === PlanName.ENTERPRISE_TRIAL) {
    return null;
  }
  const name = plan.toLowerCase();
  return (
    PLAN_TIER_ORDER.find(
      (tier) => name === tier || name.startsWith(`${tier}_`),
    ) ?? null
  );
}

function isEnterprisePlan(plan: string | null | undefined): boolean {
  return tierOfPlan(plan) === 'enterprise';
}

function planIncludes({
  plan,
  featureKey,
}: {
  plan: string | null | undefined;
  featureKey: FeatureKey | undefined;
}): boolean {
  const planTier = tierOfPlan(plan);
  if (isNil(planTier)) {
    return false;
  }
  return rank(planTier) >= rank(tierOfFeature(featureKey));
}

function namedTier({
  featureKey,
  edition,
}: {
  featureKey: FeatureKey | undefined;
  edition: ApEdition | null | undefined;
}): FeatureTier {
  return edition === ApEdition.CLOUD ? tierOfFeature(featureKey) : 'enterprise';
}

function includedInLabel(tier: FeatureTier): string {
  switch (tier) {
    case 'plus':
      return t('Included in the Plus plan and up');
    case 'team':
      return t('Included in the Team plan and up');
    case 'enterprise':
      return t('Included in the Enterprise plan');
  }
}

function badgeLabel(tier: FeatureTier): string {
  switch (tier) {
    case 'plus':
      return t('Plus plan and up');
    case 'team':
      return t('Team plan and up');
    case 'enterprise':
      return t('Enterprise plan');
  }
}

function askAdminText(tier: FeatureTier): string {
  switch (tier) {
    case 'plus':
      return t('Ask your admin to upgrade to the Plus plan or above.');
    case 'team':
      return t('Ask your admin to upgrade to the Team plan or above.');
    case 'enterprise':
      return t('Ask your admin to turn on the Enterprise plan for your team.');
  }
}

function rank(tier: FeatureTier): number {
  return PLAN_TIER_ORDER.indexOf(tier);
}

export const planTiers = {
  isEnterprisePlan,
  planIncludes,
  namedTier,
  includedInLabel,
  badgeLabel,
  askAdminText,
};

const PLAN_TIER_ORDER: FeatureTier[] = ['plus', 'team', 'enterprise'];

const EXTRA_TIERS: Partial<Record<FeatureKey, FeatureTier>> = {
  TEAM: 'team',
};
