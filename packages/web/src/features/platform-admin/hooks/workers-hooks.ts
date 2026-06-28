import { WorkerMachineWithStatus } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { workersApi, WorkerPoolCapacity } from '../api/workers-api';

export const workersKeys = {
  all: ['worker-machines'] as const,
  groups: ['worker-groups'] as const,
};

export const workersQueries = {
  useWorkerMachines: () =>
    useQuery<WorkerMachineWithStatus[]>({
      queryKey: workersKeys.all,
      staleTime: 0,
      gcTime: 0,
      refetchInterval: 5000,
      queryFn: () => workersApi.list(),
    }),
  useWorkerGroups: (enabled: boolean) =>
    useQuery<WorkerPoolCapacity>({
      queryKey: workersKeys.groups,
      queryFn: () => workersApi.listWorkerGroups(),
      enabled,
    }),
};
