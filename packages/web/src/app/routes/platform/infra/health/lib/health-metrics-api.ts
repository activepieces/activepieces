import {
  PlatformMetricsHealthHistory,
  PlatformMetricsLive,
  PlatformMetricsReport,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const healthMetricsApi = {
  getRunMetrics(range: {
    createdAfter: string;
    createdBefore: string;
  }): Promise<PlatformMetricsReport> {
    return api.get<PlatformMetricsReport>('/v1/health/run-metrics', range);
  },
  getQueueMetrics(): Promise<PlatformMetricsLive> {
    return api.get<PlatformMetricsLive>('/v1/health/queue-metrics');
  },
  getHealthHistory(): Promise<PlatformMetricsHealthHistory> {
    return api.get<PlatformMetricsHealthHistory>('/v1/health/history');
  },
};
