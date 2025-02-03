import { Navigate } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { determineDefaultRoute } from '@/lib/utils';

export const DefaultRoute = () => {
  const token = authenticationSession.getToken();
  const { checkAccess } = useAuthorization();
  if (!token) {
    return <Navigate to="/sign-in" replace={true}></Navigate>;
  }
  return <Navigate to={determineDefaultRoute(checkAccess)} replace></Navigate>;
};
