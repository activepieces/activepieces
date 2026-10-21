/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-class, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { ApEdition } from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarUsageLimits } from '@/features/billing/components/sidebar-usage-limits';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';
import type {
  SelfServeTrial,
  SeatGrace,
} from '@/features/billing/hooks/self-serve-trial-hooks';

import { icuI18n } from '../../../i18n/icu-i18n';

const state = vi.hoisted<TestState>(() => ({
  credits: null,
  trial: null,
  grace: null,
}));

vi.mock('@/features/projects', () => ({
  projectCollectionUtils: {
    useCurrentProject: () => ({ project: { id: 'project-1' } }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: ApEdition.CLOUD }) },
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({ platform: { id: 'platform-1', plan: {} } }),
  },
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project-1' },
}));

vi.mock('@/features/flow-runs/utils/flow-run-utils', () => ({
  flowRunUtils: { getStatusContainerClassName: () => '' },
}));

vi.mock('@/features/billing/hooks/use-credits-usage', () => ({
  useCreditsUsage: () => state.credits,
}));

vi.mock('@/features/billing/hooks/billing-hooks', () => ({
  billingQueries: { usePlatformSubscription: () => ({ data: undefined }) },
}));

vi.mock('@/features/billing/hooks/self-serve-trial-hooks', () => ({
  selfServeTrialHooks: {
    useTrial: () => state.trial,
    useSeatGrace: () => state.grace,
  },
}));

vi.mock('@/features/billing/components/credits-action-button', () => ({
  CreditsActionButton: () => null,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: ({ children }: React.PropsWithChildren) => (
    <span>{children}</span>
  ),
}));

function renderSidebar() {
  return render(
    <MemoryRouter>
      <SidebarUsageLimits />
    </MemoryRouter>,
  );
}

function unlimitedCredits({
  isPlatformAdmin,
}: {
  isPlatformAdmin: boolean;
}): CreditsState {
  return {
    platformId: 'platform-1',
    usage: { creditsNextResetAt: null },
    isPlatformAdmin,
    isPaid: false,
    creditsRemaining: null,
    isUnlimited: true,
    percentUsed: 0,
    severity: 'default',
  };
}

function trialOf(overrides: Partial<SelfServeTrial> = {}): SelfServeTrial {
  return {
    state: 'none',
    startedAt: null,
    endsAt: null,
    daysLeft: 0,
    endsToday: false,
    ending: false,
    justStarted: false,
    extended: false,
    isPlatformAdmin: false,
    basePlanName: 'Free',
    ...overrides,
  };
}

function graceOf(overrides: Partial<SeatGrace> = {}): SeatGrace {
  return {
    endsAt: new Date(2026, 9, 26, 12, 0, 0),
    daysLeft: 3,
    endsToday: false,
    ending: false,
    seats: 5,
    isPlatformAdmin: false,
    ...overrides,
  };
}

beforeAll(async () => {
  await icuI18n.init();
});

beforeEach(() => {
  state.credits = unlimitedCredits({ isPlatformAdmin: false });
  state.trial = trialOf();
  state.grace = null;
  billingDialogHooks.useTrialSeatDialogStore.setState({ isOpen: false });
});

describe('sidebar usage card during the seat grace', () => {
  it('shows a member the countdown and what happens to extra users', () => {
    state.grace = graceOf({ isPlatformAdmin: false });

    renderSidebar();

    expect(screen.getByText('Enterprise trial ended')).toBeTruthy();
    expect(screen.getByText('· 3 days left')).toBeTruthy();
    expect(
      screen.getByText(
        "Your Enterprise trial has ended. Users added during it beyond the plan's 5 seats lose access on Oct 26 unless an admin upgrades.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('gives an admin a button that opens the seat dialog', () => {
    state.credits = unlimitedCredits({ isPlatformAdmin: true });
    state.grace = graceOf({ isPlatformAdmin: true });

    renderSidebar();

    expect(
      screen.getByText(
        "Users added during the trial beyond the plan's 5 seats will be deactivated on Oct 26. Manage seats, or upgrade to keep them.",
      ),
    ).toBeTruthy();
    const line = screen.getByRole('button', {
      name: /Enterprise trial ended/,
    });
    expect(line.getAttribute('data-ap-control')).toBe('trial.seats.open');
    expect(billingDialogHooks.useTrialSeatDialogStore.getState().isOpen).toBe(
      false,
    );

    fireEvent.click(line);

    expect(billingDialogHooks.useTrialSeatDialogStore.getState().isOpen).toBe(
      true,
    );
  });

  it('counts the last day down in words', () => {
    state.grace = graceOf({ daysLeft: 0, endsToday: true, ending: true });

    renderSidebar();

    expect(screen.getByText('· last day')).toBeTruthy();
  });

  it('sits above the credits when the plan has credits', () => {
    state.credits = {
      ...unlimitedCredits({ isPlatformAdmin: false }),
      creditsRemaining: 120,
      isUnlimited: false,
      percentUsed: 10,
    };
    state.grace = graceOf();

    renderSidebar();

    expect(screen.getByText('Enterprise trial ended')).toBeTruthy();
    expect(screen.getByText('credits')).toBeTruthy();
  });

  it('shows nothing extra once the grace is over', () => {
    const view = renderSidebar();

    expect(view.container.textContent).toBe('');
  });

  it('keeps the running trial line while a trial is active', () => {
    state.trial = trialOf({
      state: 'active',
      endsAt: new Date(2026, 9, 28, 12, 0, 0),
      daysLeft: 6,
    });
    state.grace = graceOf();

    renderSidebar();

    expect(screen.getByText('Enterprise trial')).toBeTruthy();
    expect(screen.queryByText('Enterprise trial ended')).toBeNull();
  });
});

type CreditsState = {
  platformId: string;
  usage: { creditsNextResetAt: string | null };
  isPlatformAdmin: boolean;
  isPaid: boolean;
  creditsRemaining: number | null;
  isUnlimited: boolean;
  percentUsed: number;
  severity: 'default' | 'warning' | 'error';
};

type TestState = {
  credits: CreditsState | null;
  trial: SelfServeTrial | null;
  grace: SeatGrace | null;
};
