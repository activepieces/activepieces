import { Permission } from '@activepieces/shared';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';

export const RoutePermissionGuard = ({
  permission,
  children,
}: {
  children: ReactNode;
  permission: Permission;
}) => {
  const { checkAccess } = useAuthorization();
  if (!checkAccess(permission)) {
    return <Navigate replace={true} to="/404"></Navigate>;
  }
  return children;
};
