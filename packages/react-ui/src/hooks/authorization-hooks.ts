import React from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { ApFlagId, Permission, PlatformRole } from '@activepieces/shared';

export const useAuthorization = () => {
  // TODO: make sure to update the role in the local storage
  const projectRole = authenticationSession.getUserProjectRole();

  const useCheckAccess = (permission: Permission) => {
    return React.useMemo(() => {
      if (!projectRole) return true;
      return projectRole.permissions.includes(permission);
    }, [permission]);
  };

  return { useCheckAccess, projectRole };
};

export const useShowPlatformAdminDashboard = () => {
  const platformRole = authenticationSession.getUserPlatformRole();
  const { data: isPlatformDemo } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PLATFORM_DEMO,
  );
  return isPlatformDemo || platformRole === PlatformRole.ADMIN;
};
