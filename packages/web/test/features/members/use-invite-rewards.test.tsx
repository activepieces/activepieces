// @vitest-environment jsdom
import { ApEdition, InviteRewardSummary } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  edition: 'CLOUD',
  isPlatformAdmin: true,
  usersLimit: 5 as number | null,
  activeUsers: 1,
  invitedSeats: 0,
}));

const getSummary = vi.fn();

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
        plan: { usersLimit: state.usersLimit },
        usage: {
          activeUsers: state.activeUsers,
          invitedSeats: state.invitedSeats,
        },
      },
    }),
  },
}));
vi.mock('@/features/members/api/invite-rewards-api', () => ({
  inviteRewardsApi: { getSummary: () => getSummary() },
}));

import { useInviteRewards } from '@/features/members/hooks/use-invite-rewards';

describe('useInviteRewards', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    getSummary.mockReset();
    state.edition = ApEdition.CLOUD;
    state.isPlatformAdmin = true;
    state.usersLimit = 5;
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
    getSummary.mockResolvedValue(summary({ rewards: [granted('a')] }));

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(result.current.claimed).toBe(1);
    expect(result.current.rewardsLeft).toBe(3);
    expect(result.current.bonusCredits).toBe(1000);
  });

  it('caps rewards left by the free seats left', async () => {
    state.activeUsers = 3;
    state.invitedSeats = 1;
    getSummary.mockResolvedValue(summary({ rewards: [] }));

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(result.current.rewardsLeft).toBe(1);
  });

  it('hides the offer once every seat is taken', async () => {
    state.activeUsers = 5;
    getSummary.mockResolvedValue(summary({ rewards: [] }));

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    await waitFor(() => expect(result.current.maxRewards).toBe(4));
    expect(result.current.visible).toBe(false);
  });

  it('knows the platform while the rewards are still loading', () => {
    getSummary.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    expect(result.current.visible).toBe(false);
    expect(result.current.platformId).toBe('platform_1');
  });

  it('hides the offer once all four rewards are earned', async () => {
    getSummary.mockResolvedValue(
      summary({ rewards: ['a', 'b', 'c', 'd'].map(granted) }),
    );

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    await waitFor(() => expect(result.current.bonusCredits).toBe(4000));
    expect(result.current.visible).toBe(false);
  });

  it('keeps the earned bonus after the platform upgrades, but stops offering', async () => {
    getSummary.mockResolvedValue(
      summary({ eligible: false, rewards: [granted('a')] }),
    );

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    await waitFor(() => expect(result.current.bonusCredits).toBe(1000));
    expect(result.current.visible).toBe(false);
  });

  it('never asks the server outside Cloud', async () => {
    state.edition = ApEdition.ENTERPRISE;

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    expect(result.current.visible).toBe(false);
    expect(getSummary).not.toHaveBeenCalled();
  });

  it('never asks the server for a non-admin', async () => {
    state.isPlatformAdmin = false;

    const { result } = renderHook(() => useInviteRewards(), { wrapper });

    expect(result.current.visible).toBe(false);
    expect(getSummary).not.toHaveBeenCalled();
  });

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
});

function summary({
  eligible = true,
  rewards,
}: {
  eligible?: boolean;
  rewards: InviteRewardSummary['rewards'];
}): InviteRewardSummary {
  return { eligible, creditsPerInvite: 1000, maxRewards: 4, rewards };
}

function granted(id: string): InviteRewardSummary['rewards'][number] {
  return {
    id,
    created: '2026-11-05T00:00:00.000Z',
    email: `${id}@example.com`,
    credits: 1000,
  };
}
