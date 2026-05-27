import {
  ListProjectMembersRequestQuery,
  ProjectMemberWithUser,
  UpdateProjectMemberRoleRequestBody,
  SeekPage,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const projectMembersApi = {
  list(request: ListProjectMembersRequestQuery) {
    return api.get<SeekPage<ProjectMemberWithUser>>(
      '/v1/project-members',
      request,
    );
  },
  update(memberId: string, request: UpdateProjectMemberRoleRequestBody) {
    return api.post<void>(`/v1/project-members/${memberId}`, request);
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/project-members/${id}`);
  },
};
