/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { ApEdition, PlatformAdminSurface } from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let edition: ApEdition = ApEdition.CLOUD;
let access: EnterpriseAccess = 'trial_available';
let planName = 'free';
const upgradeClick = vi.fn();
const openTrialDialog = vi.fn();

vi.mock('i18next', () => ({
  t: (key: string, values: Record<string, unknown> = {}) =>
    key.replace(/\{(\w+)\}/g, (_match, name: string) => String(values[name])),
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: edition }) },
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { id: 'platform-1', plan: { plan: planName } },
    }),
  },
}));

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture: vi.fn() }),
}));

vi.mock('@/features/billing/hooks/use-enterprise-gate', () => ({
  useEnterpriseAccess: () => access,
}));

vi.mock('@/features/billing/hooks/use-upgrade-click', () => ({
  useUpgradeClick: () => upgradeClick,
}));

vi.mock('@/features/billing/hooks/billing-dialog-hooks', () => ({
  billingDialogHooks: {
    useEnterpriseTrialDialogStore: () => ({ openDialog: openTrialDialog }),
  },
}));

vi.mock('@/features/billing/hooks/enterprise-trial-hooks', () => ({
  ENTERPRISE_TRIAL_DAYS: 7,
  enterpriseTrialHooks: {
    useTrial: () => ({
      state: 'ended',
      startedAt: null,
      endsAt: new Date(2026, 9, 10),
      daysLeft: 0,
      endsToday: false,
      ending: false,
      justStarted: false,
      isPlatformAdmin: true,
      basePlanName: 'Team',
    }),
  },
}));

vi.mock('@/features/billing/components/enterprise-trial-sales-link', () => ({
  EnterpriseTrialSalesLink: ({ label }: { label: string }) => <a>{label}</a>,
}));

import { EnterpriseLockedCard } from '@/features/billing/components/enterprise-locked-card';
import { EnterpriseTrialEndedDialog } from '@/features/billing/components/enterprise-trial-ended-dialog';
import type { EnterpriseAccess } from '@/features/billing/hooks/use-enterprise-gate';

const renderCard = (featureKey: 'SSO' | 'UNIVERSAL_AI' | 'AUDIT_LOGS') =>
  render(
    <EnterpriseLockedCard
      access={access}
      featureKey={featureKey}
      surface={PlatformAdminSurface.TEASER}
    />,
  );

beforeEach(() => {
  edition = ApEdition.CLOUD;
  access = 'trial_available';
  planName = 'free';
  upgradeClick.mockClear();
  openTrialDialog.mockClear();
  window.localStorage.clear();
});

describe('locked card plan naming', () => {
  it('names the Team plan for a Team feature on Cloud', () => {
    renderCard('SSO');
    expect(screen.getByText('Included in the Team plan and up')).toBeDefined();
  });

  it('names the Plus plan for AI Center on Cloud', () => {
    renderCard('UNIVERSAL_AI');
    expect(screen.getByText('Included in the Plus plan and up')).toBeDefined();
  });

  it('names the Enterprise plan for every feature on self-hosted Community', () => {
    edition = ApEdition.COMMUNITY;
    access = 'community';
    renderCard('SSO');
    expect(screen.getByText('Included in the Enterprise plan')).toBeDefined();
  });
});

describe('locked card actions', () => {
  it('offers the Enterprise plan trial first and Explore plans second', () => {
    renderCard('SSO');
    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons).toEqual([
      'Start free 7-day Enterprise plan trial',
      'Explore plans',
    ]);
  });

  it('reports Explore plans with the tier the lock names', () => {
    renderCard('SSO');
    fireEvent.click(screen.getByRole('button', { name: 'Explore plans' }));
    expect(upgradeClick).toHaveBeenCalledWith({
      feature: 'SSO',
      tier: 'team',
      surface: PlatformAdminSurface.TEASER,
    });
  });

  it('leads with Explore plans on Cloud when no trial is offered for a Team feature', () => {
    access = 'trial_used';
    renderCard('SSO');
    expect(screen.getAllByRole('button')[0]).toBe(
      screen.getByRole('button', { name: 'Explore plans' }),
    );
  });

  it('only offers Talk to sales on Community', () => {
    edition = ApEdition.COMMUNITY;
    access = 'community';
    renderCard('AUDIT_LOGS');
    expect(screen.queryByRole('button', { name: 'Explore plans' })).toBeNull();
    expect(screen.getByText('Talk to sales')).toBeDefined();
  });

  it('asks members to go to their admin for the named plan', () => {
    access = 'ask_admin';
    renderCard('SSO');
    expect(
      screen.getByText('Ask your admin to upgrade to the Team plan or above.'),
    ).toBeDefined();
  });
});

describe('trial ended dialog', () => {
  it('lists only what a Team admin loses', () => {
    planName = 'team';
    render(<EnterpriseTrialEndedDialog />);
    expect(screen.getByText('Audit logs')).toBeDefined();
    expect(screen.queryByText('Single sign-on')).toBeNull();
    expect(screen.queryByText('AI Center')).toBeNull();
  });

  it('lists every feature for a Free admin', () => {
    planName = 'free';
    render(<EnterpriseTrialEndedDialog />);
    expect(screen.getByText('Single sign-on')).toBeDefined();
    expect(screen.getByText('AI Center')).toBeDefined();
  });

  it('opens the plans dialog from Explore plans and reports the click', () => {
    render(<EnterpriseTrialEndedDialog />);
    fireEvent.click(screen.getByRole('button', { name: 'Explore plans' }));
    expect(upgradeClick).toHaveBeenCalledWith({
      surface: PlatformAdminSurface.DIALOG,
    });
  });
});
