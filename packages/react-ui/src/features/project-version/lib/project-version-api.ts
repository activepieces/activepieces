import { api } from '@/lib/api';
import {
  SeekPage,
  CreateProjectVersionRequestBody,
  ProjectVersion,
} from '@activepieces/shared';

export const projectVersionApi = {
  async list() {
    return await api.get<SeekPage<ProjectVersion>>(`/v1/project-versions`);
  },
  async create(requestBody: CreateProjectVersionRequestBody) {
    return await api.post<ProjectVersion>('/v1/project-versions', requestBody);
  },
  async delete(id: string) {
    return await api.delete<void>(`/v1/project-versions/${id}`);
  },
};
