import { Navigate, useLocation } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { determineDefaultRoute } from '@/lib/utils';

export const DefaultRoute = () => {
  const token = authenticationSession.getToken();
  const { checkAccess } = useAuthorization();
  const location = useLocation();

  if (!token) {
    // Redirect to JWT auth instead of sign-in
    return (
      <Navigate
        to="/jwt-auth"
        replace={true}
      ></Navigate>
    );
  }
  return <Navigate to={determineDefaultRoute(checkAccess)} replace></Navigate>;
};
