/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { PlatformAdminSurface } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import * as React from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { SelfServeTrialSeatDialog } from '@/features/billing/components/self-serve-trial-seat-dialog';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';
import type { SeatGrace } from '@/features/billing/hooks/self-serve-trial-hooks';

import { icuI18n } from '../../../i18n/icu-i18n';

const state = vi.hoisted<TestState>(() => ({
  isPlatformAdmin: true,
  grace: null,
  info: undefined,
  subscriptionEnabled: undefined,
  dialogProps: null,
}));
const refreshSubscriptionInfo = vi.hoisted(() => vi.fn());
const refreshBillingCaches = vi.hoisted(() => vi.fn());
const upgradeClick = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: { selfServeTrialEndsAt: null },
      },
    }),
  },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => state.isPlatformAdmin,
}));

vi.mock('@/features/billing/hooks/self-serve-trial-hooks', () => ({
  selfServeTrialHooks: {
    useSeatGrace: () => state.grace,
  },
}));

vi.mock('@/features/billing/hooks/billing-hooks', () => ({
  billingQueries: {
    usePlatformSubscription: (_platformId: string, enabled: boolean) => {
      state.subscriptionEnabled = enabled;
      return { data: enabled ? state.info : undefined };
    },
  },
  refreshBillingCaches,
}));

vi.mock('@/features/billing/api/billing-plans-api', () => ({
  platformBillingApi: { refreshSubscriptionInfo },
}));

vi.mock('@/features/billing/hooks/use-upgrade-click', () => ({
  useUpgradeClick: () => upgradeClick,
}));

vi.mock(
  '@/features/billing/components/feature-usage/deactivate-users-dialog',
  () => ({
    DeactivateUsersDialog: (props: DialogProps) => {
      state.dialogProps = props;
      return props.open ? (
        <div>
          <p>{props.description}</p>
          <p>{props.preselectedLabel}</p>
          {props.actions}
        </div>
      ) : null;
    },
  }),
);

function renderSeatDialog() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SelfServeTrialSeatDialog />
    </QueryClientProvider>,
  );
}

function openDialog() {
  billingDialogHooks.useTrialSeatDialogStore.setState({ isOpen: true });
}

function graceOf(): SeatGrace {
  return {
    endsAt: new Date(2026, 9, 26, 12, 0, 0),
    daysLeft: 3,
    endsToday: false,
    ending: false,
    seats: 2,
    isPlatformAdmin: true,
  };
}

function infoOf(overrides: Partial<InfoState> = {}): InfoState {
  return {
    autumnPlanName: 'Team',
    plan: { usersLimit: 2, scheduledUsersLimit: null },
    seatGrace: { usedSeats: 9, seatLimit: 2, userIds: ['u1', 'u2'] },
    ...overrides,
  };
}

function openedProps(): DialogProps {
  if (state.dialogProps === null) {
    throw new Error('the deactivate dialog was never rendered');
  }
  return state.dialogProps;
}

beforeAll(async () => {
  await icuI18n.init();
});

beforeEach(() => {
  state.isPlatformAdmin = true;
  state.grace = graceOf();
  state.info = infoOf();
  state.subscriptionEnabled = undefined;
  state.dialogProps = null;
  refreshSubscriptionInfo.mockReset().mockResolvedValue(undefined);
  refreshBillingCaches.mockReset();
  upgradeClick.mockReset();
  billingDialogHooks.useTrialSeatDialogStore.setState({ isOpen: false });
});

