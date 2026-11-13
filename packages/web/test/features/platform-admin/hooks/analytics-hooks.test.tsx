// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode, useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { analyticsEnabled: true } },
    }),
  },
}));

const refresh = vi.fn();
vi.mock('@/features/platform-admin/api/analytics-api', () => ({
  analyticsApi: { refresh: () => refresh() },
}));

import { platformAnalyticsHooks } from '@/features/platform-admin/hooks/analytics-hooks';
import {
  RefreshAnalyticsContext,
  RefreshAnalyticsProvider,
} from '@/features/platform-admin/stores/refresh-analytics-context';

describe('platformAnalyticsHooks.useRefreshAnalytics', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    refresh.mockReset();
    refresh.mockResolvedValue({});
    queryClient = new QueryClient();
  });

  afterEach(() => {
    vi.useRealTimers();
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <RefreshAnalyticsProvider>{children}</RefreshAnalyticsProvider>
    </QueryClientProvider>
  );

  const renderRefresh = () =>
    renderHook(
      () => ({
        refreshAnalytics: platformAnalyticsHooks.useRefreshAnalytics(),
        ...useContext(RefreshAnalyticsContext),
      }),
      { wrapper },
    );

  it('drops local time saved overrides once a refreshed report arrives', async () => {
    const { result } = renderRefresh();

    act(() => result.current.setTimeSavedPerRunOverride('flow_1', null));
    expect(result.current.timeSavedPerRunOverrides.flow_1?.value).toBeNull();

    act(() => result.current.refreshAnalytics.mutate());
    await act(() => vi.advanceTimersByTimeAsync(5000));

    await waitFor(() =>
      expect(result.current.timeSavedPerRunOverrides).toEqual({}),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('keeps an estimate saved while the refresh request is in flight', async () => {
    let finishRefresh: (report: unknown) => void = () => undefined;
    refresh.mockReturnValue(
      new Promise((resolve) => {
        finishRefresh = resolve;
      }),
    );
    const { result } = renderRefresh();

    act(() => result.current.setTimeSavedPerRunOverride('flow_1', null));
    act(() => result.current.refreshAnalytics.mutate());
    await act(() => vi.advanceTimersByTimeAsync(5000));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));

    await act(() => vi.advanceTimersByTimeAsync(10));
    act(() => result.current.setTimeSavedPerRunOverride('flow_2', 600));
    await act(async () => finishRefresh({}));

    await waitFor(() => expect(result.current.isRefreshing).toBe(false));
    await waitFor(() =>
      expect(Object.keys(result.current.timeSavedPerRunOverrides)).toEqual([
        'flow_2',
      ]),
    );
    expect(result.current.timeSavedPerRunOverrides.flow_2?.value).toBe(600);
  });
});
