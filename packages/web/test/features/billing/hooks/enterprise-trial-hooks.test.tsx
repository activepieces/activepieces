/**
 * @vitest-environment jsdom
 */
import { ApEdition, EnterpriseTrialStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  enterpriseTrialHooks,
  enterpriseTrialKey,
} from '@/features/billing/hooks/enterprise-trial-hooks';

let isPlatformAdmin = true;
let planTrialEndsAt: string | null = null;
let status: EnterpriseTrialStatus;
const startEnterpriseTrial = vi.fn();

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => isPlatformAdmin,
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: false } }),
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: ApEdition.CLOUD }) },
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: {
          plan: 'free',
          enterpriseTrialStartedAt: null,
          enterpriseTrialEndsAt: planTrialEndsAt,
        },
      },
    }),
  },
}));

vi.mock('@/features/billing/api/billing-plans-api', () => ({
  platformBillingApi: {
    getEnterpriseTrial: async () => status,
    startEnterpriseTrial: () => startEnterpriseTrial(),
  },
}));

const activeStatus = (endsAt: Date): EnterpriseTrialStatus => ({
  state: 'active',
  startedAt: dayjs(endsAt).subtract(7, 'day').toISOString(),
  endsAt: endsAt.toISOString(),
  extended: false,
});

function queryWrapper(
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) {
  return function QueryWrapper({ children }: React.PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

const readTrial = (wrapper = queryWrapper()) =>
  renderHook(() => enterpriseTrialHooks.useTrial(), { wrapper });

beforeEach(() => {
  isPlatformAdmin = true;
  planTrialEndsAt = null;
  status = activeStatus(dayjs().add(3, 'day').toDate());
});

describe('useTrial', () => {
  it('reports a trial whose end has passed as ended', async () => {
    status = activeStatus(dayjs().subtract(1, 'hour').toDate());
    const { result } = readTrial();
    await waitFor(() => expect(result.current.state).toBe('ended'));
  });
});

describe('trial clock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('refetches the platform once at the trial end however many components read the trial', async () => {
    vi.useFakeTimers();
    isPlatformAdmin = false;
    planTrialEndsAt = new Date(Date.now() + 60 * 1000).toISOString();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const shared = queryWrapper(client);
    const readers = Array.from({ length: 25 }, () => readTrial(shared));
    expect(
      readers.every((reader) => reader.result.current.state === 'active'),
    ).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    });

    const platformRefetches = invalidate.mock.calls.filter(
      ([filters]) =>
        JSON.stringify(filters?.queryKey) === JSON.stringify(['platform']),
    );
    expect(platformRefetches).toHaveLength(1);
    expect(
      readers.every((reader) => reader.result.current.state !== 'active'),
    ).toBe(true);
    readers.forEach((reader) => reader.unmount());
  });
});

describe('starting the trial fails', () => {
  it('re-reads the real trial state', async () => {
    startEnterpriseTrial.mockRejectedValueOnce(new Error('network lost'));
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => enterpriseTrialHooks.useStart(), {
      wrapper: queryWrapper(client),
    });

    await act(async () => {
      result.current.mutate();
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    const keys = invalidate.mock.calls.map(([filters]) =>
      JSON.stringify(filters?.queryKey),
    );
    expect(keys).toContain(JSON.stringify(enterpriseTrialKey('platform-1')));
    expect(keys).toContain(JSON.stringify(['platform']));
  });
});
