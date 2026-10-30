/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SelfServeTrialBillingStatus } from '@/features/billing/components/current-subscription-card';

const state = vi.hoisted(() => ({
  plan: 'free',
  endsAt: '',
  offer: false,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        plan: { plan: state.plan },
        selfServeTrial: {
          startedAt: dayjs(state.endsAt).subtract(7, 'day').toISOString(),
          endsAt: state.endsAt,
          seatGraceEndsAt: null,
        },
      },
    }),
  },
}));

vi.mock('@/features/billing/hooks/self-serve-trial-hooks', () => ({
  SELF_SERVE_TRIAL_DAYS: 7,
  selfServeTrialHooks: {
    useShouldOfferTrial: () => state.offer,
  },
}));

vi.mock('@/features/billing/hooks/use-credits-usage', () => ({
  useCreditsUsage: () => ({ isPaid: state.plan !== 'free' }),
}));

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture: vi.fn() }),
}));

vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: null }) },
}));

describe('billing page trial offer', () => {
  it.each([
    { offer: true, daysAgo: -5, shown: true },
    { offer: false, daysAgo: 2, shown: false },
    { offer: false, daysAgo: -5, shown: false },
  ])(
    'offer $offer, trial ended $daysAgo days ago: shown $shown',
    ({ offer, daysAgo, shown }) => {
      Object.assign(state, {
        offer,
        endsAt: dayjs().subtract(daysAgo, 'day').toISOString(),
      });
      render(<SelfServeTrialBillingStatus />);
      expect(screen.queryAllByText('Start free trial')).toHaveLength(
        shown ? 1 : 0,
      );
    },
  );
});
