/**
 * @vitest-environment jsdom
 */
import {
  AiCreditsAutoTopUpState,
  ConsumableFeatureId,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { billingApiMock, toastMock } = vi.hoisted(() => ({
  billingApiMock: {
    cancel: vi.fn(),
    reactivate: vi.fn(),
    updateAutoTopUp: vi.fn(),
  },
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({ toast: toastMock }));
vi.mock('@/lib/api', () => ({
  api: {
    isError: () => false,
    isApError: () => false,
    serverErrorMessage: () => undefined,
    extractServerErrorMessage: (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
  },
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: { useCurrentPlatform: () => ({ platform: { id: 'pl1' } }) },
}));
vi.mock('@/features/billing/api/billing-plans-api', () => ({
  platformBillingApi: billingApiMock,
}));

import {
  billingMutations,
  PLATFORM_BILLING_SUBSCRIPTION_KEY,
} from '@/features/billing/hooks/billing-hooks';

const SUBSCRIPTION_KEY = [...PLATFORM_BILLING_SUBSCRIPTION_KEY, 'pl1'];

const savedConfig = {
  featureId: ConsumableFeatureId.AP_CREDITS,
  enabled: true,
  threshold: 3000,
  quantity: 7000,
  maxMonthlyTopUps: 3,
};

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  queryClient.setQueryData(SUBSCRIPTION_KEY, {
    creditsFeature: { autoTopUp: savedConfig },
  });
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

function cachedAutoTopUp(queryClient: QueryClient) {
  return queryClient.getQueryData<{
    creditsFeature: { autoTopUp: typeof savedConfig };
  }>(SUBSCRIPTION_KEY)?.creditsFeature.autoTopUp;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCancelSubscription', () => {
  it('shows one success toast whose Keep plan action reactivates', async () => {
    billingApiMock.cancel.mockResolvedValue(undefined);
    billingApiMock.reactivate.mockResolvedValue(undefined);
    const { wrapper } = setup();
    const { result } = renderHook(
      () => billingMutations.useCancelSubscription(),
      { wrapper },
    );

    await act(() => result.current.mutateAsync({ reasons: [] }));

    expect(toastMock.success).toHaveBeenCalledTimes(1);
    const [, options] = toastMock.success.mock.calls[0];
    expect(options.action.label).toBe('Keep plan');

    act(() => options.action.onClick());

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenLastCalledWith(
        "You'll stay on your current plan",
      ),
    );
    expect(billingApiMock.reactivate).toHaveBeenCalledTimes(1);
  });

  it('shows a single error toast when canceling fails', async () => {
    billingApiMock.cancel.mockRejectedValue(new Error('Stripe is down'));
    const { wrapper } = setup();
    const { result } = renderHook(
      () => billingMutations.useCancelSubscription(),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({ reasons: [] }).catch(() => undefined);
    });

    expect(toastMock.error).toHaveBeenCalledTimes(1);
    expect(toastMock.error.mock.calls[0][1].description).toBe('Stripe is down');
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});

describe('useUpdateAutoTopUp', () => {
  it('turns auto recharge off at once and undo restores the saved config', async () => {
    billingApiMock.updateAutoTopUp.mockResolvedValue({});
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => billingMutations.useUpdateAutoTopUp(), {
      wrapper,
    });

    await act(() =>
      result.current.mutateAsync({
        params: {
          state: AiCreditsAutoTopUpState.DISABLED,
          featureId: ConsumableFeatureId.AP_CREDITS,
        },
        previous: savedConfig,
      }),
    );

    expect(cachedAutoTopUp(queryClient)?.enabled).toBe(false);
    expect(toastMock.success).toHaveBeenCalledTimes(1);
    const [message, options] = toastMock.success.mock.calls[0];
    expect(message).toBe('Auto recharge turned off');

    act(() => options.action.onClick());

    await waitFor(() =>
      expect(billingApiMock.updateAutoTopUp).toHaveBeenLastCalledWith({
        featureId: ConsumableFeatureId.AP_CREDITS,
        state: AiCreditsAutoTopUpState.ENABLED,
        minThreshold: 3000,
        creditsToAdd: 7000,
        maxMonthlyTopUps: 3,
      }),
    );
  });

  it('rolls back and shows one error when saving fails', async () => {
    billingApiMock.updateAutoTopUp.mockRejectedValue(new Error('No card'));
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => billingMutations.useUpdateAutoTopUp(), {
      wrapper,
    });

    await act(async () => {
      await result.current
        .mutateAsync({
          params: {
            state: AiCreditsAutoTopUpState.DISABLED,
            featureId: ConsumableFeatureId.AP_CREDITS,
          },
          previous: savedConfig,
        })
        .catch(() => undefined);
    });

    expect(cachedAutoTopUp(queryClient)).toEqual(savedConfig);
    expect(toastMock.error).toHaveBeenCalledTimes(1);
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});
