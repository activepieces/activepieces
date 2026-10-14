/**
 * @vitest-environment jsdom
 */
import { ApEdition, EnterpriseTrialStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let isPlatformAdmin = true;
let isEmbedded = false;
let planTrialEndsAt: string | null = null;
let status: EnterpriseTrialStatus;
const getEnterpriseTrial = vi.fn(async () => status);

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
    startEnterpriseTrial: vi.fn(),
  },
}));

import { enterpriseTrialHooks } from '@/features/billing/hooks/enterprise-trial-hooks';

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
