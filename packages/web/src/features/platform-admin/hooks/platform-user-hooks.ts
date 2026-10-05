import { isNil, Permission, SeekPage } from '@activepieces/core-utils';
import {
  InvitationType,
  UpdateUserRequestBody,
  User,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
  UseMutationResult,
} from '@tanstack/react-query';
import { t } from 'i18next';

import { platformUserApi } from '@/api/platform-user-api';
import { userInvitationApi } from '@/features/members/api/user-invitation';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { mutationFeedback } from '@/lib/mutation-feedback';

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
        const data = await fetchAllPages({
          fetchPage: (cursor) =>
            platformUserApi.list({ cursor, limit: PAGE_SIZE }),
        });
        return { data, next: null, previous: null };
      },
      enabled: canListUsers,
    });
  },
  usePlatformInvitations: () => {
    return useQuery({
      queryFn: () =>
        fetchAllPages({
          fetchPage: (cursor) =>
            userInvitationApi.list({
              type: InvitationType.PLATFORM,
              cursor,
              limit: PAGE_SIZE,
              projectId: null,
            }),
        }),
      queryKey: platformUserKeys.invitations,
      staleTime: 0,
    });
  },
};

async function fetchAllPages<T>({
  fetchPage,
}: {
  fetchPage: (cursor: string | undefined) => Promise<SeekPage<T>>;
}): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | undefined = undefined;
  do {
    const page: SeekPage<T> = await fetchPage(cursor);
    items.push(...page.data);
    cursor = page.next ?? undefined;
  } while (!isNil(cursor));
  return items;
}

const PAGE_SIZE = 500;

export const platformUserMutations = {
  useDeleteUser: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationKey: ['delete-user'],
      mutationFn: async (userId: string) => {
        await platformUserApi.delete(userId);
      },
      onSuccess,
      onError: (error) =>
        mutationFeedback.error({ error, title: t("Couldn't delete user") }),
    });
  },
  useDeleteInvitation: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationKey: ['delete-invitation'],
      mutationFn: async (invitationId: string) => {
        await userInvitationApi.delete(invitationId);
      },
      onSuccess,
      onError: (error) =>
        mutationFeedback.error({
          error,
          title: t("Couldn't revoke the invitation"),
        }),
    });
  },
  useUpdateUserStatus: ({ onSeatLimitError }: UpdateUserStatusParams) => {
    const queryClient = useQueryClient();
    const pending = useMutationState({
      filters: { mutationKey: USER_STATUS_MUTATION_KEY, status: 'pending' },
      select: (mutation) =>
        (mutation.state.variables as UserStatusChange | undefined)?.userId,
    });
    const mutation: UseMutationResult<
      User,
      Error,
      UserStatusChange,
      UserStatusContext
    > = useMutation<User, Error, UserStatusChange, UserStatusContext>({
      mutationKey: USER_STATUS_MUTATION_KEY,
      mutationFn: ({ userId, status }) =>
        platformUserApi.update(userId, { status }),
      onMutate: async ({ userId, status }) => {
        await queryClient.cancelQueries({ queryKey: platformUserKeys.users });
        const previous = queryClient.getQueryData<UsersCache>(
          platformUserKeys.users,
        );
        queryClient.setQueryData<UsersCache>(
          platformUserKeys.users,
          (current) => withUserPatch({ current, userId, patch: { status } }),
        );
        return { previous };
      },
      onError: (error, { undo }, context) => {
        if (context?.previous !== undefined) {
          queryClient.setQueryData(platformUserKeys.users, context.previous);
        }
        if (onSeatLimitError(error)) {
          mutationFeedback.markShown(error);
          return;
        }
        mutationFeedback.error({
          error,
          title: undo ? t("Couldn't undo") : t("Couldn't change the status"),
        });
      },
      onSuccess: (_user, change) => {
        if (change.undo) {
          return;
        }
        const activated = change.status === UserStatus.ACTIVE;
        mutationFeedback.undo({
          message: activated
            ? t('{name} activated', { name: change.name })
            : t('{name} deactivated', { name: change.name }),
          onUndo: () =>
            mutation.mutateAsync({
              ...change,
              status: activated ? UserStatus.INACTIVE : UserStatus.ACTIVE,
              undo: true,
            }),
        });
      },
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: platformUserKeys.users }),
    });
    const isPendingFor = (userId: string) => pending.includes(userId);
    const change = (vars: Omit<UserStatusChange, 'undo'>) => {
      if (isPendingFor(vars.userId)) {
        return;
      }
      mutation.mutate(vars);
    };
    return { change, isPendingFor };
  },
  useUpdateUser: ({
    userId,
    onSuccess,
    onError,
  }: {
    userId: string;
    onSuccess: (user: User) => void;
    onError: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation<User, Error, UpdateUserRequestBody>({
      mutationKey: ['update-user'],
      mutationFn: (request) => platformUserApi.update(userId, request),
      onSuccess: (user) => {
        queryClient.setQueryData<UsersCache>(
          platformUserKeys.users,
          (current) => withUserPatch({ current, userId, patch: user }),
        );
        onSuccess(user);
      },
      onError,
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: platformUserKeys.users }),
    });
  },
};

function withUserPatch({
  current,
  userId,
  patch,
}: {
  current: UsersCache | undefined;
  userId: string;
  patch: Partial<UserWithMetaInformation>;
}): UsersCache | undefined {
  if (current === undefined) {
    return current;
  }
  return {
    ...current,
    data: current.data.map((user) =>
      user.id === userId ? { ...user, ...patch } : user,
    ),
  };
}

const USER_STATUS_MUTATION_KEY = ['platform-user-status'];

type UsersCache = SeekPage<UserWithMetaInformation>;

type UserStatusContext = { previous: UsersCache | undefined };

type UpdateUserStatusParams = {
  onSeatLimitError: (error: Error) => boolean;
};

export type UserStatusChange = {
  userId: string;
  name: string;
  status: UserStatus;
  undo?: boolean;
};
