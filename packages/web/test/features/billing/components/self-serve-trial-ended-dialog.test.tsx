/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-class, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
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
  userIds: null,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: { plan: 'team' },
        selfServeTrial: {
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
        plan: { plan: 'team' },
        autumnPlanName: 'Team',
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
  state.userIds = null;
  billingDialogHooks.useTrialSeatDialogStore.setState({ isOpen: false });
});

describe('seat grace after the trial', () => {
  beforeEach(() => {
    state.endsAt = dayjs().subtract(2, 'day').toISOString();
  });

  it('warns how many users are over the plan and when they are deactivated', () => {
    state.graceEndsAt = GRACE_ENDS_AT;
    state.userIds = ['a', 'b', 'c'];

    render(<SelfServeTrialEndedDialog />);

    expect(
      screen.getByText(
        "3 users added during the trial are over Team's seats and will be deactivated on Oct 26.",
      ),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: 'Manage seats' })).toBeDefined();
  });

  it('says is for a single user', () => {
    state.graceEndsAt = GRACE_ENDS_AT;
    state.userIds = ['a'];

    render(<SelfServeTrialEndedDialog />);

    expect(
      screen.getByText(
        "1 user added during the trial is over Team's seats and will be deactivated on Oct 26.",
      ),
    ).toBeDefined();
  });

  it('closes, remembers it was seen and opens the seat dialog from Manage seats', () => {
    state.graceEndsAt = GRACE_ENDS_AT;
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
    state.graceEndsAt = GRACE_ENDS_AT;

    render(<SelfServeTrialEndedDialog />);

    expect(screen.queryByText(/added during the trial/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Manage seats' })).toBeNull();
  });
});

type TestState = {
  endsAt: string;
  graceEndsAt: string | null;
  userIds: string[] | null;
};
