import { useQuery } from '@tanstack/react-query';

import { ProjectMemberWithUser } from '@activepieces/ee-shared';

import { authenticationSession } from '../../../lib/authentication-session';

import { projectMembersApi } from './project-members-api';

export const projectMembersHooks = {
  useProjectMembers: () => {
    const query = useQuery<ProjectMemberWithUser[]>({
      queryKey: ['project-members'],
      queryFn: async () => {
        const projectId = authenticationSession.getProjectId();
        if (projectId === null) {
          throw new Error('Project ID is null');
        }
        const res = await projectMembersApi.list({
          projectId: projectId,
          cursor: undefined,
          limit: 100,
        });
        return res.data;
      },
      staleTime: Infinity,
    });
    return {
      projectMembers: query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
    };
  },
};
