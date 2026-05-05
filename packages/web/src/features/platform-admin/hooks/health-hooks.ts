import { useQuery } from '@tanstack/react-query';

import { healthApi } from '@/api/health-api';

export const healthKeys = {
  all: ['system-health'] as const,
  securityAdvisories: ['security-advisories'] as const,
};

export const healthQueries = {
  useSystemHealth: () =>
    useQuery({
      queryKey: healthKeys.all,
      queryFn: () => healthApi.getSystemHealthChecks(),
    }),
  useSecurityAdvisories: ({
    showErrorDialog = false,
  }: { showErrorDialog?: boolean } = {}) =>
    useQuery({
      queryKey: healthKeys.securityAdvisories,
      queryFn: () => healthApi.getSecurityAdvisories(),
      staleTime: 5 * 60 * 1000,
      meta: { showErrorDialog, loadSubsetOptions: {} },
    }),
};
