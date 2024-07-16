import { api } from '@/lib/api';
import {
  ListProjectMembersRequestQuery,
  ProjectMemberWithUser,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

export const projectMembersApi = {
  list(request: ListProjectMembersRequestQuery) {
    return api.get<SeekPage<ProjectMemberWithUser>>(
      '/v1/project-members',
      request,
    );
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/project-members/${id}`);
  },
};
