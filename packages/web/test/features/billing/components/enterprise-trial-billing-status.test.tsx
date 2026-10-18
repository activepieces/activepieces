/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { EnterpriseTrialBillingStatus } from '@/features/billing/components/enterprise-trial-billing-status';

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

vi.mock('@/features/billing/hooks/enterprise-trial-hooks', () => ({
  ENTERPRISE_TRIAL_DAYS: 7,
  enterpriseTrialHooks: {
    useTrial: () => ({ state: state.trialState, endsAt: state.endsAt }),
  },
}));

vi.mock('@/features/billing/hooks/use-credits-usage', () => ({
  useCreditsUsage: () => ({ isPaid: state.plan !== 'free' }),
}));

vi.mock('@/features/billing/components/enterprise-trial-sales-link', () => ({
  EnterpriseTrialSalesLink: () => null,
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
      render(<EnterpriseTrialBillingStatus />);
      expect(
        screen.queryAllByText(/Enterprise plan settings are locked/),
      ).toHaveLength(shown ? 1 : 0);
    },
  );
});
