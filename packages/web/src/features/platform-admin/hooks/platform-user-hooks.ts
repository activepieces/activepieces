import {
  InvitationType,
  SeekPage,
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

export const platformUserKeys = {
  users: ['users'] as const,
  invitations: ['platform-invitations'] as const,
};

export const platformUserHooks = {
  useUsers: () => {
    return useQuery<SeekPage<UserWithMetaInformation>, Error>({
      queryKey: platformUserKeys.users,
      meta: { showErrorDialog: true },
      queryFn: async () => {
        const results = await platformUserApi.list({
          limit: 2000,
        });
        return results;
      },
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
      meta: { showErrorDialog: true },
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
  useUpdateUserStatus: ({ onSuccess }: { onSuccess: () => void }) => {
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
