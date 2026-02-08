import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { Permission } from '@activepieces/shared';

export const RoutePermissionGuard = ({
  permission,
  children,
}: {
  children: ReactNode;
  permission: Permission | Permission[];
}) => {
  const { checkAccess } = useAuthorization();
  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = permissions.some((p) => checkAccess(p));
  if (!hasAccess) {
    return <Navigate replace={true} to="/404"></Navigate>;
  }
  return children;
};
