import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { TriggerStatusReport } from '@activepieces/shared';

export const triggerRunApi = {
  getStatusReport: async (): Promise<TriggerStatusReport> => {
    return api.get<TriggerStatusReport>('/v1/trigger-runs/status');
  },
};

export const triggerRunHooks = {
  useStatusReport: () => {
    return useQuery({
      queryKey: ['trigger-status-report'],
      queryFn: triggerRunApi.getStatusReport,
    });
  },
};
