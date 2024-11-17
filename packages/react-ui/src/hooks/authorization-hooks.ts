import React from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { ApFlagId, Permission, PlatformRole, Rbac } from '@activepieces/shared';
import { api } from '@/lib/api';

export const useAuthorization = () => {
  const roleId = authenticationSession.getUserProjectRoleId();

  const checkAccess = React.useCallback(
    async (permission: Permission) => {
      if (!roleId) return true;
      const role = await api.post<Rbac>(`/v1/rbac/get-role`, {
        id: roleId,
      });
      if (!role) return false;

      return role.permissions.includes(permission);
    },
    [roleId],
  );

  return { checkAccess, roleId };
};

export const useShowPlatformAdminDashboard = () => {
  const platformRole = authenticationSession.getUserPlatformRole();
  const { data: isPlatfromDemo } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PLATFORM_DEMO,
  );
  return isPlatfromDemo || platformRole === PlatformRole.ADMIN;
};
