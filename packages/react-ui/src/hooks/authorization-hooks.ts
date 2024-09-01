import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { rolePermissions } from '@activepieces/ee-shared';
import { ApFlagId, Permission, PlatformRole } from '@activepieces/shared';

export const useAuthorization = () => {
  const role = authenticationSession.getUserProjectRole();

  const checkAccess = React.useCallback(
    (permission: Permission) => {
      if (!role) return true;

      return rolePermissions[role].includes(permission);
    },
    [role],
  );

  return { checkAccess, role };
};

export const useShowPlatformAdminDashboard = () => {
  const platformRole = authenticationSession.getUserPlatformRole();
  const { data: isPlatfromDemo } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PLATFORM_DEMO,
    useQueryClient(),
  );
  return isPlatfromDemo || platformRole === PlatformRole.ADMIN;
};
