import { isNil } from '@activepieces/core-utils';
import { InvitationType, UserInvitation } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { userInvitationApi } from '../api/user-invitation';

const userInvitationsQueryKey = 'user-invitations';

export const userInvitationsHooks = {
  useInvitations: () => {
    const query = useQuery<UserInvitation[]>({
      queryFn: () => {
        return userInvitationApi
          .list({
            type: InvitationType.PROJECT,
            cursor: undefined,
            limit: 100,
          })
          .then((res) => res.data);
      },
      queryKey: [userInvitationsQueryKey],
      staleTime: 0,
    });
    return {
      invitations: query.data,
      isLoading: query.isLoading,
      isError: query.isError,
      refetch: query.refetch,
    };
  },
  useProjectPlatformInvitations: ({
    projectId,
  }: {
    projectId: string | null;
  }) => {
    return useQuery<UserInvitation[]>({
      queryFn: () => {
        return userInvitationApi
          .list({
            type: InvitationType.PLATFORM,
            projectId,
            cursor: undefined,
            limit: 100,
          })
          .then((res) => res.data);
      },
      queryKey: [userInvitationsQueryKey, 'platform', projectId],
      enabled: !isNil(projectId),
      staleTime: 0,
    });
  },
};

export const userInvitationMutations = {
  useAcceptInvitation: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (registered: boolean) => void;
    onError: (error: unknown) => void;
  }) => {
    return useMutation({
      mutationFn: async (token: string) => {
        const { registered } = await userInvitationApi.accept(token);
        return registered;
      },
      onSuccess,
      onError,
    });
  },
};
