import { api } from '@/lib/api';
import { WorkerJobStatItem } from '@activepieces/shared';

export const queueMetricsApi = {
  getMetrics() {
    return api.get<WorkerJobStatItem[]>('/v1/queue-metrics');
  },
};
