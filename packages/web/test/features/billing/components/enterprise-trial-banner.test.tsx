/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { PlatformAdminSurface } from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EnterpriseTrialEndingAlert } from '@/features/billing/components/enterprise-trial-ending-alert';
import {
  EnterprisePlanIndicator,
  EnterpriseTrialLine,
  EnterpriseTrialPill,
} from '@/features/billing/components/enterprise-trial-pill';
import type { EnterpriseTrial } from '@/features/billing/hooks/enterprise-trial-hooks';
import { enterpriseTrialTime } from '@/features/billing/utils/enterprise-trial-time';

let trial: EnterpriseTrial;
let planName = 'free';
let currentUserId = 'user-1';
const upgradeClick = vi.fn();

vi.mock('i18next', () => ({
  t: (key: string, values: Record<string, unknown> = {}) =>
    formatIcu({ key, values }),
}));

vi.mock('@/features/billing/hooks/enterprise-trial-hooks', () => ({
  enterpriseTrialHooks: { useTrial: () => trial },
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { id: 'platform-1', plan: { plan: planName } },
    }),
  },
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getCurrentUserId: () => currentUserId },
}));

vi.mock('@/features/billing/hooks/use-upgrade-click', () => ({
  useUpgradeClick: () => upgradeClick,
}));

vi.mock('@/features/billing/components/enterprise-trial-sales-link', () => ({
  EnterpriseTrialSalesLink: ({ label }: { label: string }) => <a>{label}</a>,
}));

const STARTED_COPY = /You are on a free trial of the Enterprise plan/;
const ENDING_COPY = /Your Enterprise plan trial ends/;
const NOW = new Date(2026, 9, 12, 10, 0, 0);

function formatIcu({
  key,
  values,
}: {
  key: string;
  values: Record<string, unknown>;
}): string {
  const plural = key.replace(
    /\{(\w+), plural, =1 \{([^}]*)\} other \{([^}]*)\}\}/g,
    (_match, name: string, one: string, other: string) =>
      Number(values[name]) === 1
        ? one
        : other.replace('#', String(values[name])),
  );
  return plural.replace(/\{(\w+)\}/g, (_match, name: string) =>
    String(values[name]),
  );
}

function activeTrial({
  startedAt,
  endsAt,
  isPlatformAdmin = true,
  extended = false,
}: {
  startedAt: Date | null;
  endsAt: Date;
  isPlatformAdmin?: boolean;
  extended?: boolean;
}): EnterpriseTrial {
  return {
    state: 'active',
    ...enterpriseTrialTime.activeTrialTiming({
      startedAt,
      endsAt,
      now: Date.now(),
    }),
    extended,
    isPlatformAdmin,
    basePlanName: 'Free',
  };
}

const noTrial = (): EnterpriseTrial => ({
  state: 'unavailable',
  startedAt: null,
  endsAt: null,
  daysLeft: 0,
  endsToday: false,
  ending: false,
  justStarted: false,
  extended: false,
  isPlatformAdmin: true,
  basePlanName: 'Free',
});

const justStarted = () =>
  activeTrial({
    startedAt: dayjs(NOW).subtract(1, 'hour').toDate(),
    endsAt: dayjs(NOW).add(7, 'day').toDate(),
  });

const midTrial = () =>
  activeTrial({
    startedAt: dayjs(NOW).subtract(3, 'day').toDate(),
    endsAt: dayjs(NOW).add(4, 'day').toDate(),
  });

const endsTomorrow = () =>
  activeTrial({
    startedAt: dayjs(NOW).subtract(6, 'day').toDate(),
    endsAt: dayjs(NOW).add(1, 'day').hour(18).toDate(),
  });

const endsToday = () =>
  activeTrial({
    startedAt: dayjs(NOW).subtract(7, 'day').toDate(),
    endsAt: dayjs(NOW).hour(23).minute(50).toDate(),
  });

const renderInRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  window.localStorage.clear();
  planName = 'free';
  currentUserId = 'user-1';
  upgradeClick.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('trial timing', () => {
  it('counts calendar days left in the user timezone', () => {
    expect(midTrial().daysLeft).toBe(4);
    expect(midTrial().ending).toBe(false);
    expect(endsTomorrow().daysLeft).toBe(1);
    expect(endsTomorrow().ending).toBe(true);
    expect(endsTomorrow().endsToday).toBe(false);
    expect(endsToday().daysLeft).toBe(0);
    expect(endsToday().endsToday).toBe(true);
  });

  it('treats a trial ending just after midnight as ending tomorrow, not today', () => {
    const late = new Date(2026, 9, 12, 23, 30);
    vi.setSystemTime(late);
    const lateTrial = activeTrial({
      startedAt: dayjs(late).subtract(6, 'day').toDate(),
      endsAt: dayjs(late).add(1, 'hour').toDate(),
    });
    expect(lateTrial.daysLeft).toBe(1);
    expect(lateTrial.endsToday).toBe(false);
  });

  it('marks only the first two calendar days as just started', () => {
    expect(justStarted().justStarted).toBe(true);
    expect(
      activeTrial({
        startedAt: dayjs(NOW).subtract(1, 'day').toDate(),
        endsAt: dayjs(NOW).add(6, 'day').toDate(),
      }).justStarted,
    ).toBe(true);
    expect(midTrial().justStarted).toBe(false);
  });
});

