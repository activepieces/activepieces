import { api } from '@/lib/api';
import {
  ListPlatformProjectMembersRequestQuery,
  ProjectMemberWithUser,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

export const platformProjectMembersApi = {
  list(request: ListPlatformProjectMembersRequestQuery) {
    return api.get<SeekPage<ProjectMemberWithUser>>(
      '/v1/platform-project-members/users',
      request,
    );
  },
};
