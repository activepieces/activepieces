import { QueryClient, useQuery } from '@tanstack/react-query';

import { userInvitationApi } from '@/lib/user-invitation';
import { InvitationType, UserInvitation } from '@activepieces/shared';

const userInvitationsQueryKey = 'user-invitations';
export const userInvitationsHooks = {
  useInvitations: () => {
    return useQuery<UserInvitation[]>({
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
      staleTime: Infinity,
    });
  },
  invalidate: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({
      queryKey: [userInvitationsQueryKey],
    });
  },
};
