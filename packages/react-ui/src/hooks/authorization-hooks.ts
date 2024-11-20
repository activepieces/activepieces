import React from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { ApFlagId, Permission, PlatformRole, Rbac } from '@activepieces/shared';

export const useAuthorization = () => {
  const projectRole = authenticationSession.getUserProjectRole();
  const checkAccess = (permission: Permission) => {
    const hasAccess = React.useMemo(() => {
      if (!projectRole) return true;
      return projectRole.permissions.includes(permission);
    }, [projectRole, permission]);
    return hasAccess;
  };
  return { checkAccess, projectRole };
};
export const useShowPlatformAdminDashboard = () => {
  const platformRole = authenticationSession.getUserPlatformRole();
  const { data: isPlatfromDemo } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PLATFORM_DEMO,
  );
  return isPlatfromDemo || platformRole === PlatformRole.ADMIN;
};
