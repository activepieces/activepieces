import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { toast } from '@/components/ui/use-toast';
import { analyticsApi } from '@/features/platform-admin/lib/analytics-api';

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
    return useMutation({
      mutationFn: async () => {
        const result = await analyticsApi.refresh();
        queryClient.setQueryData(queryKey, result);
      },
      onSuccess: () => {
        toast({
          title: t('Analytics refreshed successfully'),
        });
      },
    });
  },
};
