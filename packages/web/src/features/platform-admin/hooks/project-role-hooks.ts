import { ErrorCode, ProjectRole, SeekPage } from '@activepieces/core-utils';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';

import { api } from '@/lib/api';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { projectRoleApi } from '../api/project-role-api';

const PROJECT_ROLE_MEMBERS_PAGE_SIZE = 100;

export const projectRoleKeys = {
  all: ['project-roles'] as const,
  members: (roleId: string) => ['users-with-project-roles', roleId] as const,
};

export const projectRoleQueries = {
  useProjectRoles: (enabled: boolean) =>
    useQuery({
      queryKey: projectRoleKeys.all,
      queryFn: () => projectRoleApi.list(),
      enabled,
    }),
  useProjectRoleMembers: (roleId: string | undefined, enabled: boolean) =>
    useInfiniteQuery({
      queryKey: projectRoleKeys.members(roleId ?? ''),
      queryFn: ({ pageParam }) =>
        projectRoleApi.listProjectMembers(roleId!, {
          cursor: pageParam,
          limit: PROJECT_ROLE_MEMBERS_PAGE_SIZE,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.next ?? undefined,
      enabled: enabled && !!roleId,
    }),
};

export const projectRoleMutations = {
  useUpsertProjectRole: ({ onSave, onError }: UpsertProjectRoleHandlers) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({
        mode,
        roleId,
        name,
        permissions,
        type,
      }: UpsertProjectRoleParams): Promise<ProjectRole | undefined> => {
        if (mode === 'create') {
          return projectRoleApi.create({
            name,
            permissions,
            type: type as never,
          });
        }
        if (roleId) {
          return projectRoleApi.update(roleId, { name, permissions });
        }
        return undefined;
      },
      onSuccess: (saved) => {
        if (saved !== undefined) {
          queryClient.setQueryData<SeekPage<ProjectRole>>(
            projectRoleKeys.all,
            (current) => withSavedRole({ current, saved }),
          );
        }
        onSave(saved);
      },
      onError: (error) => {
        if (onError) {
          onError(error);
          return;
        }
        mutationFeedback.error({ error, title: t("Couldn't save the role") });
      },
    });
  },
  useDeleteProjectRole: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationKey: ['delete-project-role'],
      mutationFn: (name: string) => projectRoleApi.delete(name),
      onSuccess,
      onError: (error) =>
        mutationFeedback.error({
          error,
          title: t("Couldn't delete the role"),
        }),
    });
  },
};

export function projectRoleErrorMessage(error: unknown): string {
  const nameTaken =
    api.isApError(error, ErrorCode.VALIDATION) &&
    (api.serverErrorMessage(error) ?? '').startsWith(NAME_TAKEN_PREFIX);
  return nameTaken
    ? t('A role with this name already exists')
    : mutationFeedback.message(error);
}

export function withSavedRole({
  current,
  saved,
}: {
  current: SeekPage<ProjectRole> | undefined;
  saved: ProjectRole;
}): SeekPage<ProjectRole> | undefined {
  if (current === undefined) {
    return current;
  }
  const exists = current.data.some((role) => role.id === saved.id);
  return {
    ...current,
    data: exists
      ? current.data.map((role) =>
          role.id === saved.id
            ? {
                ...role,
                ...saved,
                userCount: saved.userCount ?? role.userCount,
              }
            : role,
        )
      : [...current.data, saved],
  };
}

const NAME_TAKEN_PREFIX = 'Project role name already exists';

type UpsertProjectRoleHandlers = {
  onSave: (saved: ProjectRole | undefined) => void;
  onError?: (error: unknown) => void;
};

type UpsertProjectRoleParams = {
  mode: 'create' | 'edit';
  roleId?: string;
  name: string;
  permissions: string[];
  type?: string;
};
