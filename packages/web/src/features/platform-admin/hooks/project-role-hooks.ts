import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { projectRoleApi } from '../api/project-role-api';

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
    useQuery({
      queryKey: projectRoleKeys.members(roleId ?? ''),
      queryFn: () =>
        projectRoleApi.listProjectMembers(roleId!, {
          cursor: undefined,
          limit: 10,
        }),
      enabled: enabled && !!roleId,
    }),
};

export const projectRoleMutations = {
  useUpsertProjectRole: ({ onSave }: { onSave: () => void }) => {
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
      onError: () => {
        toast.error(t('Role name already exists'), {
          duration: 3000,
        });
      },
    });
  },
  useDeleteProjectRole: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationKey: ['delete-project-role'],
      mutationFn: (name: string) => projectRoleApi.delete(name),
      onSuccess: () => {
        onSuccess();
        toast.success(t('Project Role entry deleted successfully'), {
          duration: 3000,
        });
      },
    });
  },
};

type UpsertProjectRoleParams = {
  mode: 'create' | 'edit';
  roleId?: string;
  name: string;
  permissions: string[];
  type?: string;
};