describe('seat dialog after the trial', () => {
  it('stays closed until an admin opens it', () => {
    renderSeatDialog();

    expect(openedProps().open).toBe(false);
    expect(screen.queryByText('Leaves Oct 26')).toBeNull();
  });

  it('opens with the users who would leave already ticked', () => {
    openDialog();

    renderSeatDialog();

    const props = openedProps();
    expect(props.open).toBe(true);
    expect(props.targetSeats).toBe(2);
    expect(props.currentUsers).toBe(9);
    expect(props.preselectedUserIds).toEqual(['u1', 'u2']);
    expect(props.hideEmbeddedUsers).toBe(true);
    expect(screen.getByText('Leaves Oct 26')).toBeDefined();
    expect(
      screen.getByText(
        'Your Enterprise trial has ended and the Team plan includes 2 seats. The users ticked below will be deactivated on Oct 26. Change who goes, or upgrade to keep everyone.',
      ),
    ).toBeDefined();
  });

  it('names the Free plan when the subscription has no plan name', () => {
    state.info = infoOf({ autumnPlanName: null });
    openDialog();

    renderSeatDialog();

    expect(screen.getByText(/the Free plan includes 2 seats\./)).toBeDefined();
  });

  it('aims for the seats the server counts against, not a scheduled downgrade', () => {
    state.info = infoOf({
      plan: { usersLimit: 5, scheduledUsersLimit: 1 },
      seatGrace: { usedSeats: 7, seatLimit: 5, userIds: ['u1', 'u2'] },
    });
    openDialog();

    renderSeatDialog();

    expect(openedProps().targetSeats).toBe(5);
    expect(screen.getByText(/includes 5 seats\./)).toBeDefined();
  });

  it('renders nothing when the platform has no grace', () => {
    state.grace = null;
    openDialog();

    renderSeatDialog();

    expect(state.dialogProps).toBeNull();
  });

  it('renders nothing once the platform fits its seats', () => {
    state.info = infoOf({ seatGrace: null });
    openDialog();

    renderSeatDialog();

    expect(state.dialogProps).toBeNull();
  });

  it('asks for the subscription of an admin while the grace runs', () => {
    renderSeatDialog();

    expect(state.subscriptionEnabled).toBe(true);
  });

  it('never asks for the subscription on behalf of a member', () => {
    state.isPlatformAdmin = false;

    renderSeatDialog();

    expect(state.subscriptionEnabled).toBe(false);
    expect(state.dialogProps).toBeNull();
  });

  it('closes for good when the admin dismisses it', () => {
    openDialog();
    renderSeatDialog();

    act(() => openedProps().onOpenChange(false));

    expect(billingDialogHooks.useTrialSeatDialogStore.getState().isOpen).toBe(
      false,
    );
  });

  it('asks the server to settle the grace and refreshes billing once the users are deactivated', async () => {
    openDialog();
    renderSeatDialog();

    openedProps().onConfirmed();

    await waitFor(() => expect(refreshBillingCaches).toHaveBeenCalledTimes(1));
    expect(refreshSubscriptionInfo).toHaveBeenCalledTimes(1);
  });

  it('refreshes billing even when the server refresh fails', async () => {
    refreshSubscriptionInfo.mockRejectedValue(new Error('offline'));
    openDialog();
    renderSeatDialog();

    openedProps().onConfirmed();

    await waitFor(() => expect(refreshBillingCaches).toHaveBeenCalledTimes(1));
  });

  it('hands over to the plans dialog from Explore plans', () => {
    openDialog();
    renderSeatDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Explore plans' }));

    expect(billingDialogHooks.useTrialSeatDialogStore.getState().isOpen).toBe(
      false,
    );
    expect(upgradeClick).toHaveBeenCalledWith({
      surface: PlatformAdminSurface.DIALOG,
    });
  });
});

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetSeats: number;
  currentUsers: number;
  description?: string;
  preselectedUserIds?: string[];
  preselectedLabel?: string;
  hideEmbeddedUsers?: boolean;
  actions?: React.ReactNode;
  onConfirmed: () => void;
};

type InfoState = {
  autumnPlanName: string | null;
  plan: { usersLimit: number | null; scheduledUsersLimit: number | null };
  seatGrace: { usedSeats: number; seatLimit: number; userIds: string[] } | null;
};

type TestState = {
  isPlatformAdmin: boolean;
  grace: SeatGrace | null;
  info: InfoState | undefined;
  subscriptionEnabled: boolean | undefined;
  dialogProps: DialogProps | null;
};
