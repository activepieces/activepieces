import { useQuery } from '@tanstack/react-query';

import { healthMetricsApi } from './health-metrics-api';

const LIVE_REFETCH_INTERVAL_MS = 15 * 1000;

export const healthMetricsQueries = {
  useRunMetrics: (
    range: { createdAfter: string; createdBefore: string },
    enabled = true,
  ) => {
    return useQuery({
      queryKey: [
        'platform-metrics-report',
        range.createdAfter,
        range.createdBefore,
      ],
      queryFn: () => healthMetricsApi.getRunMetrics(range),
      enabled,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });
  },
  useQueueMetrics: (enabled = true) => {
    return useQuery({
      queryKey: ['platform-metrics-live'],
      queryFn: () => healthMetricsApi.getQueueMetrics(),
      enabled,
      refetchInterval: LIVE_REFETCH_INTERVAL_MS,
    });
  },
  useHealthHistory: (enabled = true) => {
    return useQuery({
      queryKey: ['platform-metrics-health-history'],
      queryFn: () => healthMetricsApi.getHealthHistory(),
      enabled,
    });
  },
};
