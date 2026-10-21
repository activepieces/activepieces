import {
  AssignWorkerGroupFlowsRequest,
  AssignWorkerGroupProjectsRequest,
  ListWorkerGroupFlowsRequest,
  ListWorkerGroupProjectsRequest,
  MoveAllWorkerGroupRequest,
  ProjectWithLimits,
  WorkerGroupFlowAssignmentPage,
  WorkerGroupMoveResult,
  WorkerGroupProjectAssignmentPage,
  WorkerGroupsOverview,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const workerGroupsApi = {
  overview() {
    return api.get<WorkerGroupsOverview>('/v1/worker-groups/overview');
  },
  projects(params: ListParams<ListWorkerGroupProjectsRequest>) {
    return api.get<WorkerGroupProjectAssignmentPage>(
      '/v1/worker-groups/assignments/projects',
      params,
    );
  },
  flows(params: ListParams<ListWorkerGroupFlowsRequest>) {
    return api.get<WorkerGroupFlowAssignmentPage>(
      '/v1/worker-groups/assignments/flows',
      params,
    );
  },
  assignProjects(request: AssignWorkerGroupProjectsRequest) {
    return api.post<WorkerGroupMoveResult>(
      '/v1/worker-groups/assignments/projects',
      request,
    );
  },
  assignFlows(request: AssignWorkerGroupFlowsRequest) {
    return api.post<WorkerGroupMoveResult>(
      '/v1/worker-groups/assignments/flows',
      request,
    );
  },
  moveAll(request: MoveAllWorkerGroupRequest) {
    return api.post<WorkerGroupMoveResult>(
      '/v1/worker-groups/assignments/move-all',
      request,
    );
  },
  setRunLimit({
    projectId,
    maxConcurrentJobs,
  }: {
    projectId: string;
    maxConcurrentJobs: number | null;
  }) {
    return api.post<ProjectWithLimits>(`/v1/projects/${projectId}`, {
      maxConcurrentJobs,
    });
  },
};

type ListParams<T> = Omit<T, 'limit' | 'cursor' | 'exclude'> & {
  exclude?: string;
  limit?: number;
  cursor?: string;
};
