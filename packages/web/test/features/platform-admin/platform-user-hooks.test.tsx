// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { InvitationType } from '@activepieces/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listUsers = vi.fn();
const listAllInvitations = vi.fn();

vi.mock('@/api/platform-user-api', () => ({
  platformUserApi: { list: (request: unknown) => listUsers(request) },
}));

vi.mock('@/features/members/api/user-invitation', () => ({
  userInvitationApi: {
    listAll: (request: unknown) => listAllInvitations(request),
  },
}));

vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: { id: 'admin-1' } }) },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({
    checkAccess: () => true,
    isFetchingProjectRole: false,
  }),
}));

import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';

describe('platformUserHooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    listUsers.mockReset();
    listAllInvitations.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('loads every page of users, not just the newest', async () => {
    listUsers
      .mockResolvedValueOnce({ data: [{ id: 'newest' }], next: 'page-2' })
      .mockResolvedValueOnce({ data: [{ id: 'oldest' }], next: null });

    const { result } = renderHook(() => platformUserHooks.useAllUsers(), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.data).toEqual([{ id: 'newest' }, { id: 'oldest' }]),
    );
    expect(listUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: 'page-2' }),
    );
  });

  it('loads platform and project invites of every project and drops expired ones', async () => {
    const fresh = new Date().toISOString();
    const expired = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    listAllInvitations.mockImplementation(
      ({ type }: { type: InvitationType }) =>
        Promise.resolve(
          type === InvitationType.PLATFORM
            ? [
                { id: 'platform-invite', updated: fresh },
                { id: 'expired-invite', updated: expired },
              ]
            : [{ id: 'project-invite', updated: fresh }],
        ),
    );

    const { result } = renderHook(
      () => platformUserHooks.useInvitesReservingSeats(),
      { wrapper },
    );

    await waitFor(() =>
      expect(result.current.data?.map((invitation) => invitation.id)).toEqual(
        ['platform-invite', 'project-invite'],
      ),
    );
    expect(listAllInvitations).toHaveBeenCalledWith(
      expect.objectContaining({ type: InvitationType.PLATFORM, projectId: null }),
    );
    expect(listAllInvitations).toHaveBeenCalledWith(
      expect.objectContaining({ type: InvitationType.PROJECT, projectId: null }),
    );
  });
});
