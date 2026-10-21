/**
 * @vitest-environment jsdom
 */
import { ApEdition, SelfServeTrialStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  selfServeTrialHooks,
  selfServeTrialKey,
} from '@/features/billing/hooks/self-serve-trial-hooks';

let isPlatformAdmin = true;
let isEmbedded = false;
let planTrialEndsAt: string | null = null;
let seatGraceEndsAt: string | null = null;
let usersLimit: number | null = 5;
let status: SelfServeTrialStatus;
const startSelfServeTrial = vi.fn();
const refreshSubscriptionInfo = vi.fn();

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => isPlatformAdmin,
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded } }),
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
          seatGraceEndsAt,
          usersLimit,
        },
        selfServeTrial:
          planTrialEndsAt === null
            ? undefined
            : {
                startedAt: '2026-10-14T09:00:00.000Z',
                endsAt: planTrialEndsAt,
              },
      },
    }),
  },
}));

vi.mock('@/features/billing/api/billing-plans-api', () => ({
  platformBillingApi: {
    getSelfServeTrial: async () => status,
    startSelfServeTrial: () => startSelfServeTrial(),
    refreshSubscriptionInfo: () => refreshSubscriptionInfo(),
  },
}));

const activeStatus = (endsAt: Date): SelfServeTrialStatus => ({
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
  renderHook(() => selfServeTrialHooks.useTrial(), { wrapper });

beforeEach(() => {
  isPlatformAdmin = true;
  isEmbedded = false;
  planTrialEndsAt = null;
  seatGraceEndsAt = null;
  usersLimit = 5;
  status = activeStatus(dayjs().add(3, 'day').toDate());
  refreshSubscriptionInfo.mockReset().mockResolvedValue(undefined);
});

describe('useTrial', () => {
  it('reports a trial whose end has passed as ended', async () => {
    status = activeStatus(dayjs().subtract(1, 'hour').toDate());
    const { result } = readTrial();
    await waitFor(() => expect(result.current.state).toBe('ended'));
  });
});

const readSeatGrace = (wrapper = queryWrapper()) =>
  renderHook(() => selfServeTrialHooks.useSeatGrace(), { wrapper });

describe('useSeatGrace', () => {
  it('is absent while the platform has no grace', () => {
    const { result } = readSeatGrace();
    expect(result.current).toBeNull();
  });

  it('counts the days left and carries the seats and the viewer', () => {
    seatGraceEndsAt = dayjs().add(3, 'day').toISOString();
    const { result } = readSeatGrace();
    expect(result.current).toMatchObject({
      daysLeft: 3,
      endsToday: false,
      ending: false,
      seats: 5,
      isPlatformAdmin: true,
    });
    expect(result.current?.endsAt.toISOString()).toBe(seatGraceEndsAt);
  });

  it('flags the last day', () => {
    seatGraceEndsAt = dayjs().endOf('day').toISOString();
    isPlatformAdmin = false;
    const { result } = readSeatGrace();
    expect(result.current).toMatchObject({
      daysLeft: 0,
      endsToday: true,
      isPlatformAdmin: false,
    });
  });

  it('is absent for embedded users', () => {
    seatGraceEndsAt = dayjs().add(3, 'day').toISOString();
    isEmbedded = true;
    const { result } = readSeatGrace();
    expect(result.current).toBeNull();
  });

  it('is absent when the plan has no seat limit to name', () => {
    seatGraceEndsAt = dayjs().add(3, 'day').toISOString();
    usersLimit = null;
    const { result } = readSeatGrace();
    expect(result.current).toBeNull();
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

  it('refetches the platform when the seat grace ends', async () => {
    vi.useFakeTimers();
    seatGraceEndsAt = new Date(Date.now() + 60 * 1000).toISOString();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const view = readSeatGrace(queryWrapper(client));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    });

    const platformRefetches = invalidate.mock.calls.filter(
      ([filters]) =>
        JSON.stringify(filters?.queryKey) === JSON.stringify(['platform']),
    );
    expect(platformRefetches).toHaveLength(1);
    view.unmount();
  });
});

describe('starting the trial fails', () => {
  it('re-reads the real trial state', async () => {
    startSelfServeTrial.mockRejectedValueOnce(new Error('network lost'));
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => selfServeTrialHooks.useStart(), {
      wrapper: queryWrapper(client),
    });

    await act(async () => {
      result.current.mutate();
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    const keys = invalidate.mock.calls.map(([filters]) =>
      JSON.stringify(filters?.queryKey),
    );
    expect(keys).toContain(JSON.stringify(selfServeTrialKey('platform-1')));
    expect(keys).toContain(JSON.stringify(['platform']));
  });
});

describe('plan refresh after the trial', () => {
  const endedStatus = (): SelfServeTrialStatus => ({
    state: 'ended',
    startedAt: null,
    endsAt: dayjs().subtract(1, 'hour').toISOString(),
    extended: false,
  });

  it('runs once when the trial ended but the plan still carries its dates', async () => {
    status = endedStatus();
    planTrialEndsAt = dayjs().subtract(1, 'hour').toISOString();

    renderHook(() => selfServeTrialHooks.useRefreshPlanAfterTrialEnd(), {
      wrapper: queryWrapper(),
    });

    await waitFor(() =>
      expect(refreshSubscriptionInfo).toHaveBeenCalledTimes(1),
    );
  });

  it('stays quiet once the plan no longer carries the trial', async () => {
    status = endedStatus();

    const { result } = renderHook(
      () => {
        selfServeTrialHooks.useRefreshPlanAfterTrialEnd();
        return selfServeTrialHooks.useStatus();
      },
      { wrapper: queryWrapper() },
    );

    await waitFor(() => expect(result.current.data?.state).toBe('ended'));
    expect(refreshSubscriptionInfo).not.toHaveBeenCalled();
  });
});
