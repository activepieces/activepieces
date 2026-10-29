/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-class, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { ApEdition, PlatformSelfServeTrial } from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { SidebarUsageLimits } from '@/features/billing/components/sidebar-usage-limits';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';

import { icuI18n } from '../../../i18n/icu-i18n';

const NOW = new Date(2026, 9, 23, 9, 0, 0);

const state = vi.hoisted<TestState>(() => ({
  credits: null,
  selfServeTrial: undefined,
  isPlatformAdmin: false,
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
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: { usersLimit: 5 },
        selfServeTrial: state.selfServeTrial,
      },
    }),
  },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => state.isPlatformAdmin,
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

function graceEndingIn(days: number): PlatformSelfServeTrial {
  return {
    startedAt: dayjs(NOW).subtract(10, 'day').toISOString(),
    endsAt: dayjs(NOW).subtract(3, 'day').toISOString(),
    seatGraceEndsAt: dayjs(NOW).add(days, 'day').hour(12).toISOString(),
  };
}

beforeAll(async () => {
  await icuI18n.init();
});

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  state.credits = unlimitedCredits({ isPlatformAdmin: false });
  state.selfServeTrial = undefined;
  state.isPlatformAdmin = false;
  billingDialogHooks.useTrialSeatDialogStore.setState({ isOpen: false });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('sidebar usage card during the seat grace', () => {
  it('shows a member the countdown and what happens to extra users', () => {
    state.selfServeTrial = graceEndingIn(3);

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
    state.isPlatformAdmin = true;
    state.selfServeTrial = graceEndingIn(3);

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
    state.selfServeTrial = graceEndingIn(0);

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
    state.selfServeTrial = graceEndingIn(3);

    renderSidebar();

    expect(screen.getByText('Enterprise trial ended')).toBeTruthy();
    expect(screen.getByText('credits')).toBeTruthy();
  });

  it('shows nothing extra once the grace is over', () => {
    const view = renderSidebar();

    expect(view.container.textContent).toBe('');
  });

  it('keeps the running trial line while a trial is active', () => {
    state.selfServeTrial = {
      ...graceEndingIn(3),
      endsAt: dayjs(NOW).add(5, 'day').toISOString(),
    };

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
  selfServeTrial: PlatformSelfServeTrial | undefined;
  isPlatformAdmin: boolean;
};
