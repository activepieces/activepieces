// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toastSuccess = vi.hoisted(() => vi.fn());
const rewards = vi.hoisted(() => ({ rewardsEarned: 1 }));

vi.mock('i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('i18next')>()),
  t: (key: string) => key,
}));
vi.mock('sonner', () => ({ toast: { success: toastSuccess } }));
vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture: vi.fn() }),
}));
vi.mock('@/features/members/hooks/use-invite-rewards', () => ({
  useInviteRewards: () => ({
    platformId: 'platform_1',
    maxRewards: 4,
    creditsPerInvite: 1000,
    rewardsEarned: rewards.rewardsEarned,
  }),
}));

import { InviteRewardNotifier } from '@/features/members/components/invite-reward/invite-reward';

describe('InviteRewardNotifier', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    localStorage.clear();
    rewards.rewardsEarned = 1;
  });

  it('stays quiet the first time it sees a platform', () => {
    renderNotifier();

    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('announces a reward earned since the last visit', () => {
    localStorage.setItem('ap-invite-rewards-seen-count:platform_1', '1');
    rewards.rewardsEarned = 2;

    renderNotifier();

    expect(toastSuccess).toHaveBeenCalledTimes(1);
  });

  it('stays quiet when the count went down, so a restarted count never announces rewards that were not paid', () => {
    localStorage.setItem('ap-invite-rewards-seen-count:platform_1', '4');
    rewards.rewardsEarned = 2;

    renderNotifier();

    expect(toastSuccess).not.toHaveBeenCalled();
    expect(
      localStorage.getItem('ap-invite-rewards-seen-count:platform_1'),
    ).toBe('4');
  });
});

function renderNotifier() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <InviteRewardNotifier />
    </QueryClientProvider>,
  );
}
