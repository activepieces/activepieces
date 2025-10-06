import { api } from '@/lib/api';
import { QueueMetricsResponse } from '@activepieces/shared';

export const queueMetricsApi = {
  getMetrics() {
    return api.get<QueueMetricsResponse>('/v1/queue-metrics');
  },
  resetMetrics() {
    return api.post<{ message: string }>('/v1/queue-metrics/reset');
  },
};
