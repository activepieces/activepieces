import { api } from '@/lib/api';
import {
  SeekPage,
  CreateProjectReleaseRequestBody,
  ProjectRelease,
} from '@activepieces/shared';

export const projectReleaseApi = {
  async list() {
    return await api.get<SeekPage<ProjectRelease>>(`/v1/project-releases`);
  },
  async create(requestBody: CreateProjectReleaseRequestBody) {
    console.log('requestBody', requestBody);
    return await api.post<ProjectRelease>('/v1/project-releases', requestBody);
  },
  async delete(id: string) {
    return await api.delete<void>(`/v1/project-releases/${id}`);
  },
  async download(releaseId: string) {
    return await api.post<Buffer>(`/v1/project-releases/${releaseId}/download`);
  },
  async rollback(releaseId: string) {
    return await api.post<void>(`/v1/project-releases/${releaseId}/apply`);
  },
};
