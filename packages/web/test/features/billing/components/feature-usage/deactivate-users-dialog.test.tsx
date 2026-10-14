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
const ADMIN_ID = 'admin-1';
const OWNER_ONLY = 'Only the owner can choose';

let users: TestUser[] = [];
let invitations: TestInvitation[] = [];
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
    useUsers: () => ({ data: { data: users } }),
    useInvitesReservingSeats: () => ({ data: invitations }),
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

function renderEnforced(params: RenderParams) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const onOpenChange = params.onOpenChange ?? vi.fn();
  const dialog = ({ viewerId, targetSeats, currentUsers }: RenderParams) => (
    <QueryClientProvider client={queryClient}>
      <DeactivateUsersDialog
        open={true}
        onOpenChange={onOpenChange}
        targetSeats={targetSeats}
        currentUsers={currentUsers}
        onConfirmed={vi.fn()}
        enforced={{
          description: 'Choose who to deactivate',
          ownerOnlyMessage: OWNER_ONLY,
          excludeUserId: viewerId,
          actions: null,
        }}
      />
    </QueryClientProvider>
  );
  const view = render(dialog(params));
  return {
    onOpenChange,
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
  updateUser.mockReset().mockResolvedValue(undefined);
  deleteInvitation.mockReset().mockResolvedValue(undefined);
  errorToast.mockReset();
  refreshBillingCaches.mockReset();
});

describe('DeactivateUsersDialog when a trial ends', () => {
  it('lets the owner choose however many invitations are pending', () => {
    invitations = Array.from({ length: 100 }, (_, index) =>
      invitation(`invite-${index}`),
    );

    renderEnforced({ viewerId: OWNER_ID, targetSeats: 1, currentUsers: 102 });

    expect(screen.queryByText(OWNER_ONLY)).toBeNull();
    expect(screen.getByText('Deactivate & continue')).toBeTruthy();
  });

  it('sends a non-owner admin to the owner when the plan has a single seat', () => {
    users = [user(OWNER_ID), user(ADMIN_ID), user('operator-1')];

    renderEnforced({ viewerId: ADMIN_ID, targetSeats: 1, currentUsers: 3 });

    expect(screen.getByText(OWNER_ONLY)).toBeTruthy();
    expect(screen.queryByText('Deactivate & continue')).toBeNull();
  });

  it('lets a non-owner admin choose when the plan has room for the owner and them', () => {
    users = [user(OWNER_ID), user(ADMIN_ID), user('operator-1')];

    renderEnforced({ viewerId: ADMIN_ID, targetSeats: 2, currentUsers: 3 });

    expect(screen.queryByText(OWNER_ONLY)).toBeNull();
  });

  it('counts one seat per invited email and revokes every invite for it', async () => {
    invitations = [
      invitation('invite-1', 'bob@example.com'),
      invitation('invite-2', 'Bob@example.com'),
    ];
    const { onOpenChange } = renderEnforced({
      viewerId: OWNER_ID,
      targetSeats: 1,
      currentUsers: 2,
    });

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
    const { onOpenChange, rerender } = renderEnforced({
      viewerId: OWNER_ID,
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

type RenderParams = {
  viewerId: string;
  targetSeats: number;
  currentUsers: number;
  onOpenChange?: (open: boolean) => void;
};
