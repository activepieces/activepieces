import { isNil, Permission, SeekPage } from '@activepieces/core-utils';
import { InvitationType, UserWithMetaInformation } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { platformUserApi } from '@/api/platform-user-api';
import { userInvitationApi } from '@/features/members/api/user-invitation';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';

export const platformUserKeys = {
  users: ['users'] as const,
  allUsers: ['users', 'all'] as const,
  invitations: ['platform-invitations'] as const,
  invitesReservingSeats: ['platform-invitations', 'reserving-seats'] as const,
};

export const platformUserHooks = {
  useUsers: () => {
    const canListUsers = useCanListUsers();
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
  useAllUsers: () => {
    const canListUsers = useCanListUsers();
    return useQuery({
      queryKey: platformUserKeys.allUsers,
      queryFn: () =>
        fetchAllPages({
          fetchPage: (cursor) =>
            platformUserApi.list({ cursor, limit: PAGE_SIZE }),
        }),
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
            limit: 100,
            projectId: null,
          })
          .then((res) => res.data);
      },
      queryKey: platformUserKeys.invitations,
      staleTime: 0,
    });
  },
  useInvitesReservingSeats: () => {
    return useQuery({
      queryFn: () =>
        fetchAllPages({
          fetchPage: (cursor) =>
            userInvitationApi.listReservingSeats({ cursor, limit: PAGE_SIZE }),
        }),
      queryKey: platformUserKeys.invitesReservingSeats,
      staleTime: 0,
    });
  },
};

function useCanListUsers(): boolean {
  const { data: currentUser } = userHooks.useCurrentUser();
  const { checkAccess, isFetchingProjectRole } = useAuthorization();
  const hasInvitePermission = checkAccess(Permission.WRITE_INVITATION);
  return !isNil(currentUser) && hasInvitePermission && !isFetchingProjectRole;
}

async function fetchAllPages<T>({
  fetchPage,
  cursor,
}: FetchAllPagesParams<T>): Promise<T[]> {
  const page = await fetchPage(cursor);
  if (isNil(page.next)) {
    return page.data;
  }
  return [
    ...page.data,
    ...(await fetchAllPages({ fetchPage, cursor: page.next })),
  ];
}

const PAGE_SIZE = 2000;

type FetchAllPagesParams<T> = {
  fetchPage: (cursor: string | undefined) => Promise<SeekPage<T>>;
  cursor?: string;
};
