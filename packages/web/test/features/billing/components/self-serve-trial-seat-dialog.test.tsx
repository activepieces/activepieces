/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { UpgradeLocationInWebApp } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SelfServeTrialSeatDialog } from '@/features/billing/components/self-serve-trial-sidebar';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';
import { icuI18n } from '../../../i18n/icu-i18n';

const state = vi.hoisted<TestState>(() => ({
  isPlatformAdmin: true,
  graceEndsAt: null,
  info: undefined,
  subscriptionFailed: false,
  subscriptionEnabled: undefined,
  dialogProps: null,
}));
const refetchSubscription = vi.hoisted(() => vi.fn());
const refreshSubscriptionInfo = vi.hoisted(() => vi.fn());
const refreshBillingCaches = vi.hoisted(() => vi.fn());
const upgradeClick = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: { usersLimit: 2 },
        selfServeTrial: {
          startedAt: '2026-10-12T12:00:00.000Z',
          endsAt: '2026-10-19T12:00:00.000Z',
          seatGraceEndsAt: state.graceEndsAt,
        },
      },
    }),
  },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => state.isPlatformAdmin,
}));

vi.mock('@/features/billing/hooks/billing-hooks', () => ({
  billingQueries: {
    usePlatformSubscription: (_platformId: string, enabled: boolean) => {
      state.subscriptionEnabled = enabled;
      return {
        data: enabled ? state.info : undefined,
        isError: enabled && state.subscriptionFailed,
        refetch: refetchSubscription,
      };
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

function infoOf(overrides: Partial<InfoState> = {}): InfoState {
  return {
    autumnPlanName: 'Team',
    plan: { plan: 'team', usersLimit: 2, scheduledUsersLimit: null },
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
  state.graceEndsAt = new Date(2026, 9, 26, 12, 0, 0).toISOString();
  state.info = infoOf();
  state.subscriptionFailed = false;
  state.subscriptionEnabled = undefined;
  refetchSubscription.mockReset().mockResolvedValue(undefined);
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
        'Your Enterprise trial has ended and Team includes 2 seats. The users ticked below will be deactivated on Oct 26. Change who goes, or upgrade to keep everyone.',
      ),
    ).toBeDefined();
  });

  it('aims for the seats the server counts against, not a scheduled downgrade', () => {
    state.info = infoOf({
      plan: { plan: 'team', usersLimit: 5, scheduledUsersLimit: 1 },
      seatGrace: { usedSeats: 7, seatLimit: 5, userIds: ['u1', 'u2'] },
    });
    openDialog();

    renderSeatDialog();

    expect(openedProps().targetSeats).toBe(5);
    expect(screen.getByText(/includes 5 seats\./)).toBeDefined();
  });

  it('renders nothing when the platform has no grace', () => {
    state.graceEndsAt = null;
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

  it('shows the failed seat read with a retry when an admin opens it', async () => {
    state.info = undefined;
    state.subscriptionFailed = true;
    openDialog();

    renderSeatDialog();

    expect(screen.getByText('Trouble loading users')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(refetchSubscription).toHaveBeenCalledTimes(1));
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
      locationInWebApp: UpgradeLocationInWebApp.DIALOG,
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
  plan: {
    plan: string;
    usersLimit: number | null;
    scheduledUsersLimit: number | null;
  };
  seatGrace: { usedSeats: number; seatLimit: number; userIds: string[] } | null;
};

type TestState = {
  isPlatformAdmin: boolean;
  graceEndsAt: string | null;
  info: InfoState | undefined;
  subscriptionFailed: boolean;
  subscriptionEnabled: boolean | undefined;
  dialogProps: DialogProps | null;
};
