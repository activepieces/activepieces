import { WorkerMachineWithStatus } from '@activepieces/shared';

import { api } from '@/lib/api';

export const workersApi = {
  list() {
    return api.get<WorkerMachineWithStatus[]>('/v1/worker-machines');
  },
  listWorkerTags() {
    return api.get<string[]>('/v1/projects/worker-tags');
  },
};
