// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';

const toastSuccess = vi.hoisted(() => vi.fn());

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
    rewards: [
      reward({ id: 'recent', daysAgo: 1 }),
      reward({ id: 'old', daysAgo: 30 }),
    ],
  }),
}));

import { InviteRewardNotifier } from '@/features/members/components/invite-reward/invite-reward';

describe('InviteRewardNotifier', () => {
  it('announces only rewards granted in the last week', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <InviteRewardNotifier />
      </QueryClientProvider>,
    );

    expect(toastSuccess).toHaveBeenCalledTimes(1);
  });
});

function reward({ id, daysAgo }: { id: string; daysAgo: number }) {
  return {
    id,
    email: `${id}@example.com`,
    credits: 1000,
    created: dayjs().subtract(daysAgo, 'day').toISOString(),
  };
}
