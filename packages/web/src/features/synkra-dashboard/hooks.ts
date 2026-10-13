import { useQuery } from '@tanstack/react-query';
import { DashboardSummary, synkraDashboardApi } from './api';

export const synkraDashboardHooks = {
  useSummary: () =>
    useQuery<DashboardSummary>({
      queryKey: ['synkra-dashboard-summary'],
      queryFn: () => synkraDashboardApi.getSummary(),
      staleTime: 30_000,
      refetchInterval: 60_000,
    }),
};
