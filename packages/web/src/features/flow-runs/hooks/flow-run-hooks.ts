import { useQuery } from '@tanstack/react-query';

import { flowRunsApi } from '../api/flow-runs-api';

export const flowRunKeys = {
  detail: (runId: string) => ['flow-run', runId] as const,
};

export const flowRunQueries = {
  useFlowRun: (runId: string) =>
    useQuery({
      queryKey: flowRunKeys.detail(runId),
      queryFn: () => flowRunsApi.getPopulated(runId),
      refetchInterval: 15000,
    }),
};
