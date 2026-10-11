import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

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
    return useMutation({
      mutationFn: async ({
        mode,
        roleId,
        name,
        permissions,
        type,
      }: UpsertProjectRoleParams) => {
        if (mode === 'create') {
          await projectRoleApi.create({
            name,
            permissions,
            type: type as never,
          });
        } else if (mode === 'edit' && roleId) {
          await projectRoleApi.update(roleId, { name, permissions });
        }
      },
      onSuccess: onSave,
      onError: (error) => {
        if (onError) {
          onError(error);
          return;
        }
        mutationFeedback.error({ error, title: t("Couldn't save changes") });
      },
    });
  },
};

type UpsertProjectRoleHandlers = {
  onSave: () => void;
  onError?: (error: unknown) => void;
};

type UpsertProjectRoleParams = {
  mode: 'create' | 'edit';
  roleId?: string;
  name: string;
  permissions: string[];
  type?: string;
};
