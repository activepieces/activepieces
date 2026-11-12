import { ApEdition, PlanName } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import type { FeatureKey } from '@/features/billing/utils/platform-features';
import { platformFeatures } from '@/features/billing/utils/platform-features';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const SELF_HOSTED_FEATURES: FeatureKey[] = [
  'UNIVERSAL_AI',
  'SSO',
  'PROJECTS',
  'AUDIT_LOGS',
];

describe('plan named on locked screens', () => {
  it.each([
    { featureKey: 'UNIVERSAL_AI', edition: ApEdition.CLOUD, plan: PlanName.PLUS },
    { featureKey: 'SSO', edition: ApEdition.CLOUD, plan: PlanName.TEAM },
    { featureKey: 'PROJECTS', edition: ApEdition.CLOUD, plan: PlanName.TEAM },
    {
      featureKey: 'AUDIT_LOGS',
      edition: ApEdition.CLOUD,
      plan: PlanName.ENTERPRISE,
    },
    { featureKey: 'USERS', edition: ApEdition.CLOUD, plan: PlanName.ENTERPRISE },
    ...SELF_HOSTED_FEATURES.flatMap((featureKey) =>
      [ApEdition.COMMUNITY, ApEdition.ENTERPRISE].map((edition) => ({
        featureKey,
        edition,
        plan: PlanName.ENTERPRISE,
      })),
    ),
  ] satisfies {
    featureKey: FeatureKey;
    edition: ApEdition;
    plan: PlanName;
  }[])(
    'names $plan for $featureKey on $edition',
    ({ featureKey, edition, plan }) => {
      expect(platformFeatures.planThatHasFeature({ featureKey, edition })).toBe(
        plan,
      );
    },
  );
});
