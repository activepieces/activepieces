/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { ApEdition, PlatformAdminSurface } from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let edition: ApEdition = ApEdition.CLOUD;
let access: EnterpriseAccess = 'trial_available';
let planName = 'free';
let teamProjectsLimit: number | null = null;
let trialEndedAt = new Date();
const upgradeClick = vi.fn();
const openTrialDialog = vi.fn();

vi.mock('i18next', () => ({
  t: (key: string, values: Record<string, unknown> = {}) =>
    formatIcu({ key, values }),
}));

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

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: edition }) },
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: { plan: planName, billedTeamProjectsLimit: teamProjectsLimit },
      },
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
      endsAt: trialEndedAt,
      daysLeft: 0,
      endsToday: false,
      ending: false,
      justStarted: false,
      extended: false,
      isPlatformAdmin: true,
      basePlanName: 'Team',
    }),
  },
}));

vi.mock('@/features/billing/hooks/use-credits-usage', () => ({
  useCreditsUsage: () => ({ isPaid: planName !== 'free' }),
}));

vi.mock('@/features/billing/components/enterprise-trial-sales-link', () => ({
  EnterpriseTrialSalesLink: ({ label }: { label: string }) => <a>{label}</a>,
}));

import { EnterpriseLockedCard } from '@/features/billing/components/enterprise-locked-card';
import { EnterpriseLockedRow } from '@/features/billing/components/enterprise-locked-row';
import { EnterpriseTrialBillingStatus } from '@/features/billing/components/enterprise-trial-billing-status';
import { EnterpriseTrialEndedDialog } from '@/features/billing/components/enterprise-trial-ended-dialog';
import type { EnterpriseAccess } from '@/features/billing/hooks/use-enterprise-gate';

const renderCard = (
  featureKey: 'SSO' | 'UNIVERSAL_AI' | 'AUDIT_LOGS' | 'PROJECTS',
) =>
  render(
    <EnterpriseLockedCard
      featureKey={featureKey}
      surface={PlatformAdminSurface.TEASER}
    />,
  );

beforeEach(() => {
  edition = ApEdition.CLOUD;
  access = 'trial_available';
  planName = 'free';
  teamProjectsLimit = null;
  trialEndedAt = dayjs().subtract(2, 'day').toDate();
  upgradeClick.mockClear();
  openTrialDialog.mockClear();
  window.localStorage.clear();
});

describe('locked card plan naming', () => {
  it('names the Team plan for a Team feature on Cloud', () => {
    renderCard('SSO');
    expect(screen.getByText('Team plan and up')).toBeDefined();
  });

  it('names the Plus plan for AI Center on Cloud', () => {
    renderCard('UNIVERSAL_AI');
    expect(screen.getByText('Plus plan and up')).toBeDefined();
  });

  it('names the Enterprise plan for every feature on self-hosted Community', () => {
    edition = ApEdition.COMMUNITY;
    access = 'community';
    renderCard('SSO');
    expect(screen.getByText('Enterprise plan')).toBeDefined();
  });
});

describe('limit reached on the plan that includes the feature', () => {
  it('names the limit instead of the plan the admin already has', () => {
    planName = 'team';
    teamProjectsLimit = 3;
    renderCard('PROJECTS');
    expect(
      screen.getByText("You've reached your plan's 3 team projects"),
    ).toBeDefined();
    expect(screen.queryByText('Team plan and up')).toBeNull();
  });

  it('still names the Team plan for a Free admin', () => {
    planName = 'free';
    teamProjectsLimit = 0;
    renderCard('PROJECTS');
    expect(screen.getByText('Team plan and up')).toBeDefined();
  });
});

describe('locked card actions', () => {
  it('offers the Enterprise plan trial first and Explore plans second', () => {
    renderCard('SSO');
    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons).toEqual(['Start free trial', 'Explore plans']);
    expect(
      screen.getByText('7-day Enterprise plan trial. No credit card.'),
    ).toBeDefined();
  });

  it('tags the trial and plans buttons for control-click telemetry', () => {
    renderCard('SSO');
    const controls = screen
      .getAllByRole('button')
      .map((button) => button.dataset.apControl);
    expect(controls).toEqual(['trial.start.open', 'trial.plans.open']);
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

describe('lean locked row for partly locked pages', () => {
  const renderRow = () =>
    render(
      <EnterpriseLockedRow
        featureKey="PIECES"
        line="Hiding pieces from your users is locked."
        surface={PlatformAdminSurface.TEASER}
      />,
    );

  it('names the plan and what is locked on one line', () => {
    edition = ApEdition.ENTERPRISE;
    renderRow();
    expect(screen.getByText('Enterprise plan')).toBeDefined();
    expect(
      screen.getByText('Hiding pieces from your users is locked.'),
    ).toBeDefined();
  });

  it('keeps the trial and plans actions without the fine print', () => {
    renderRow();
    expect(
      screen.getAllByRole('button').map((button) => button.textContent),
    ).toEqual(['Start free trial', 'Explore plans']);
    expect(
      screen.queryByText('7-day Enterprise plan trial. No credit card.'),
    ).toBeNull();
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

  it('stops showing two weeks after the trial ended', () => {
    trialEndedAt = dayjs().subtract(20, 'day').toDate();
    render(<EnterpriseTrialEndedDialog />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the plans dialog from Explore plans and reports the click', () => {
    render(<EnterpriseTrialEndedDialog />);
    fireEvent.click(screen.getByRole('button', { name: 'Explore plans' }));
    expect(upgradeClick).toHaveBeenCalledWith({
      surface: PlatformAdminSurface.DIALOG,
    });
  });
});

describe('billing page after the trial', () => {
  const ENDED_COPY = /Enterprise plan features are paused/;

  it('explains the paused features for a month after the trial', () => {
    render(<EnterpriseTrialBillingStatus />);
    expect(screen.getByText(ENDED_COPY)).toBeDefined();
  });

  it('stops explaining a trial that ended long ago', () => {
    trialEndedAt = dayjs().subtract(45, 'day').toDate();
    render(<EnterpriseTrialBillingStatus />);
    expect(screen.queryByText(ENDED_COPY)).toBeNull();
  });

  it('never shows to a paying Enterprise customer', () => {
    planName = 'enterprise';
    render(<EnterpriseTrialBillingStatus />);
    expect(screen.queryByText(ENDED_COPY)).toBeNull();
  });
});
