import { isNil, Permission, SeekPage } from '@activepieces/core-utils';
import {
  InvitationType,
  PlatformUserListItem,
  PlatformUserListStatus,
  UpdateUserRequestBody,
  User,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { platformUserApi } from '@/api/platform-user-api';
import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import { userInvitationApi } from '@/features/members/api/user-invitation';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';

function useCanListPlatformUsers(): boolean {
  const { data: currentUser } = userHooks.useCurrentUser();
  const { checkAccess, isFetchingProjectRole } = useAuthorization();
  return (
    !isNil(currentUser) &&
    checkAccess(Permission.WRITE_INVITATION) &&
    !isFetchingProjectRole
  );
}

export const platformUserKeys = {
  users: ['users'] as const,
  invitations: ['platform-invitations'] as const,
};

export const platformUserHooks = {
  useUsers: () => {
    const canListUsers = useCanListPlatformUsers();
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
  useUsersWithInvitationsPage: ({
    statuses,
  }: {
    statuses: PlatformUserListStatus[];
  }) => {
    const [searchParams] = useSearchParams();
    const cursor = searchParams.get(CURSOR_QUERY_PARAM) ?? undefined;
    const limit = Number(searchParams.get(LIMIT_QUERY_PARAM)) || 10;
    const canListUsers = useCanListPlatformUsers();
    return useQuery<SeekPage<PlatformUserListItem>, Error>({
      queryKey: [
        ...platformUserKeys.users,
        'with-invitations',
        statuses,
        cursor,
        limit,
      ],
      queryFn: () =>
        platformUserApi.listWithInvitations({
          cursor,
          limit,
          status: statuses.length > 0 ? statuses : undefined,
        }),
      // Keep the current page on screen while the next one loads.
      placeholderData: keepPreviousData,
      enabled: canListUsers,
    });
  },
  usePlatformInvitations: ({ enabled = true }: { enabled?: boolean } = {}) => {
    return useQuery({
      queryFn: () => {
        return userInvitationApi.listAll({
          type: InvitationType.PLATFORM,
          limit: 100,
          projectId: null,
        });
      },
      queryKey: platformUserKeys.invitations,
      staleTime: 0,
      enabled,
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
