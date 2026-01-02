import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';

import { analyticsApi, TimePeriod } from '@/features/platform-admin/lib/analytics-api';
import { UpdatePlatformReportRequest } from '@activepieces/shared';

import { RefreshAnalyticsContext } from './refresh-analytics-context';

const queryKey = (timePeriod: TimePeriod) => ['analytics', timePeriod];
export const platformAnalyticsHooks = {
  useAnalytics: (timePeriod: TimePeriod = 'monthly') => {
    const { data, isLoading } = useQuery({
      queryKey: queryKey(timePeriod),
      queryFn: () => analyticsApi.get(timePeriod),
    });
    return { data, isLoading };
  },
  useRefreshAnalytics: (timePeriod: TimePeriod = 'monthly') => {
    const queryClient = useQueryClient();
    const { setIsRefreshing } = useContext(RefreshAnalyticsContext);
    return useMutation({
      mutationFn: async () => {
        setIsRefreshing(true);
        return analyticsApi.refresh(timePeriod);
      },
      onSuccess: (result) => {
        setIsRefreshing(false);
        queryClient.setQueryData(queryKey(timePeriod), result);
      },
      retry: true,
      retryDelay: 1000,
    });
  },
  useUpdatePlatformReport: ({
    refreshOnSuccess = true,
    timePeriod = 'monthly',
  }: { refreshOnSuccess?: boolean; timePeriod?: TimePeriod } = {}) => {
    const { mutate: refreshAnalytics } =
      platformAnalyticsHooks.useRefreshAnalytics(timePeriod);
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
