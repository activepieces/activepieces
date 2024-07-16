import {
  ListProjectMembersRequestQuery,
  ProjectMemberWithUser,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

import { api } from '@/lib/api';

export const projectMembersApi = {
  list(request: ListProjectMembersRequestQuery) {
    return api.get<SeekPage<ProjectMemberWithUser>>(
      '/v1/project-members',
      request
    );
  },
};
