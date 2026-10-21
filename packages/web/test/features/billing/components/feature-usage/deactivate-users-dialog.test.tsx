/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { PlatformRole, UserStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const OWNER_ID = 'owner-1';
const LEAVES_LABEL = 'Leaves Oct 26';

let users: TestUser[] = [];
let invitations: TestInvitation[] = [];
const allUsers = vi.fn();
const updateUser = vi.fn();
const deleteInvitation = vi.fn();
const errorToast = vi.fn();
const refreshBillingCaches = vi.fn();

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { id: 'platform-1', ownerId: OWNER_ID },
    }),
  },
}));

vi.mock('@/features/platform-admin/hooks/platform-user-hooks', () => ({
  platformUserKeys: { users: ['users'], invitations: ['invitations'] },
  platformUserHooks: {
    useAllUsers: (params: unknown) => allUsers(params),
    useInvitesReservingSeats: () => ({
      data: invitations,
      refetch: () => Promise.resolve(),
    }),
  },
}));

vi.mock('@/api/platform-user-api', () => ({
  platformUserApi: { update: (...args: unknown[]) => updateUser(...args) },
}));

vi.mock('@/features/members/api/user-invitation', () => ({
  userInvitationApi: {
    delete: (...args: unknown[]) => deleteInvitation(...args),
  },
}));

vi.mock('@/components/ui/sonner', () => ({
  internalErrorToast: () => errorToast(),
}));

vi.mock('@/features/billing/hooks/billing-hooks', () => ({
  refreshBillingCaches: () => refreshBillingCaches(),
}));

vi.mock('@/lib/admin-control', () => ({
  AdminControl: { BILLING_DEACTIVATE_USERS_SUBMIT: 'submit' },
  adminControl: () => ({}),
}));

import { DeactivateUsersDialog } from '@/features/billing/components/feature-usage/deactivate-users-dialog';

function renderDialog(params: RenderParams) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();
  const onConfirmed = vi.fn();
  const dialog = (next: RenderParams) => (
    <QueryClientProvider client={queryClient}>
      <DeactivateUsersDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirmed={onConfirmed}
        {...next}
      />
    </QueryClientProvider>
  );
  const view = render(dialog(params));
  return {
    onOpenChange,
    onConfirmed,
    rerender: (next: Partial<RenderParams>) =>
      view.rerender(dialog({ ...params, ...next })),
  };
}

function user(id: string): TestUser {
  return {
    id,
    email: `${id}@example.com`,
    status: UserStatus.ACTIVE,
    platformRole: PlatformRole.OPERATOR,
  };
}

function invitation(id: string, email = `${id}@example.com`): TestInvitation {
  return { id, email };
}

function tickedStates(): (string | null)[] {
  return screen
    .getAllByRole('checkbox')
    .map((checkbox) => checkbox.getAttribute('aria-checked'));
}

function submitButton(): HTMLButtonElement {
  return screen.getByRole<HTMLButtonElement>('button', {
    name: 'Deactivate & continue',
  });
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  users = [user(OWNER_ID)];
  invitations = [];
  allUsers.mockReset().mockImplementation(() => ({ data: users }));
  updateUser.mockReset().mockResolvedValue(undefined);
  deleteInvitation.mockReset().mockResolvedValue(undefined);
  errorToast.mockReset();
  refreshBillingCaches.mockReset();
});

