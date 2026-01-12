import { api } from '@/lib/api';
import { WorkerMachineWithStatus } from '@activepieces/shared';

export const workersApi = {
  list: () => api.get<WorkerMachineWithStatus[]>('/v1/workers'),
};
