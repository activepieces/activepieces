/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-class, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { SelfServeTrialState } from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { SelfServeTrialEndedDialog } from '@/features/billing/components/self-serve-trial-notices';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';

import { icuI18n } from '../../../i18n/icu-i18n';

const GRACE_ENDS_AT = new Date(2026, 9, 26, 12, 0, 0).toISOString();

const state = vi.hoisted<TestState>(() => ({
  endsAt: '',
  graceEndsAt: null,
  seats: null,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: { plan: 'team' },
        selfServeTrial: {
          state: SelfServeTrialState.ENDED,
          startedAt: dayjs(state.endsAt).subtract(7, 'day').toISOString(),
          endsAt: state.endsAt,
          seatGraceEndsAt: state.graceEndsAt,
        },
      },
    }),
  },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => true,
}));

vi.mock('@/features/billing/hooks/billing-hooks', () => ({
  billingQueries: {
    usePlatformSubscription: () => ({
      data: {
        plan: { plan: 'team', usersLimit: state.seats?.usersLimit ?? null },
        autumnPlanName: 'Team',
        usage: {
          activeUsers: state.seats?.activeUsers ?? 0,
          invitedSeats: state.seats?.pendingInvitations ?? 0,
        },
      },
    }),
  },
}));

vi.mock('@/features/billing/hooks/use-upgrade-click', () => ({
  useUpgradeClick: () => () => undefined,
}));

vi.mock('@/features/billing/components/current-subscription-card', () => ({
  SelfServeTrialSalesLink: () => null,
}));

vi.mock('@/features/billing/components/self-serve-trial-sidebar', () => ({
  SelfServeTrialSeatDialog: () => <div>seat check</div>,
}));

beforeAll(async () => {
  await icuI18n.init();
});

beforeEach(() => {
  window.localStorage.clear();
  state.graceEndsAt = null;
  state.seats = null;
  billingDialogHooks.useTrialSeatDialogStore.setState({ isOpen: false });
});

describe('seat grace after the trial', () => {
  beforeEach(() => {
    state.endsAt = dayjs().subtract(2, 'day').toISOString();
  });

  it('states the seats and what happens to the extra ones on the deadline', () => {
    state.graceEndsAt = GRACE_ENDS_AT;
    state.seats = { activeUsers: 4, pendingInvitations: 2, usersLimit: 3 };

    render(<SelfServeTrialEndedDialog />);

    expect(
      screen.getByText(
        'Team includes 3 seats. You have 4 active users and 2 pending invitations. On Oct 26, the pending invitations sent during the trial will be deleted first, then the users added during the trial will be deactivated as needed to fit your seats.',
      ),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: 'Manage seats' })).toBeDefined();
  });

  it('uses the singular for one seat and one invitation', () => {
    state.graceEndsAt = GRACE_ENDS_AT;
    state.seats = { activeUsers: 2, pendingInvitations: 1, usersLimit: 1 };

    render(<SelfServeTrialEndedDialog />);

    expect(
      screen.getByText(
        'Team includes 1 seat. You have 2 active users and 1 pending invitation. On Oct 26, the pending invitations sent during the trial will be deleted first, then the users added during the trial will be deactivated as needed to fit your seats.',
      ),
    ).toBeDefined();
  });

  it('closes, remembers it was seen and opens the seat dialog from Manage seats', () => {
    state.graceEndsAt = GRACE_ENDS_AT;
    state.seats = { activeUsers: 4, pendingInvitations: 0, usersLimit: 2 };
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
    state.seats = { activeUsers: 4, pendingInvitations: 0, usersLimit: 2 };

    render(<SelfServeTrialEndedDialog />);

    expect(
      screen.getByText('Thanks for trying the Enterprise plan'),
    ).toBeDefined();
    expect(screen.queryByText(/added during the trial/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Manage seats' })).toBeNull();
  });

  it('leaves seats out when nobody is over the plan', () => {
    state.graceEndsAt = GRACE_ENDS_AT;

    render(<SelfServeTrialEndedDialog />);

    expect(screen.queryByText(/added during the trial/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Manage seats' })).toBeNull();
  });
});

type TestState = {
  endsAt: string;
  graceEndsAt: string | null;
  seats: {
    activeUsers: number;
    pendingInvitations: number;
    usersLimit: number;
  } | null;
};