describe('DeactivateUsersDialog preselection', () => {
  it('shows a retry instead of empty lists when the users cannot load', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    allUsers.mockImplementation(() => ({
      data: undefined,
      isError: true,
      refetch,
    }));

    renderDialog({
      targetSeats: 1,
      currentUsers: 3,
      preselectedUserIds: ['a'],
    });

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(submitButton().disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it('asks for the users without the embedded ones when told to hide them', () => {
    renderDialog({ targetSeats: 1, currentUsers: 1, hideEmbeddedUsers: true });

    expect(allUsers).toHaveBeenCalledWith({ excludeEmbedded: true });
  });

  it('asks for every user by default', () => {
    renderDialog({ targetSeats: 1, currentUsers: 1 });

    expect(allUsers).toHaveBeenCalledWith({ excludeEmbedded: false });
  });

  it('starts with the preselected users ticked and labels them', () => {
    users = [user(OWNER_ID), user('a'), user('b'), user('c')];

    renderDialog({
      targetSeats: 2,
      currentUsers: 4,
      preselectedUserIds: ['a', 'b'],
      preselectedLabel: LEAVES_LABEL,
    });

    expect(tickedStates()).toEqual(['true', 'true', 'false']);
    expect(screen.getAllByText(LEAVES_LABEL)).toHaveLength(2);
    expect(screen.getAllByText('Operator')).toHaveLength(1);
    expect(submitButton().disabled).toBe(false);
  });

  it('shows the role of every user while nobody is preselected', () => {
    users = [user(OWNER_ID), user('a'), user('b')];

    renderDialog({ targetSeats: 1, currentUsers: 3 });

    expect(tickedStates()).toEqual(['false', 'false']);
    expect(screen.getAllByText('Operator')).toHaveLength(2);
    expect(submitButton().disabled).toBe(true);
  });

  it('ignores preselected users who cannot be deactivated', () => {
    users = [
      user(OWNER_ID),
      user('a'),
      { ...user('gone'), status: UserStatus.INACTIVE },
    ];

    renderDialog({
      targetSeats: 1,
      currentUsers: 3,
      preselectedUserIds: [OWNER_ID, 'a', 'gone', 'unknown'],
      preselectedLabel: LEAVES_LABEL,
    });

    expect(tickedStates()).toEqual(['true']);
    expect(screen.getAllByText(LEAVES_LABEL)).toHaveLength(1);
    expect(submitButton().disabled).toBe(true);
  });

  it('applies the preselection to users who arrive after the dialog opens', () => {
    const { rerender } = renderDialog({
      targetSeats: 1,
      currentUsers: 3,
      preselectedUserIds: ['a', 'b'],
    });
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

    users = [user(OWNER_ID), user('a'), user('b')];
    rerender({});

    expect(tickedStates()).toEqual(['true', 'true']);
    expect(submitButton().disabled).toBe(false);
  });

  it('keeps its starting selection when the preselection changes while open', () => {
    users = [user(OWNER_ID), user('a'), user('b')];
    const { rerender } = renderDialog({
      targetSeats: 1,
      currentUsers: 3,
      preselectedUserIds: ['a'],
    });
    expect(tickedStates()).toEqual(['true', 'false']);

    rerender({ preselectedUserIds: ['b'] });

    expect(tickedStates()).toEqual(['true', 'false']);
  });

  it('lets the admin change who leaves before deactivating', async () => {
    users = [user(OWNER_ID), user('a'), user('b'), user('c')];
    const { onOpenChange, onConfirmed } = renderDialog({
      targetSeats: 2,
      currentUsers: 4,
      preselectedUserIds: ['a', 'b'],
      preselectedLabel: LEAVES_LABEL,
    });

    const [first, , third] = screen.getAllByRole('checkbox');
    fireEvent.click(first);
    expect(tickedStates()).toEqual(['false', 'true', 'false']);
    expect(submitButton().disabled).toBe(true);

    fireEvent.click(third);
    expect(tickedStates()).toEqual(['false', 'true', 'true']);
    expect(submitButton().disabled).toBe(false);

    fireEvent.click(submitButton());

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledTimes(2);
    expect(updateUser).toHaveBeenCalledWith('b', {
      status: UserStatus.INACTIVE,
    });
    expect(updateUser).toHaveBeenCalledWith('c', {
      status: UserStatus.INACTIVE,
    });
  });
});

describe('DeactivateUsersDialog framing', () => {
  it('shows the description and extra actions it is given next to Cancel', () => {
    users = [user(OWNER_ID), user('a')];

    const { onOpenChange } = renderDialog({
      targetSeats: 1,
      currentUsers: 2,
      description: 'Your trial has ended',
      actions: <button type="button">Explore plans</button>,
    });

    expect(screen.getByText('Your trial has ended')).toBeTruthy();
    expect(screen.getByText('Explore plans')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('can always be closed from the corner', () => {
    renderDialog({ targetSeats: 1, currentUsers: 1 });

    expect(screen.getByText('Close')).toBeTruthy();
  });
});

describe('DeactivateUsersDialog invitations', () => {
  it('counts one seat per invited email and revokes every invite for it', async () => {
    invitations = [
      invitation('invite-1', 'bob@example.com'),
      invitation('invite-2', 'Bob@example.com'),
    ];
    const { onOpenChange } = renderDialog({ targetSeats: 1, currentUsers: 2 });

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(1);
    fireEvent.click(checkboxes[0]);
    fireEvent.click(screen.getByText('Revoke & continue'));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(deleteInvitation).toHaveBeenCalledTimes(2);
    expect(deleteInvitation).toHaveBeenCalledWith('invite-1');
    expect(deleteInvitation).toHaveBeenCalledWith('invite-2');
  });

  it('stays open after a partial failure and retries only what is still there', async () => {
    users = [user(OWNER_ID), user('operator-1')];
    invitations = [invitation('invite-1')];
    updateUser.mockRejectedValueOnce(new Error('network'));
    const { onOpenChange, rerender } = renderDialog({
      targetSeats: 1,
      currentUsers: 3,
    });

    screen
      .getAllByRole('checkbox')
      .forEach((checkbox) => fireEvent.click(checkbox));
    fireEvent.click(screen.getByText('Deactivate & continue'));

    await waitFor(() => expect(errorToast).toHaveBeenCalledTimes(1));
    expect(refreshBillingCaches).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();

    invitations = [];
    rerender({ currentUsers: 2 });
    fireEvent.click(screen.getByText('Deactivate & continue'));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(deleteInvitation).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledTimes(2);
    expect(updateUser).toHaveBeenLastCalledWith('operator-1', {
      status: UserStatus.INACTIVE,
    });
  });
});

type TestUser = {
  id: string;
  email: string;
  status: UserStatus;
  platformRole: PlatformRole;
};

type TestInvitation = {
  id: string;
  email: string;
};

type RenderParams = Omit<
  React.ComponentProps<typeof DeactivateUsersDialog>,
  'open' | 'onOpenChange' | 'onConfirmed'
>;
