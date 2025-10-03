import { api } from '@/lib/api';
import { QueueMetricsResponse } from '@activepieces/shared';

export const queueMetricsApi = {
  getMetrics() {
    return api.get<QueueMetricsResponse>('/v1/queue-metrics');
  },
};
