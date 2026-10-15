/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  planUsersLimit: 5 as number | null,
  subscription: undefined as unknown,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/api/platform-user-api', () => ({ platformUserApi: {} }));
vi.mock('@/app/components/admin', () => ({
  AdminPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AdminPageHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  AdminDataTable: () => null,
  ConfirmDialog: () => null,
  adminPageResources: { users: [] },
  useAdminAction: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
}));
vi.mock('@/app/components/enterprise-gate', () => ({
  EnterpriseGate: ({
    children,
    limit,
    used,
    unlocked,
  }: React.PropsWithChildren<{
    limit: number | null;
    used: number;
    unlocked: boolean;
  }>) => (
    <div
      data-testid="seat-gate"
      data-limit={String(limit)}
      data-used={String(used)}
      data-unlocked={String(unlocked)}
    >
      {children}
    </div>
  ),
}));
vi.mock('@/features/billing', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/billing')>()),
  billingQueries: {
    usePlatformSubscription: () => ({ data: state.subscription }),
  },
  useEnterpriseGate: ({ unlocked }: { unlocked: boolean }) => ({
    access: unlocked ? 'entitled' : 'upgrade',
    locked: !unlocked,
    run: vi.fn(),
    explain: vi.fn(),
  }),
  useSeatLimitGuard: () => ({
    isOutOfSeats: false,
    canBuySeats: false,
    ensureSeatsAvailable: () => true,
    handleSeatLimitError: vi.fn(),
    seatLimitDialog: null,
  }),
}));
vi.mock('@/features/members', () => ({
  InviteUserDialog: ({ onInviteSuccess }: { onInviteSuccess: () => void }) => (
    <button type="button" onClick={onInviteSuccess}>
      finish invite
    </button>
  ),
}));
vi.mock('@/features/members/api/user-invitation', () => ({
  userInvitationApi: { delete: vi.fn() },
}));
vi.mock('@/features/platform-admin/hooks/platform-user-hooks', () => ({
  platformUserHooks: {
    useUsers: () => ({ data: { data: [] }, refetch: vi.fn() }),
    usePlatformInvitations: () => ({ data: [], refetch: vi.fn() }),
  },
  platformUserKeys: { users: ['users'], invitations: ['invitations'] },
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: { usersLimit: state.planUsersLimit },
      },
    }),
  },
}));
vi.mock('@/app/routes/platform/users/actions/user-actions', () => ({
  UserActions: () => null,
}));
vi.mock('@/app/routes/platform/users/columns', () => ({
  createUsersTableColumns: () => [],
}));

import UsersPage from '@/app/routes/platform/users';
import { billingKeys } from '@/features/billing';

function renderPage() {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(
    <QueryClientProvider client={client}>
      <UsersPage />
    </QueryClientProvider>,
  );
  return { invalidate };
}

beforeEach(() => {
  state.planUsersLimit = 5;
  state.subscription = undefined;
});

describe('UsersPage seat count', () => {
  it('refreshes the subscription seat count after an invite, so the meter and gate see the new seat', () => {
    const { invalidate } = renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'finish invite' }));
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: billingKeys.platformSubscription('platform-1'),
    });
  });
});