describe('trial banner', () => {
  it('tells the admin the trial has started', () => {
    trial = justStarted();
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.getByText(STARTED_COPY)).toBeDefined();
    expect(screen.queryByText(ENDING_COPY)).toBeNull();
  });

  it('stops showing the started banner after the first days', () => {
    trial = midTrial();
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('remembers the dismissal for this user and this trial', () => {
    trial = justStarted();
    const view = renderInRouter(<EnterpriseTrialEndingAlert />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText(STARTED_COPY)).toBeNull();
    view.unmount();
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.queryByText(STARTED_COPY)).toBeNull();
  });

  it('shows the started banner again to another admin', () => {
    trial = justStarted();
    const view = renderInRouter(<EnterpriseTrialEndingAlert />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    view.unmount();
    currentUserId = 'user-2';
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.getByText(STARTED_COPY)).toBeDefined();
  });

  it('announces an extension once, even late in the trial', () => {
    trial = activeTrial({
      startedAt: dayjs(NOW).subtract(6, 'day').toDate(),
      endsAt: dayjs(NOW).add(14, 'day').toDate(),
      extended: true,
    });
    const view = renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(
      screen.getByText(/Your Enterprise plan trial was extended until/),
    ).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    view.unmount();
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('does not guess a start date it does not know', () => {
    trial = activeTrial({
      startedAt: null,
      endsAt: dayjs(NOW).add(6, 'day').toDate(),
    });
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('says ends tomorrow on the day before, and ends today on the last day', () => {
    trial = endsTomorrow();
    const view = renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(
      screen.getByText('Your Enterprise plan trial ends tomorrow at 6:00 PM.'),
    ).toBeDefined();
    view.unmount();
    trial = endsToday();
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(
      screen.getByText('Your Enterprise plan trial ends today at 11:50 PM.'),
    ).toBeDefined();
  });

  it('comes back the next day after the ending banner was dismissed', () => {
    trial = endsTomorrow();
    const view = renderInRouter(<EnterpriseTrialEndingAlert />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss for today' }));
    expect(screen.queryByRole('status')).toBeNull();
    view.unmount();
    vi.setSystemTime(dayjs(NOW).add(1, 'day').hour(9).toDate());
    trial = activeTrial({
      startedAt: dayjs(NOW).subtract(6, 'day').toDate(),
      endsAt: dayjs(NOW).add(1, 'day').hour(18).toDate(),
    });
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.getByText(ENDING_COPY)).toBeDefined();
  });

  it('opens the plans dialog from the ending banner and reports the click', () => {
    trial = endsTomorrow();
    renderInRouter(<EnterpriseTrialEndingAlert />);
    fireEvent.click(screen.getByRole('button', { name: 'Explore plans' }));
    expect(upgradeClick).toHaveBeenCalledWith({
      surface: PlatformAdminSurface.BANNER,
    });
  });

  it('never shows to members', () => {
    trial = { ...justStarted(), isPlatformAdmin: false };
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('enterprise plan indicator', () => {
  it('shows the trial and the calendar days left to admins', () => {
    trial = midTrial();
    renderInRouter(<EnterprisePlanIndicator />);
    expect(screen.getByText('Enterprise plan trial')).toBeDefined();
    expect(
      screen.getByText(
        `4 days left, ends ${dayjs(trial.endsAt).format('MMM D')}`,
      ),
    ).toBeDefined();
  });

  it('names the end time on the last two days', () => {
    trial = endsTomorrow();
    const view = renderInRouter(<EnterprisePlanIndicator />);
    expect(screen.getByText('Ends tomorrow at 6:00 PM')).toBeDefined();
    view.unmount();
    trial = endsToday();
    renderInRouter(<EnterprisePlanIndicator />);
    expect(screen.getByText('Ends today at 11:50 PM')).toBeDefined();
  });

  it('says Enterprise plan on any paid Enterprise plan id', () => {
    trial = noTrial();
    for (const plan of [
      'enterprise',
      'enterprise_annual',
      'Enterprise_custom',
    ]) {
      planName = plan;
      const view = renderInRouter(<EnterprisePlanIndicator />);
      expect(screen.getByText('Enterprise plan')).toBeDefined();
      view.unmount();
    }
  });

  it('shows nothing on other plans', () => {
    trial = noTrial();
    for (const plan of ['free', 'plus', 'team', 'enterprise_trial']) {
      planName = plan;
      const view = renderInRouter(<EnterprisePlanIndicator />);
      expect(screen.queryByRole('link')).toBeNull();
      view.unmount();
    }
  });

  it('never shows to members', () => {
    trial = { ...midTrial(), isPlatformAdmin: false };
    renderInRouter(<EnterprisePlanIndicator />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('credits card trial line', () => {
  it('shows the trial line to admins with the shared wording', () => {
    trial = midTrial();
    renderInRouter(<EnterpriseTrialPill />);
    expect(screen.getByText('Enterprise plan trial')).toBeDefined();
    expect(
      screen.getByText(
        `· 4 days left, ends ${dayjs(trial.endsAt).format('MMM D')}`,
      ),
    ).toBeDefined();
  });

  it('never shows the trial line or pill to members', () => {
    trial = { ...midTrial(), isPlatformAdmin: false };
    const view = renderInRouter(<EnterpriseTrialPill />);
    expect(screen.queryByRole('link')).toBeNull();
    view.unmount();
    renderInRouter(<EnterpriseTrialLine trial={trial} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
