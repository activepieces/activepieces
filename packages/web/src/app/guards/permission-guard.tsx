import { Permission } from '@activepieces/shared';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';

export const RoutePermissionGuard = ({
  requiredPermissions: permission,
  children,
}: {
  children: ReactNode;
  requiredPermissions: Permission | Permission[];
}) => {
  const { checkAccess } = useAuthorization();
  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = permissions.some((p) => checkAccess(p));
  if (!hasAccess) {
    return <Navigate replace={true} to="/404"></Navigate>;
  }
  return children;
};
