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
  listGroupFlows(workerGroupId: string) {
    return api.get<WorkerGroupFlows>('/v1/worker-groups/flows', {
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

export type WorkerGroupFlow = {
  id: string;
  projectId: string;
  displayName: string;
};

export type WorkerGroupFlows = {
  flows: WorkerGroupFlow[];
  total: number;
};
