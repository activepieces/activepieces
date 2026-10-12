import { ApEdition } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { enterpriseTrialFeatures } from '@/features/billing/utils/enterprise-trial-features';
import { planTiers } from '@/features/billing/utils/plan-tiers';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const labelFor = ({
  featureKey,
  edition,
}: {
  featureKey: Parameters<typeof planTiers.tierOfFeature>[0];
  edition: ApEdition;
}) => planTiers.includedInLabel(planTiers.namedTier({ featureKey, edition }));

const pausedTitles = (plan: string | null) =>
  enterpriseTrialFeatures
    .pausedAfterTrial(plan)
    .map((feature) => feature.title);

describe('plan naming on locked screens', () => {
  it('names the lowest Cloud plan that includes the feature', () => {
    expect(
      labelFor({ featureKey: 'UNIVERSAL_AI', edition: ApEdition.CLOUD }),
    ).toBe('Included in the Plus plan and up');
    expect(labelFor({ featureKey: 'SSO', edition: ApEdition.CLOUD })).toBe(
      'Included in the Team plan and up',
    );
    expect(labelFor({ featureKey: 'PROJECTS', edition: ApEdition.CLOUD })).toBe(
      'Included in the Team plan and up',
    );
    expect(
      labelFor({ featureKey: 'AUDIT_LOGS', edition: ApEdition.CLOUD }),
    ).toBe('Included in the Enterprise plan');
  });

  it('always names the Enterprise plan on self-hosted editions', () => {
    for (const edition of [ApEdition.COMMUNITY, ApEdition.ENTERPRISE]) {
      for (const featureKey of [
        'UNIVERSAL_AI',
        'SSO',
        'PROJECTS',
        'AUDIT_LOGS',
      ] as const) {
        expect(labelFor({ featureKey, edition })).toBe(
          'Included in the Enterprise plan',
        );
      }
    }
  });

  it('treats unlimited users as an Enterprise plan feature', () => {
    expect(labelFor({ featureKey: 'USERS', edition: ApEdition.CLOUD })).toBe(
      'Included in the Enterprise plan',
    );
  });
});

describe('plan ids', () => {
  it('reads the tier from the plan id, including annual and custom ids', () => {
    expect(planTiers.tierOfPlan('free')).toBeNull();
    expect(planTiers.tierOfPlan('plus_annual')).toBe('plus');
    expect(planTiers.tierOfPlan('team')).toBe('team');
    expect(planTiers.tierOfPlan('enterprise_custom')).toBe('enterprise');
    expect(planTiers.tierOfPlan('enterprise_trial')).toBeNull();
  });
});

describe('features the admin loses when the trial ends', () => {
  it('pauses everything on Cloud Free and self-hosted', () => {
    expect(pausedTitles('free')).toHaveLength(
      enterpriseTrialFeatures.list().length,
    );
    expect(pausedTitles(null)).toHaveLength(
      enterpriseTrialFeatures.list().length,
    );
  });

  it('keeps AI Center on the Plus plan', () => {
    expect(pausedTitles('plus')).not.toContain('AI Center');
    expect(pausedTitles('plus')).toContain('Single sign-on');
  });

  it('keeps the Team features on the Team plan', () => {
    const paused = pausedTitles('team');
    expect(paused).not.toContain('Single sign-on');
    expect(paused).not.toContain('AI Center');
    expect(paused).not.toContain('Custom roles');
    expect(paused).not.toContain('Global connections');
    expect(paused).toContain('Audit logs');
    expect(paused).toContain('Unlimited users and projects');
  });

  it('pauses nothing on a paid Enterprise plan', () => {
    expect(pausedTitles('enterprise')).toEqual([]);
  });
});
