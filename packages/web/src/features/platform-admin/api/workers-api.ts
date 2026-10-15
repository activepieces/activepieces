import {
  WorkerGroupScope,
  WorkerMachineWithStatus,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const workersApi = {
  list() {
    return api.get<WorkerMachineWithStatus[]>('/v1/worker-machines');
  },
  listWorkerGroups() {
    return api.get<WorkerPoolCapacity>('/v1/worker-groups');
  },
  assignProject(projectId: string, workerGroupId: string | null) {
    return api.post<void>(`/v1/worker-groups/projects/${projectId}`, {
      workerGroupId,
    });
  },
  assignFlow(flowId: string, workerGroupId: string | null) {
    return api.post<void>(`/v1/worker-groups/flows/${flowId}`, {
      workerGroupId,
    });
  },
};

export type WorkerGroupInfo = {
  label: string;
  slots: number;
  scope: WorkerGroupScope;
};

export type WorkerPoolCapacity = {
  groups: WorkerGroupInfo[];
  sharedSlots: number;
};
