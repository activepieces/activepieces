import { PlanName } from '@activepieces/shared';
import { beforeAll, describe, expect, it } from 'vitest';

import { billingUtils } from '@/features/billing/utils/billing-utils';

import { icuI18n } from '../../../i18n/icu-i18n';

beforeAll(async () => {
  await icuI18n.init();
});

describe('billingUtils.planDisplayName', () => {
  it('prefers the Autumn plan name', () => {
    expect(
      billingUtils.planDisplayName({
        autumnPlanName: 'Business',
        plan: { plan: 'plus' },
      }),
    ).toBe('Business');
  });

  it('falls back to the paid plan id', () => {
    expect(
      billingUtils.planDisplayName({
        autumnPlanName: null,
        plan: { plan: 'plus' },
      }),
    ).toBe('plus');
  });

  it('says Free for the free plan, no plan, or no billing info', () => {
    expect(
      billingUtils.planDisplayName({
        autumnPlanName: null,
        plan: { plan: PlanName.FREE },
      }),
    ).toBe('Free');
    expect(
      billingUtils.planDisplayName({
        autumnPlanName: null,
        plan: { plan: null },
      }),
    ).toBe('Free');
    expect(billingUtils.planDisplayName(undefined)).toBe('Free');
  });
});
