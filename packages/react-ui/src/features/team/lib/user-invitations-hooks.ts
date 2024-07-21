import { useQuery } from '@tanstack/react-query';

import { InvitationType, UserInvitation } from '@activepieces/shared';

import { userInvitationApi } from './user-invitation';

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
      staleTime: 0,
    });
  },
};
