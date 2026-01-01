import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';

import { analyticsApi } from '@/features/platform-admin/lib/analytics-api';
import { UpdatePlatformReportRequest } from '@activepieces/shared';

import { RefreshAnalyticsContext } from './refresh-analytics-context';

const queryKey = ['analytics'];
export const platformAnalyticsHooks = {
  useAnalytics: () => {
    const { data, isLoading } = useQuery({
      queryKey,
      queryFn: () => analyticsApi.get(),
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
