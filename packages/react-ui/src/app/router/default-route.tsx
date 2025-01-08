import { Navigate } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { Permission } from '@activepieces/shared';

export const determineDefaultRoute = (
  checkAccess: (permission: Permission) => boolean,
) => {
  if (checkAccess(Permission.READ_FLOW)) {
    return authenticationSession.appendProjectRoutePrefix('/flows');
  }
  if (checkAccess(Permission.READ_RUN)) {
    return authenticationSession.appendProjectRoutePrefix('/runs');
  }
  if (checkAccess(Permission.READ_ISSUES)) {
    return authenticationSession.appendProjectRoutePrefix('/issues');
  }
  return authenticationSession.appendProjectRoutePrefix('/settings');
};

export const DefaultRoute = () => {
  const token = authenticationSession.getToken();
  const { checkAccess } = useAuthorization();
  if (!token) {
    return <Navigate to="/sign-in" replace={true}></Navigate>;
  }

  return <Navigate to={determineDefaultRoute(checkAccess)} replace></Navigate>;
};
