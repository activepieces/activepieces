import { useQuery } from '@tanstack/react-query';

import { healthApi } from '@/api/health-api';

export const healthKeys = {
  all: ['system-health'] as const,
};

export const healthQueries = {
  useSystemHealth: () =>
    useQuery({
      queryKey: healthKeys.all,
      queryFn: () => healthApi.getSystemHealthChecks(),
    }),
};
