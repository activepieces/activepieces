import { Navigate } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { Permission } from '@activepieces/shared';

export const determineDefaultRoute = (
  checkAccess: (permission: Permission) => boolean,
) => {
  if (checkAccess(Permission.READ_FLOW)) {
    return '/flows';
  }
  if (checkAccess(Permission.READ_RUN)) {
    return '/runs';
  }
  if (checkAccess(Permission.READ_ISSUES)) {
    return '/issues';
  }
  return '/settings';
};

export const DefaultRoute = () => {
  const token = authenticationSession.getToken();
  const { checkAccess } = useAuthorization();
  if (!token) {
    return <Navigate to="/sign-in" replace={true}></Navigate>;
  }

  return (
    <Navigate to={determineDefaultRoute(checkAccess)} replace={true}></Navigate>
  );
};
