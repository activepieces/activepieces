import {
  ConsumableFeatureId,
  CreditsBillableFeature,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { billingUtils } from '@/features/billing/utils/billing-utils';
import { formatUtils } from '@/lib/format-utils';

const creditsFeature: CreditsBillableFeature = {
  featureId: ConsumableFeatureId.AP_CREDITS,
  pricePerUnit: 5,
  billingUnits: 1000,
  interval: null,
  autoTopUp: null,
};

describe('billingUtils.creditsSeverity', () => {
  it('stays silent below the warning threshold', () => {
    expect(billingUtils.creditsSeverity(0)).toBe('default');
    expect(billingUtils.creditsSeverity(69)).toBe('default');
  });

  it('warns from 70% up to the error threshold', () => {
    expect(billingUtils.creditsSeverity(70)).toBe('warning');
    expect(billingUtils.creditsSeverity(89)).toBe('warning');
  });

  it('escalates to error from 90%', () => {
    expect(billingUtils.creditsSeverity(90)).toBe('error');
    expect(billingUtils.creditsSeverity(100)).toBe('error');
  });
});

describe('billingUtils.formatCredits', () => {
  it('spells out credit counts below one million', () => {
    expect(billingUtils.formatCredits(999_999)).toBe(
      formatUtils.formatNumber(999_999),
    );
    expect(billingUtils.formatCredits(0)).toBe(formatUtils.formatNumber(0));
  });

  it('switches to compact notation from one million', () => {
    expect(billingUtils.formatCredits(1_000_000)).toBe(
      formatUtils.formatNumberCompact(1_000_000),
    );
    expect(billingUtils.formatCredits(2_500_000)).toBe(
      formatUtils.formatNumberCompact(2_500_000),
    );
  });
});

describe('billingUtils.resolveCreditsAction', () => {
  it('offers an upgrade on a free plan, without waiting for subscription data', () => {
    expect(
      billingUtils.resolveCreditsAction({ isPaid: false, info: undefined }),
    ).toEqual({ kind: 'upgrade' });
  });

  it('offers an upgrade during a trial rather than a top-up', () => {
    expect(
      billingUtils.resolveCreditsAction({
        isPaid: true,
        info: { trialEndsAt: '2026-09-01T00:00:00.000Z', creditsFeature },
      }),
    ).toEqual({ kind: 'upgrade' });
  });

  it('offers auto recharge on a paid plan that sells credits', () => {
    expect(
      billingUtils.resolveCreditsAction({
        isPaid: true,
        info: { trialEndsAt: null, creditsFeature },
      }),
    ).toEqual({ kind: 'auto-recharge', feature: creditsFeature });
  });

  it('stays unknown while the paid plan subscription is still loading', () => {
    expect(
      billingUtils.resolveCreditsAction({ isPaid: true, info: undefined }),
    ).toEqual({ kind: 'unknown' });
  });

  it('stays unknown on a paid plan whose catalog sells no credits', () => {
    expect(
      billingUtils.resolveCreditsAction({
        isPaid: true,
        info: { trialEndsAt: null, creditsFeature: null },
      }),
    ).toEqual({ kind: 'unknown' });
  });
});
