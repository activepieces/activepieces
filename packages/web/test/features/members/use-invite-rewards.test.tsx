// @vitest-environment jsdom
import { ApEdition } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  edition: 'CLOUD',
  isPlatformAdmin: true,
  usersLimit: 5 as number | null,
  scheduledUsersLimit: null as number | null,
  activeUsers: 1,
  invitedSeats: 0,
}));

const getBillingInfo = vi.fn();

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: state.edition }) },
}));
vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => state.isPlatformAdmin,
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform_1',
        plan: {
          usersLimit: state.usersLimit,
          scheduledUsersLimit: state.scheduledUsersLimit,
        },
        usage: {
          users: state.activeUsers + state.invitedSeats,
          invitedSeats: state.invitedSeats,
        },
      },
    }),
  },
}));
vi.mock('@/features/billing/api/billing-plans-api', () => ({
  platformBillingApi: { getSubscriptionInfo: () => getBillingInfo() },
}));

import { useInviteRewards } from '@/features/members/hooks/use-invite-rewards';

describe('useInviteRewards', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    getBillingInfo.mockReset();
    state.edition = ApEdition.CLOUD;
    state.isPlatformAdmin = true;
    state.usersLimit = 5;
    state.scheduledUsersLimit = null;
    state.activeUsers = 1;
    state.invitedSeats = 0;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('shows the offer on an eligible platform with rewards and seats left', async () => {
    getBillingInfo.mockResolvedValue({ rewardedInvitesLeft: 3 });

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(result.current.rewardedInvitesLeft).toBe(3);
    expect(result.current.creditsPerInvite).toBe(1000);
  });

  it('counts rewards left under the cap, however few seats are free', async () => {
    state.activeUsers = 3;
    state.invitedSeats = 1;
    getBillingInfo.mockResolvedValue({ rewardedInvitesLeft: 4 });

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(result.current.rewardedInvitesLeft).toBe(4);
  });

  it('hides the offer once every seat is taken', async () => {
    state.activeUsers = 5;
    getBillingInfo.mockResolvedValue({ rewardedInvitesLeft: 4 });

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    await waitFor(() => expect(result.current.rewardedInvitesLeft).toBe(4));
    expect(result.current.visible).toBe(false);
  });

  it('hides the offer when a scheduled downgrade leaves no free seat', async () => {
    state.usersLimit = 10;
    state.scheduledUsersLimit = 5;
    state.activeUsers = 5;
    getBillingInfo.mockResolvedValue({ rewardedInvitesLeft: 4 });

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    await waitFor(() => expect(result.current.rewardedInvitesLeft).toBe(4));
    expect(result.current.visible).toBe(false);
  });

  it('knows the platform while the rewards are still loading', () => {
    getBillingInfo.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    expect(result.current.visible).toBe(false);
    expect(result.current.platformId).toBe('platform_1');
  });

  it('hides the offer once all four rewards are earned', async () => {
    getBillingInfo.mockResolvedValue({ rewardedInvitesLeft: 0 });

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    await waitFor(() => expect(result.current.rewardedInvitesLeft).toBe(0));
    expect(result.current.visible).toBe(false);
  });

  it('offers nothing on a plan without reward slots', async () => {
    getBillingInfo.mockResolvedValue({ rewardedInvitesLeft: null });

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    await waitFor(() => expect(getBillingInfo).toHaveBeenCalled());
    expect(result.current.visible).toBe(false);
    expect(result.current.rewardedInvitesLeft).toBeNull();
  });

  it('never asks the server outside Cloud', async () => {
    state.edition = ApEdition.ENTERPRISE;

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    expect(result.current.visible).toBe(false);
    expect(getBillingInfo).not.toHaveBeenCalled();
  });

  it('never asks the server for a non-admin', async () => {
    state.isPlatformAdmin = false;

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    expect(result.current.visible).toBe(false);
    expect(getBillingInfo).not.toHaveBeenCalled();
  });

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
});
