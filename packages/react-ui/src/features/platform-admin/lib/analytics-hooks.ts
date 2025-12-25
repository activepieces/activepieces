import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';

import { analyticsApi } from '@/features/platform-admin/lib/analytics-api';
import {
  AnalyticsReportRequest,
  UpdatePlatformReportRequest,
} from '@activepieces/shared';

import { RefreshAnalyticsContext } from './refresh-analytics-context';

const queryKey = ['analytics'];
const leaderboardQueryKey = ['analytics', 'leaderboard'];

export const platformAnalyticsHooks = {
  useAnalytics: (request?: AnalyticsReportRequest) => {
    const { data, isLoading } = useQuery({
      queryKey: request ? ['analytics', request] : queryKey,
      queryFn: () => analyticsApi.get(request),
    });
    return { data, isLoading };
  },
  useLeaderboard: () => {
    const { data, isLoading } = useQuery({
      queryKey: leaderboardQueryKey,
      queryFn: () => analyticsApi.getLeaderboard(),
    });
    return { data, isLoading };
  },
  useRefreshAnalytics: () => {
    const queryClient = useQueryClient();
    const { setIsRefreshing } = useContext(RefreshAnalyticsContext);
    return useMutation({
      mutationFn: async () => {
        setIsRefreshing(true);
        return analyticsApi.refresh();
      },
      onSuccess: (result) => {
        setIsRefreshing(false);
        queryClient.setQueryData(queryKey, result);
      },
      retry: true,
      retryDelay: 1000,
    });
  },
  useUpdatePlatformReport: ({
    refreshOnSuccess = true,
  }: { refreshOnSuccess?: boolean } = {}) => {
    const { mutate: refreshAnalytics } =
      platformAnalyticsHooks.useRefreshAnalytics();
    return useMutation({
      mutationFn: async (request: UpdatePlatformReportRequest) => {
        await analyticsApi.update(request);
      },
      onSuccess: (result) => {
        if (refreshOnSuccess) {
          refreshAnalytics();
        }
      },
    });
  },
};
