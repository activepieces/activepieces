// @vitest-environment jsdom
import { UserStatus } from '@activepieces/shared';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const server = vi.hoisted(() => ({
  users: [] as { id: string; email: string; status: string }[],
  invitations: [] as { id: string; email: string }[],
  deleteInvitation: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/custom/text-with-tooltip', () => ({
  TextWithTooltip: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({ platform: { ownerId: 'owner' } }),
  },
}));

vi.mock('@/features/billing/hooks/billing-hooks', () => ({
  PLATFORM_BILLING_SUBSCRIPTION_KEY: ['platform-billing-subscription'],
}));

vi.mock('@/features/platform-admin/hooks/platform-user-hooks', () => ({
  platformUserKeys: {
    users: ['users'],
    invitations: ['platform-invitations'],
  },
  platformUserHooks: {
    useUsers: () =>
      useQuery({
        queryKey: ['users'],
        queryFn: async () => ({
          data: server.users.map((user) => ({ ...user })),
        }),
      }),
    usePlatformInvitations: () =>
      useQuery({
        queryKey: ['platform-invitations'],
        queryFn: async () => [...server.invitations],
      }),
  },
}));

vi.mock('@/features/members/api/user-invitation', () => ({
  userInvitationApi: { delete: server.deleteInvitation },
}));

vi.mock('@/api/platform-user-api', () => ({
  platformUserApi: { update: server.updateUser },
}));

import { DeactivateUsersDialog } from '@/features/billing/components/feature-usage/deactivate-users-dialog';

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as never;

describe('DeactivateUsersDialog partial revocation failure', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    server.users = [
      { id: 'owner', email: 'owner@example.com', status: UserStatus.ACTIVE },
    ];
    server.invitations = [
      { id: 'inv-a', email: 'a@example.com' },
      { id: 'inv-b', email: 'b@example.com' },
    ];
    server.deleteInvitation.mockReset();
    server.updateUser.mockReset();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('retries only the revocation that failed, and completes once it succeeds', async () => {
    let failB = true;
    server.deleteInvitation.mockImplementation(async (id: string) => {
      if (!server.invitations.some((invitation) => invitation.id === id)) {
        throw new Error('ENTITY_NOT_FOUND');
      }
      if (id === 'inv-b' && failB) {
        throw new Error('transient');
      }
      server.invitations = server.invitations.filter(
        (invitation) => invitation.id !== id,
      );
    });
    const onConfirmed = vi.fn();
    renderDialog({ queryClient, onConfirmed });

    await selectRows(['a@example.com', 'b@example.com']);
    clickContinue();

    await waitFor(() =>
      expect(screen.queryAllByText('a@example.com')).toHaveLength(0),
    );
    expect(screen.getAllByText('b@example.com')).toHaveLength(1);
    expect(onConfirmed).not.toHaveBeenCalled();

    failB = false;
    server.deleteInvitation.mockClear();
    await waitFor(() => expect(continueButton().disabled).toBe(false));
    clickContinue();

    await waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
    expect(server.deleteInvitation.mock.calls.map(([id]) => id)).toEqual([
      'inv-b',
    ]);
  });

  it('drops an invitation another admin already revoked instead of re-sending it', async () => {
    server.deleteInvitation.mockImplementation(async (id: string) => {
      if (id === 'inv-b') {
        server.invitations = server.invitations.filter(
          (invitation) => invitation.id !== 'inv-b',
        );
        throw new Error('ENTITY_NOT_FOUND');
      }
      server.invitations = server.invitations.filter(
        (invitation) => invitation.id !== id,
      );
    });
    const onConfirmed = vi.fn();
    renderDialog({ queryClient, onConfirmed });

    await selectRows(['a@example.com', 'b@example.com']);
    clickContinue();

    await waitFor(() =>
      expect(screen.queryAllByText('b@example.com')).toHaveLength(0),
    );
    expect(onConfirmed).not.toHaveBeenCalled();

    server.deleteInvitation.mockClear();
    await waitFor(() => expect(continueButton().disabled).toBe(false));
    clickContinue();

    await waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
    expect(server.deleteInvitation).not.toHaveBeenCalled();
  });

  it('re-sends only the user deactivation that failed', async () => {
    server.invitations = [];
    server.users.push(
      { id: 'user-c', email: 'c@example.com', status: UserStatus.ACTIVE },
      { id: 'user-d', email: 'd@example.com', status: UserStatus.ACTIVE },
    );
    let failD = true;
    server.updateUser.mockImplementation(
      async (id: string, request: { status: string }) => {
        if (id === 'user-d' && failD) {
          throw new Error('transient');
        }
        server.users = server.users.map((user) =>
          user.id === id ? { ...user, status: request.status } : user,
        );
      },
    );
    const onConfirmed = vi.fn();
    renderDialog({ queryClient, onConfirmed });

    await selectRows(['c@example.com', 'd@example.com']);
    clickContinue();

    await waitFor(() =>
      expect(screen.queryAllByText('c@example.com')).toHaveLength(0),
    );
    expect(screen.getAllByText('d@example.com')).toHaveLength(1);
    expect(onConfirmed).not.toHaveBeenCalled();

    failD = false;
    server.updateUser.mockClear();
    await waitFor(() => expect(continueButton().disabled).toBe(false));
    clickContinue();

    await waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
    expect(server.updateUser.mock.calls.map(([id]) => id)).toEqual(['user-d']);
  });
});

function SeatAwareDialog({ onConfirmed }: { onConfirmed: () => void }) {
  const { data: usedSeats } = useQuery({
    queryKey: ['platform-billing-subscription'],
    queryFn: async () =>
      server.users.filter((user) => user.status === UserStatus.ACTIVE).length +
      server.invitations.length,
  });
  if (usedSeats === undefined) {
    return null;
  }
  return (
    <DeactivateUsersDialog
      open
      onOpenChange={vi.fn()}
      targetSeats={1}
      currentUsers={usedSeats}
      onConfirmed={onConfirmed}
    />
  );
}

function renderDialog({
  queryClient,
  onConfirmed,
}: {
  queryClient: QueryClient;
  onConfirmed: () => void;
}) {
  render(
    <QueryClientProvider client={queryClient}>
      <SeatAwareDialog onConfirmed={onConfirmed} />
    </QueryClientProvider>,
  );
}

async function selectRows(emails: string[]) {
  for (const email of emails) {
    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: (accessibleName) => accessibleName.startsWith(email),
      }),
    );
  }
}

function continueButton(): HTMLButtonElement {
  return screen.getByRole<HTMLButtonElement>('button', {
    name: /& continue$/,
  });
}

function clickContinue() {
  fireEvent.click(continueButton());
}
