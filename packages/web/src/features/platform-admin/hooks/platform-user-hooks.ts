import { isNil, Permission, SeekPage } from '@activepieces/core-utils';
import { InvitationType, UserWithMetaInformation } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { platformUserApi } from '@/api/platform-user-api';
import { userInvitationApi } from '@/features/members/api/user-invitation';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';

export const platformUserKeys = {
  users: ['users'] as const,
  invitations: ['platform-invitations'] as const,
};

export const platformUserHooks = {
  useUsers: () => {
    const { data: currentUser } = userHooks.useCurrentUser();
    const { checkAccess, isFetchingProjectRole } = useAuthorization();
    const hasInvitePermission = checkAccess(Permission.WRITE_INVITATION);
    const canListUsers =
      !isNil(currentUser) && hasInvitePermission && !isFetchingProjectRole;
    return useQuery<SeekPage<UserWithMetaInformation>, Error>({
      queryKey: platformUserKeys.users,
      queryFn: async () => {
        const results = await platformUserApi.list({
          limit: 2000,
        });
        return results;
      },
      enabled: canListUsers,
    });
  },
  usePlatformInvitations: () => {
    return useQuery({
      queryFn: () => {
        return userInvitationApi
          .list({
            type: InvitationType.PLATFORM,
            cursor: undefined,
            limit: 2000,
            projectId: null,
          })
          .then((res) => res.data);
      },
      queryKey: platformUserKeys.invitations,
      staleTime: 0,
    });
  },
};
