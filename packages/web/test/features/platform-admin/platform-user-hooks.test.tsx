// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listUsers = vi.fn();
const listReservingSeats = vi.fn();

vi.mock('@/api/platform-user-api', () => ({
  platformUserApi: { list: (request: unknown) => listUsers(request) },
}));

vi.mock('@/features/members/api/user-invitation', () => ({
  userInvitationApi: {
    listReservingSeats: (request: unknown) => listReservingSeats(request),
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
    listReservingSeats.mockReset();
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

  it('asks the server to leave embedded users out when told to', async () => {
    listUsers.mockResolvedValueOnce({ data: [{ id: 'member' }], next: null });

    const { result } = renderHook(
      () => platformUserHooks.useAllUsers({ excludeEmbedded: true }),
      { wrapper },
    );

    await waitFor(() =>
      expect(result.current.data).toEqual([{ id: 'member' }]),
    );
    expect(listUsers).toHaveBeenCalledWith(
      expect.objectContaining({ excludeEmbedded: true }),
    );
  });

  it('loads every page of invites that hold a seat', async () => {
    listReservingSeats
      .mockResolvedValueOnce({ data: [{ id: 'invite-1' }], next: 'page-2' })
      .mockResolvedValueOnce({ data: [{ id: 'invite-2' }], next: null });

    const { result } = renderHook(
      () => platformUserHooks.useInvitesReservingSeats(),
      { wrapper },
    );

    await waitFor(() =>
      expect(result.current.data).toEqual([
        { id: 'invite-1' },
        { id: 'invite-2' },
      ]),
    );
    expect(listReservingSeats).toHaveBeenCalledTimes(2);
  });
});
