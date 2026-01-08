import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';

import { analyticsApi } from '@/features/platform-admin/lib/analytics-api';
import { UpdatePlatformReportRequest } from '@activepieces/shared';

import { RefreshAnalyticsContext } from './refresh-analytics-context';

const queryKey = ['analytics'];
export const platformAnalyticsHooks = {
  useAnalytics: (timePeriod?: 'weekly' | 'monthly' | '3-months' | 'all-time') => {
    const { data, isLoading } = useQuery({
      queryKey: [...queryKey, timePeriod],
      queryFn: () => analyticsApi.get(timePeriod),
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
};
