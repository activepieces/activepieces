import { api } from '@/lib/api';
import { ProjectSyncPlan } from '@activepieces/ee-shared';
import {
  SeekPage,
  CreateProjectReleaseRequestBody,
  ProjectRelease,
  ProjectReleaseType,
  ProjectState,
} from '@activepieces/shared';

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
  async download(releaseId: string) {
    return await api.post<ProjectState>(
      `/v1/project-releases/${releaseId}/download`,
    );
  },
  async diff(type: ProjectReleaseType) {
    return await api.post<ProjectSyncPlan>(`/v1/project-releases/diff`, {
      type,
    });
  },
};
