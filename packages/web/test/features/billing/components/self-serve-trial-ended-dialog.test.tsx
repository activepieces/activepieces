/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-class, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { SelfServeTrialEndedDialog } from '@/features/billing/components/self-serve-trial-ended-dialog';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';
import type { SeatGrace } from '@/features/billing/hooks/self-serve-trial-hooks';

import { icuI18n } from '../../../i18n/icu-i18n';

const refreshPlan = vi.hoisted(() => vi.fn());
const state = vi.hoisted<TestState>(() => ({
  endsAt: new Date(),
  grace: null,
  userIds: null,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { id: 'platform-1', plan: { plan: 'free' } },
    }),
  },
}));

vi.mock('@/features/billing/hooks/self-serve-trial-hooks', () => ({
  SELF_SERVE_TRIAL_DAYS: 7,
  selfServeTrialHooks: {
    useTrial: () => ({
      state: 'ended',
      endsAt: state.endsAt,
      isPlatformAdmin: true,
      basePlanName: 'Team',
    }),
    useSeatGrace: () => state.grace,
    useRefreshPlanAfterTrialEnd: refreshPlan,
  },
}));

vi.mock('@/features/billing/hooks/billing-hooks', () => ({
  billingQueries: {
    usePlatformSubscription: () => ({
      data: {
        seatGrace:
          state.userIds === null
            ? null
            : { usedSeats: 9, userIds: state.userIds },
      },
    }),
  },
}));

vi.mock('@/features/billing/hooks/use-upgrade-click', () => ({
  useUpgradeClick: () => () => undefined,
}));

vi.mock('@/features/billing/components/self-serve-trial-sales-link', () => ({
  SelfServeTrialSalesLink: () => null,
}));

vi.mock('@/features/billing/components/self-serve-trial-seat-dialog', () => ({
  SelfServeTrialSeatDialog: () => <div>seat check</div>,
}));

function graceOf(): SeatGrace {
  return {
    endsAt: new Date(2026, 9, 26, 12, 0, 0),
    daysLeft: 3,
    endsToday: false,
    ending: false,
    seats: 1,
    isPlatformAdmin: true,
  };
}

beforeAll(async () => {
  await icuI18n.init();
});

beforeEach(() => {
  window.localStorage.clear();
  refreshPlan.mockReset();
  state.grace = null;
  state.userIds = null;
  billingDialogHooks.useTrialSeatDialogStore.setState({ isOpen: false });
});

describe('seat check after the trial', () => {
  it('runs only once the ended dialog is out of the way', () => {
    state.endsAt = dayjs().subtract(2, 'day').toDate();
    render(<SelfServeTrialEndedDialog />);
    expect(screen.queryByText('seat check')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Explore plans' }));
    expect(screen.getByText('seat check')).toBeDefined();
  });

  it('refreshes the plan while the ended dialog is open, so its seat line can show', () => {
    state.endsAt = dayjs().subtract(2, 'day').toDate();
    render(<SelfServeTrialEndedDialog />);
    expect(
      screen.getByText('Thanks for trying the Enterprise plan'),
    ).toBeDefined();
    expect(refreshPlan).toHaveBeenCalled();
  });

  it('still runs after the ended dialog stops showing', () => {
    state.endsAt = dayjs().subtract(20, 'day').toDate();
    render(<SelfServeTrialEndedDialog />);
    expect(screen.getByText('seat check')).toBeDefined();
  });
});

describe('seat grace after the trial', () => {
  beforeEach(() => {
    state.endsAt = dayjs().subtract(2, 'day').toDate();
  });

  it('warns how many users are over the plan and when they are deactivated', () => {
    state.grace = graceOf();
    state.userIds = ['a', 'b', 'c'];

    render(<SelfServeTrialEndedDialog />);

    expect(
      screen.getByText(
        "3 users added during the trial are over the Team plan's seats and will be deactivated on Oct 26.",
      ),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: 'Manage seats' })).toBeDefined();
  });

  it('says is for a single user', () => {
    state.grace = graceOf();
    state.userIds = ['a'];

    render(<SelfServeTrialEndedDialog />);

    expect(
      screen.getByText(
        "1 user added during the trial is over the Team plan's seats and will be deactivated on Oct 26.",
      ),
    ).toBeDefined();
  });

  it('closes, remembers it was seen and opens the seat dialog from Manage seats', () => {
    state.grace = graceOf();
    state.userIds = ['a', 'b'];
    render(<SelfServeTrialEndedDialog />);
    expect(screen.queryByText('seat check')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Manage seats' }));

    expect(billingDialogHooks.useTrialSeatDialogStore.getState().isOpen).toBe(
      true,
    );
    expect(
      screen.queryByText('Thanks for trying the Enterprise plan'),
    ).toBeNull();
    expect(screen.getByText('seat check')).toBeDefined();
    expect(Object.values(window.localStorage)).toContain('true');
  });

  it('leaves seats out when no grace is running', () => {
    state.userIds = ['a', 'b'];

    render(<SelfServeTrialEndedDialog />);

    expect(
      screen.getByText('Thanks for trying the Enterprise plan'),
    ).toBeDefined();
    expect(screen.queryByText(/added during the trial/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Manage seats' })).toBeNull();
  });

  it('leaves seats out when nobody is over the plan', () => {
    state.grace = graceOf();

    render(<SelfServeTrialEndedDialog />);

    expect(screen.queryByText(/added during the trial/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Manage seats' })).toBeNull();
  });
});

type TestState = {
  endsAt: Date;
  grace: SeatGrace | null;
  userIds: string[] | null;
};
