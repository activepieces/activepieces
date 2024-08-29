import React from 'react';

import { authenticationSession } from '@/lib/authentication-session';
import { rolePermissions } from '@activepieces/ee-shared';
import { Permission } from '@activepieces/shared';
import { t } from 'i18next';

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

type AuthorizationProps = {
  forbiddenFallback?: React.ReactNode;
  children: React.ReactNode;
  permission: Permission;
};

export const Authorization = ({
  permission,
  forbiddenFallback = null,
  children,
}: AuthorizationProps) => {
  const { checkAccess } = useAuthorization();

  let canAccess = false;

  if (permission) {
    canAccess = checkAccess(permission);
  }

  return <>{canAccess ? children : forbiddenFallback}</>;
};
