import { useQuery } from '@tanstack/react-query';

import { flagsHooks } from '@/hooks/flags-hooks';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { ApFlagId, assertNotNullOrUndefined } from '@activepieces/shared';

import { authenticationSession } from '../../../lib/authentication-session';

import { projectMembersApi } from './project-members-api';

export const projectMembersHooks = {
  useProjectMembers: () => {
    const { data } = flagsHooks.useFlag<boolean>(ApFlagId.SHOW_PROJECT_MEMBERS);
    const query = useQuery<ProjectMemberWithUser[]>({
      queryKey: ['project-members', authenticationSession.getProjectId()],
      queryFn: async () => {
        const projectId = authenticationSession.getProjectId();
        assertNotNullOrUndefined(projectId, 'Project ID is null');
        const res = await projectMembersApi.list({
          projectId: projectId,
          projectRoleId: undefined,
          cursor: undefined,
          limit: 100,
        });
        return res.data;
      },
      staleTime: Infinity,
      enabled: !!data,
    });
    return {
      projectMembers: query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
    };
  },
};
