/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let trial: EnterpriseTrial;
let planName = 'free';
const openPlans = vi.fn();

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, unknown>) =>
    Object.entries(values ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      key,
    ),
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

vi.mock('@/features/billing/hooks/billing-dialog-hooks', () => ({
  billingDialogHooks: {
    useManagePlanDialogStore: () => ({ openDialog: openPlans }),
  },
}));

vi.mock('@/features/billing/components/enterprise-trial-sales-link', () => ({
  EnterpriseTrialSalesLink: ({ label }: { label: string }) => <a>{label}</a>,
}));

import { EnterpriseTrialEndingAlert } from '@/features/billing/components/enterprise-trial-ending-alert';
import { EnterprisePlanIndicator } from '@/features/billing/components/enterprise-trial-pill';
import type { EnterpriseTrial } from '@/features/billing/hooks/enterprise-trial-hooks';

const STARTED_COPY = /You are on a free trial of the Enterprise plan/;
const ENDING_COPY = /Your Enterprise plan trial ends/;

const activeTrial = (overrides: Partial<EnterpriseTrial>): EnterpriseTrial => ({
  state: 'active',
  endsAt: dayjs().add(7, 'day').toDate(),
  daysLeft: 7,
  endingSoon: false,
  lastDay: false,
  isPlatformAdmin: true,
  basePlanName: 'Free',
  ...overrides,
});

const renderInRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  window.localStorage.clear();
  planName = 'free';
  openPlans.mockClear();
});

describe('trial banner', () => {
  it('tells the admin the trial has started', () => {
    trial = activeTrial({});
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.getByText(STARTED_COPY)).toBeDefined();
    expect(screen.queryByText(ENDING_COPY)).toBeNull();
  });

  it('remembers that the admin dismissed the started banner', () => {
    trial = activeTrial({});
    const view = renderInRouter(<EnterpriseTrialEndingAlert />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText(STARTED_COPY)).toBeNull();
    view.unmount();
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.queryByText(STARTED_COPY)).toBeNull();
  });

  it('comes back before the trial ends even after the started banner was dismissed', () => {
    trial = activeTrial({});
    const view = renderInRouter(<EnterpriseTrialEndingAlert />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    view.unmount();
    trial = activeTrial({
      endsAt: dayjs().add(1, 'day').toDate(),
      daysLeft: 1,
      endingSoon: true,
      lastDay: true,
    });
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.getByText(ENDING_COPY)).toBeDefined();
  });

  it('opens the plans dialog from the ending banner', () => {
    trial = activeTrial({ lastDay: true, endingSoon: true, daysLeft: 1 });
    renderInRouter(<EnterpriseTrialEndingAlert />);
    fireEvent.click(screen.getByRole('button', { name: 'Explore plans' }));
    expect(openPlans).toHaveBeenCalledTimes(1);
  });

  it('never shows to members', () => {
    trial = activeTrial({ isPlatformAdmin: false });
    renderInRouter(<EnterpriseTrialEndingAlert />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('enterprise plan indicator', () => {
  it('shows the trial and the days left to admins', () => {
    trial = activeTrial({
      daysLeft: 5,
      endsAt: dayjs().add(5, 'day').toDate(),
    });
    renderInRouter(<EnterprisePlanIndicator />);
    expect(screen.getByText('Enterprise plan')).toBeDefined();
    expect(screen.getByText(/trial, \{count, plural/)).toBeDefined();
  });

  it('says Enterprise plan on a paid Enterprise plan', () => {
    trial = { ...activeTrial({}), state: 'unavailable', endsAt: null };
    planName = 'enterprise';
    renderInRouter(<EnterprisePlanIndicator />);
    expect(screen.getByText('Enterprise plan')).toBeDefined();
    expect(screen.queryByText(/trial/)).toBeNull();
  });

  it('shows nothing on other plans', () => {
    trial = { ...activeTrial({}), state: 'unavailable', endsAt: null };
    planName = 'team';
    renderInRouter(<EnterprisePlanIndicator />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('never shows to members', () => {
    trial = activeTrial({ isPlatformAdmin: false });
    renderInRouter(<EnterprisePlanIndicator />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
