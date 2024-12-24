import { api } from '@/lib/api';
import {
  SeekPage,
  CreateProjectReleaseRequestBody,
  ProjectRelease,
  DiffReleaseRequest,
} from '@activepieces/shared';
import { ProjectSyncPlan } from '@activepieces/ee-shared';

export const projectReleaseApi = {
  async list() {
    return await api.get<SeekPage<ProjectRelease>>(`/v1/project-releases`);
  },
  async create(requestBody: CreateProjectReleaseRequestBody) {
    return await api.post<ProjectRelease>('/v1/project-releases', requestBody);
  },
  async delete(id: string) {
    return await api.delete<void>(`/v1/project-releases/${id}`);
  },
  async export(releaseId: string) {
    return await api.post<unknown>(`/v1/project-releases/${releaseId}/export`);
  },
  async diff(request: DiffReleaseRequest) {
    return await api.post<ProjectSyncPlan>(`/v1/project-releases/diff`, request);
  },
};
