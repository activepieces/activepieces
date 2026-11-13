import { ApEdition, ConsumableFeatureId, CreditsBillableFeature, InvitationStatus, UserStatus } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';
import { billingUtils, ShouldShowCreditsAlertParams, seatUtils } from '@/features/billing/utils/billing-utils';
import { formatUtils } from '@/lib/format-utils';
import dayjs from 'dayjs';

const creditsFeature: CreditsBillableFeature = {
  featureId: ConsumableFeatureId.AP_CREDITS,
  pricePerUnit: 5,
  billingUnits: 1000,
  interval: null,
  autoTopUp: null,
};

const enforcedAtWarning: ShouldShowCreditsAlertParams = {
  edition: ApEdition.CLOUD,
  isEmbedded: false,
  isProjectRoute: true,
  isUnlimited: false,
  isBillingEnforced: true,
  severity: 'warning',
  isDismissalActive: false,
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

  it('rounds a fractional credit count down to a whole credit', () => {
    expect(billingUtils.formatCredits(838.822)).toBe(
      formatUtils.formatNumber(838),
    );
    expect(billingUtils.formatCredits(0.9)).toBe(formatUtils.formatNumber(0));
  });

  it('rounds down before choosing compact notation', () => {
    expect(billingUtils.formatCredits(999_999.6)).toBe(
      formatUtils.formatNumber(999_999),
    );
  });
});

describe('billingUtils.shouldShowCreditsAlert', () => {
  it('shows a warning on an enforced platform that has not been dismissed', () => {
    expect(billingUtils.shouldShowCreditsAlert(enforcedAtWarning)).toBe(true);
  });

  it('stays hidden when credits are metered but not enforced', () => {
    expect(
      billingUtils.shouldShowCreditsAlert({
        ...enforcedAtWarning,
        isBillingEnforced: false,
      }),
    ).toBe(false);
  });

  it('stays hidden at the error severity when credits are not enforced', () => {
    expect(
      billingUtils.shouldShowCreditsAlert({
        ...enforcedAtWarning,
        isBillingEnforced: false,
        severity: 'error',
      }),
    ).toBe(false);
  });

  it('ignores a dismissal once usage reaches the error severity', () => {
    expect(
      billingUtils.shouldShowCreditsAlert({
        ...enforcedAtWarning,
        severity: 'error',
        isDismissalActive: true,
      }),
    ).toBe(true);
  });

  it('respects an active dismissal at the warning severity', () => {
    expect(
      billingUtils.shouldShowCreditsAlert({
        ...enforcedAtWarning,
        isDismissalActive: true,
      }),
    ).toBe(false);
  });

  it('stays hidden below the warning severity', () => {
    expect(
      billingUtils.shouldShowCreditsAlert({
        ...enforcedAtWarning,
        severity: 'default',
      }),
    ).toBe(false);
  });

  it('stays hidden on an unlimited balance', () => {
    expect(
      billingUtils.shouldShowCreditsAlert({
        ...enforcedAtWarning,
        isUnlimited: true,
      }),
    ).toBe(false);
  });

  it('stays hidden when embedded, off a project route, or on community edition', () => {
    expect(
      billingUtils.shouldShowCreditsAlert({
        ...enforcedAtWarning,
        isEmbedded: true,
      }),
    ).toBe(false);
    expect(
      billingUtils.shouldShowCreditsAlert({
        ...enforcedAtWarning,
        isProjectRoute: false,
      }),
    ).toBe(false);
    expect(
      billingUtils.shouldShowCreditsAlert({
        ...enforcedAtWarning,
        edition: ApEdition.COMMUNITY,
      }),
    ).toBe(false);
  });

  it('still shows while the edition flag is loading', () => {
    expect(
      billingUtils.shouldShowCreditsAlert({
        ...enforcedAtWarning,
        edition: null,
      }),
    ).toBe(true);
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

const NOW = new Date('2026-10-14T12:00:00Z');
const invite = ({ email, days = 1 }: { email: string; days?: number }) => ({
  email,
  status: InvitationStatus.PENDING,
  updated: dayjs(NOW).subtract(days, 'day').toISOString(),
});
const ACTIVE_AND_INACTIVE = [
  { email: 'a@x.com', status: UserStatus.ACTIVE },
  { email: 'b@x.com', status: UserStatus.INACTIVE },
];

describe('reserved seats', () => {
  it.each([
    {
      name: 'counts pending invitations like the server does',
      users: ACTIVE_AND_INACTIVE,
      invitations: [invite({ email: 'c@x.com' }), invite({ email: 'C@x.com' })],
      expected: 2,
    },
    {
      name: 'does not count an invitation for someone who is already a user',
      users: ACTIVE_AND_INACTIVE,
      invitations: [invite({ email: 'B@x.com' })],
      expected: 1,
    },
    {
      name: 'frees the seat of an invitation older than seven days',
      users: [{ email: 'a@x.com', status: UserStatus.ACTIVE }],
      invitations: [
        invite({ email: 'old@x.com', days: 8 }),
        invite({ email: 'new@x.com', days: 6 }),
      ],
      expected: 2,
    },
  ])('$name', ({ users, invitations, expected }) => {
    expect(seatUtils.reservedSeats({ users, invitations, now: NOW })).toBe(
      expected,
    );
  });
});
