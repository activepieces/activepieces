import { api } from '@/lib/api';
import {
  CreateProjectRoleRequestBody,
  UpdateProjectRoleRequestBody,
  ProjectRole,
  SeekPage,
} from '@activepieces/shared';

export const projectRoleApi = {
  async list() {
    return await api.get<SeekPage<ProjectRole>>(`/v1/project-roles`);
  },

  async create(requestBody: CreateProjectRoleRequestBody) {
    return await api.post<ProjectRole>('/v1/project-roles', requestBody);
  },

  async update(id: string, requestBody: UpdateProjectRoleRequestBody) {
    return await api.post<ProjectRole>(`/v1/project-roles/${id}`, requestBody);
  },
  async delete(id: string) {
    return await api.delete<void>(`/v1/project-roles/${id}`);
  },
};
