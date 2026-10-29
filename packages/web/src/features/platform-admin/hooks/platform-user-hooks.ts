import { isNil, Permission, SeekPage } from '@activepieces/core-utils';
import {
  InvitationType,
  UpdateUserRequestBody,
  User,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

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
  useAllUsers: ({ excludeEmbedded = false }: UseAllUsersParams = {}) => {
    const canListUsers = useCanListUsers();
    return useQuery({
      queryKey: [...platformUserKeys.allUsers, { excludeEmbedded }],
      queryFn: () =>
        fetchAllPages({
          fetchPage: (cursor) =>
            platformUserApi.list({
              cursor,
              limit: PAGE_SIZE,
              ...(excludeEmbedded ? { excludeEmbedded } : {}),
            }),
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

export const platformUserMutations = {
  useDeleteUser: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationKey: ['delete-user'],
      mutationFn: async (userId: string) => {
        await platformUserApi.delete(userId);
      },
      onSuccess: () => {
        onSuccess();
        toast.success(t('User deleted successfully'), { duration: 3000 });
      },
    });
  },
  useDeleteInvitation: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationKey: ['delete-invitation'],
      mutationFn: async (invitationId: string) => {
        await userInvitationApi.delete(invitationId);
      },
      onSuccess: () => {
        onSuccess();
        toast.success(t('Invitation deleted successfully'), { duration: 3000 });
      },
    });
  },
  useUpdateUserStatus: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError?: (error: Error) => void;
  }) => {
    return useMutation({
      mutationFn: async (data: { userId: string; status: UserStatus }) => {
        await platformUserApi.update(data.userId, { status: data.status });
        return data;
      },
      onSuccess: (data) => {
        onSuccess();
        toast.success(
          data.status === UserStatus.ACTIVE
            ? t('User activated successfully')
            : t('User deactivated successfully'),
          { duration: 3000 },
        );
      },
      onError,
    });
  },
  useUpdateUser: ({
    userId,
    onSuccess,
  }: {
    userId: string;
    onSuccess: (user: User) => void;
  }) => {
    return useMutation<User, Error, UpdateUserRequestBody>({
      mutationKey: ['update-user'],
      mutationFn: (request) => platformUserApi.update(userId, request),
      onSuccess,
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

type UseAllUsersParams = {
  excludeEmbedded?: boolean;
};
