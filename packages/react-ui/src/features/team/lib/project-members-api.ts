import { api } from '@/lib/api';
import {
  ListProjectMembersRequestQuery,
  ProjectMemberWithUser,
  UpdateProjectMemberRoleRequestBody,
} from '@activepieces/ee-shared';
import { ProjectRole, SeekPage } from '@activepieces/shared';

export const projectMembersApi = {
  list(request: ListProjectMembersRequestQuery) {
    return api.get<SeekPage<ProjectMemberWithUser>>(
      '/v1/project-members',
      request,
    );
  },
  me() {
    return api.get<ProjectRole | null>('/v1/project-members/role');
  },
  update(memberId: string, request: UpdateProjectMemberRoleRequestBody) {
    return api.post<void>(`/v1/project-members/${memberId}`, request);
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/project-members/${id}`);
  },
};
