import { InvitationType, UserInvitation } from '@activepieces/shared';
import { QueryClient, useQuery } from '@tanstack/react-query';

import { userInvitiationApi } from '../lib/user-invitiation-api';

const userInvitationsQueryKey = 'user-invitations';
export const userInvitationsHooks = {
  useInvitations: () => {
    return useQuery<UserInvitation[]>({
      queryFn: () => {
        return userInvitiationApi
          .list({
            type: InvitationType.PROJECT,
            cursor: undefined,
            limit: 100,
          })
          .then((res) => res.data);
      },
      queryKey: [userInvitationsQueryKey],
    });
  },
  invalidate: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({
      queryKey: [userInvitationsQueryKey],
    });
  },
};
