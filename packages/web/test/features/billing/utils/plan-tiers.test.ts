import { ApEdition } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import type { FeatureKey } from '@/features/billing/components/request-trial';
import { planTiers } from '@/features/billing/utils/plan-tiers';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const SELF_HOSTED_FEATURES: FeatureKey[] = [
  'UNIVERSAL_AI',
  'SSO',
  'PROJECTS',
  'AUDIT_LOGS',
];

describe('plan naming on locked screens', () => {
  it.each([
    { featureKey: 'UNIVERSAL_AI', edition: ApEdition.CLOUD, tier: 'plus' },
    { featureKey: 'SSO', edition: ApEdition.CLOUD, tier: 'team' },
    { featureKey: 'PROJECTS', edition: ApEdition.CLOUD, tier: 'team' },
    { featureKey: 'AUDIT_LOGS', edition: ApEdition.CLOUD, tier: 'enterprise' },
    { featureKey: 'USERS', edition: ApEdition.CLOUD, tier: 'enterprise' },
    ...SELF_HOSTED_FEATURES.flatMap((featureKey) =>
      [ApEdition.COMMUNITY, ApEdition.ENTERPRISE].map((edition) => ({
        featureKey,
        edition,
        tier: 'enterprise',
      })),
    ),
  ] satisfies {
    featureKey: FeatureKey;
    edition: ApEdition;
    tier: string;
  }[])(
    'names $tier for $featureKey on $edition',
    ({ featureKey, edition, tier }) => {
      expect(planTiers.namedTier({ featureKey, edition })).toBe(tier);
    },
  );
});

describe('plan ids', () => {
  it.each([
    { plan: 'free', featureKey: 'UNIVERSAL_AI', included: false },
    { plan: 'plus_annual', featureKey: 'UNIVERSAL_AI', included: true },
    { plan: 'plus_annual', featureKey: 'SSO', included: false },
    { plan: 'team', featureKey: 'SSO', included: true },
    { plan: 'team', featureKey: 'AUDIT_LOGS', included: false },
    { plan: 'enterprise_custom', featureKey: 'AUDIT_LOGS', included: true },
    { plan: 'enterprise_trial', featureKey: 'UNIVERSAL_AI', included: false },
  ] satisfies {
    plan: string;
    featureKey: FeatureKey;
    included: boolean;
  }[])(
    '$plan includes $featureKey: $included',
    ({ plan, featureKey, included }) => {
      expect(planTiers.planIncludes({ plan, featureKey })).toBe(included);
    },
  );
});
