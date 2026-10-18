/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EnterpriseTrialEndingAlert } from '@/features/billing/components/enterprise-trial-ending-alert';
import type { EnterpriseTrial } from '@/features/billing/hooks/enterprise-trial-hooks';

let trial: EnterpriseTrial;
let currentUserId = 'user-1';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/billing/hooks/enterprise-trial-hooks', () => ({
  enterpriseTrialHooks: { useTrial: () => trial },
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { id: 'platform-1', plan: { plan: 'free' } },
    }),
  },
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getCurrentUserId: () => currentUserId },
}));

vi.mock('@/features/billing/hooks/use-upgrade-click', () => ({
  useUpgradeClick: () => vi.fn(),
}));

vi.mock('@/features/billing/components/enterprise-trial-sales-link', () => ({
  EnterpriseTrialSalesLink: () => null,
}));

const NOW = new Date(2026, 9, 12, 10, 0, 0);

const trialEnding = (ending: boolean): EnterpriseTrial => ({
  state: 'active',
  startedAt: NOW,
  endsAt: dayjs(NOW).add(ending ? 1 : 7, 'day').toDate(),
  daysLeft: ending ? 1 : 7,
  endsToday: false,
  ending,
  justStarted: !ending,
  extended: false,
  isPlatformAdmin: true,
  basePlanName: 'Free',
});

const dismissAndRemount = (name: string) => {
  const view = render(<EnterpriseTrialEndingAlert />);
  fireEvent.click(screen.getByRole('button', { name }));
  view.unmount();
};

const bannerShown = () => {
  const view = render(<EnterpriseTrialEndingAlert />);
  const shown = screen.queryByRole('status') !== null;
  view.unmount();
  return shown;
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  window.localStorage.clear();
  currentUserId = 'user-1';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('trial banner dismissal', () => {
  it('is remembered per user', () => {
    trial = trialEnding(false);
    dismissAndRemount('Dismiss');
    expect(bannerShown()).toBe(false);
    currentUserId = 'user-2';
    expect(bannerShown()).toBe(true);
  });

  it('lasts one day for the ending banner', () => {
    trial = trialEnding(true);
    dismissAndRemount('Dismiss for today');
    expect(bannerShown()).toBe(false);
    vi.setSystemTime(dayjs(NOW).add(1, 'day').hour(9).toDate());
    expect(bannerShown()).toBe(true);
  });
});
