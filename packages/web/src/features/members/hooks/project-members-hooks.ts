import {
  ProjectMemberWithUser,
  ApFlagId,
  assertNotNullOrUndefined,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { projectMembersApi } from '../api/project-members-api';

export const projectMembersHooks = {
  useProjectMembers: () => {
    const { data } = flagsHooks.useFlag<boolean>(ApFlagId.SHOW_PROJECT_MEMBERS);
    const { platform } = platformHooks.useCurrentPlatform();
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
      enabled: !!data && platform.plan.projectRolesEnabled,
    });
    return {
      projectMembers: query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
    };
  },
};

export const projectMembersMutations = {
  useUpdateMemberRole: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError: () => void;
  }) => {
    return useMutation({
      mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
        projectMembersApi.update(memberId, { role }),
      onSuccess,
      onError,
    });
  },
};
