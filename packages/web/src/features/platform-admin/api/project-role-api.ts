import { ProjectRole, SeekPage } from '@activepieces/core-utils';
import {
  ProjectMemberWithUser,
  CreateProjectRoleRequestBody,
  UpdateProjectRoleRequestBody,
  ListProjectMembersForProjectRoleRequestQuery,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const projectRoleApi = {
  async get(id: string) {
    return await api.get<ProjectRole>(
      `/v1/project-roles/${encodeURIComponent(id)}`,
    );
  },
  async list() {
    return await api.get<SeekPage<ProjectRole>>(`/v1/project-roles`);
  },
  async create(requestBody: CreateProjectRoleRequestBody) {
    return await api.post<ProjectRole>('/v1/project-roles', requestBody);
  },
  async update(id: string, requestBody: UpdateProjectRoleRequestBody) {
    return await api.post<ProjectRole>(
      `/v1/project-roles/${encodeURIComponent(id)}`,
      requestBody,
    );
  },
  async delete(name: string) {
    return await api.delete<void>(
      `/v1/project-roles/${encodeURIComponent(name)}`,
    );
  },
  async listProjectMembers(
    id: string,
    requestQuery: ListProjectMembersForProjectRoleRequestQuery,
  ) {
    return await api.get<SeekPage<ProjectMemberWithUser>>(
      `/v1/project-roles/${encodeURIComponent(id)}/project-members`,
      requestQuery,
    );
  },
};
