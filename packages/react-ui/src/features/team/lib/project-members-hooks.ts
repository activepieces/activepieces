import { QueryClient, useQuery } from '@tanstack/react-query';

import { ProjectMemberWithUser } from '@activepieces/ee-shared';

import { authenticationSession } from '../../../lib/authentication-session';

import { projectMembersApi } from './project-members-api';

const projectMembersQueryKey = 'project-members';
export const projectMembersHooks = {
  useProjectMembers: () => {
    return useQuery<ProjectMemberWithUser[]>({
      queryKey: [projectMembersQueryKey],
      queryFn: () => {
        return projectMembersApi
          .list({
            projectId: authenticationSession.getProjectId(),
            cursor: undefined,
            limit: 100,
          })
          .then((res) => {
            return res.data;
          });
      },
      staleTime: Infinity,
    });
  },
  invalidate: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({
      queryKey: [projectMembersQueryKey],
    });
  },
};
