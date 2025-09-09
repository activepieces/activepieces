import { api } from '@/lib/api';
import {
  ProjectSyncPlan,
  SeekPage,
  CreateProjectReleaseRequestBody,
  ProjectRelease,
  DiffReleaseRequest,
} from '@activepieces/shared';

export const projectReleaseApi = {
  async get(releaseId: string) {
    return await api.get<ProjectRelease>(`/v1/project-releases/${releaseId}`);
  },
  async list() {
    return await api.get<SeekPage<ProjectRelease>>(`/v1/project-releases`);
  },
  async create(requestBody: CreateProjectReleaseRequestBody) {
    return await api.post<ProjectRelease>('/v1/project-releases', requestBody);
  },
  async delete(id: string) {
    return await api.delete<void>(`/v1/project-releases/${id}`);
  },
  async diff(request: DiffReleaseRequest) {
    const result = await api.post<ProjectSyncPlan>(
      `/v1/project-releases/diff`,
      request,
    );
    console.log('result', result);
    return result;
  },
};
