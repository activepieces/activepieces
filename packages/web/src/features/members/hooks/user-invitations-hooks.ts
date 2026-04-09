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
      meta: { showErrorDialog: true },
    });
    return {
      invitations: query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
    };
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
