import React from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { ApFlagId, Permission, PlatformRole, Rbac } from '@activepieces/shared';

export const useAuthorization = () => {
  const role = authenticationSession.getUserProjectRole();
  const checkAccess = (permission: Permission) => {
    const hasAccess = React.useMemo(() => {
      if (!role) return true;
      return role.permissions.includes(permission);
    }, [role, permission]);
    return hasAccess;
  };
  return { checkAccess, role };
};
export const useShowPlatformAdminDashboard = () => {
  const platformRole = authenticationSession.getUserPlatformRole();
  const { data: isPlatfromDemo } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PLATFORM_DEMO,
  );
  return isPlatfromDemo || platformRole === PlatformRole.ADMIN;
};
