/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SelfServeTrialBillingStatus } from '@/features/billing/components/self-serve-trial-billing-status';

const state = vi.hoisted(() => ({
  plan: 'free',
  trialState: 'ended',
  endsAt: new Date(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({ platform: { plan: { plan: state.plan } } }),
  },
}));

vi.mock('@/features/billing/hooks/self-serve-trial-hooks', () => ({
  SELF_SERVE_TRIAL_DAYS: 7,
  selfServeTrialHooks: {
    useTrial: () => ({ state: state.trialState, endsAt: state.endsAt }),
  },
}));

vi.mock('@/features/billing/hooks/use-credits-usage', () => ({
  useCreditsUsage: () => ({ isPaid: state.plan !== 'free' }),
}));

vi.mock('@/features/billing/components/self-serve-trial-sales-link', () => ({
  SelfServeTrialSalesLink: () => null,
}));

describe('billing page after the trial', () => {
  it.each([
    { trialState: 'ended', daysAgo: 2, plan: 'free', shown: true },
    { trialState: 'ended', daysAgo: 45, plan: 'free', shown: false },
    { trialState: 'ended', daysAgo: 2, plan: 'enterprise', shown: false },
    { trialState: 'used', daysAgo: -5, plan: 'free', shown: false },
  ])(
    '$trialState $daysAgo days ago on $plan: shown $shown',
    ({ trialState, daysAgo, plan, shown }) => {
      Object.assign(state, {
        trialState,
        plan,
        endsAt: dayjs().subtract(daysAgo, 'day').toDate(),
      });
      render(<SelfServeTrialBillingStatus />);
      expect(
        screen.queryAllByText(/Enterprise plan settings are locked/),
      ).toHaveLength(shown ? 1 : 0);
    },
  );
});
