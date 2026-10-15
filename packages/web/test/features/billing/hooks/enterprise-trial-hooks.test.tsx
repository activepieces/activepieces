/**
 * @vitest-environment jsdom
 */
import { ApEdition, EnterpriseTrialStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let isPlatformAdmin = true;
let isEmbedded = false;
let planTrialEndsAt: string | null = null;
let status: EnterpriseTrialStatus;
const getEnterpriseTrial = vi.fn(async () => status);
const startEnterpriseTrial = vi.fn();
const internalErrorToast = vi.fn();

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
          enterpriseTrialStartedAt: null,
          enterpriseTrialEndsAt: planTrialEndsAt,
        },
      },
    }),
  },
}));

vi.mock('@/features/billing/api/billing-plans-api', () => ({
  platformBillingApi: {
    getEnterpriseTrial: () => getEnterpriseTrial(),
    startEnterpriseTrial: () => startEnterpriseTrial(),
  },
}));

vi.mock('@/components/ui/sonner', () => ({
  internalErrorToast: () => internalErrorToast(),
}));

import { queryClient as appQueryClient } from '@/app/query-client';
import {
  enterpriseTrialHooks,
  enterpriseTrialKey,
} from '@/features/billing/hooks/enterprise-trial-hooks';

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const activeStatus = (endsAt: Date): EnterpriseTrialStatus => ({
  state: 'active',
  startedAt: dayjs(endsAt).subtract(7, 'day').toISOString(),
  endsAt: endsAt.toISOString(),
  extended: false,
});

beforeEach(() => {
  isPlatformAdmin = true;
  isEmbedded = false;
  planTrialEndsAt = null;
  getEnterpriseTrial.mockClear();
  status = activeStatus(dayjs().add(3, 'day').toDate());
});

describe('useTrial', () => {
  it('reads the live trial from the status endpoint for admins', async () => {
    const { result } = renderHook(() => enterpriseTrialHooks.useTrial(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.state).toBe('active'));
    expect(result.current.isPlatformAdmin).toBe(true);
    expect(result.current.daysLeft).toBe(3);
  });

  it('never asks the status endpoint for members and reads the plan instead', async () => {
    isPlatformAdmin = false;
    planTrialEndsAt = dayjs().add(2, 'day').toISOString();
    const { result } = renderHook(() => enterpriseTrialHooks.useTrial(), {
      wrapper,
    });
    expect(result.current.state).toBe('active');
    expect(result.current.isPlatformAdmin).toBe(false);
    expect(getEnterpriseTrial).not.toHaveBeenCalled();
  });

  it('reports a trial whose end has passed as ended', async () => {
    status = activeStatus(dayjs().subtract(1, 'hour').toDate());
    const { result } = renderHook(() => enterpriseTrialHooks.useTrial(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.state).toBe('ended'));
  });

  it('shows no trial inside an embedded app', async () => {
    isEmbedded = true;
    const { result } = renderHook(() => enterpriseTrialHooks.useTrial(), {
      wrapper,
    });
    expect(result.current.state).toBe('none');
    expect(getEnterpriseTrial).not.toHaveBeenCalled();
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
    const shared = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const readers = Array.from({ length: 25 }, () =>
      renderHook(() => enterpriseTrialHooks.useTrial(), { wrapper: shared }),
    );
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
  it('reports the failure only in the dialog and re-reads the real trial state', async () => {
    startEnterpriseTrial.mockRejectedValueOnce(new Error('network lost'));
    internalErrorToast.mockClear();
    const invalidate = vi.spyOn(appQueryClient, 'invalidateQueries');
    const app = ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={appQueryClient}>
        {children}
      </QueryClientProvider>
    );
    const { result } = renderHook(() => enterpriseTrialHooks.useStart(), {
      wrapper: app,
    });

    await act(async () => {
      result.current.mutate();
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(internalErrorToast).not.toHaveBeenCalled();
    const keys = invalidate.mock.calls.map(([filters]) =>
      JSON.stringify(filters?.queryKey),
    );
    expect(keys).toContain(JSON.stringify(enterpriseTrialKey('platform-1')));
    expect(keys).toContain(JSON.stringify(['platform']));
    invalidate.mockRestore();
  });
});
