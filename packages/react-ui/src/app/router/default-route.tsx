import { Navigate, useLocation } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { determineDefaultRoute } from '@/lib/utils';

export const DefaultRoute = () => {
  const token = authenticationSession.getToken();
  const { checkAccess } = useAuthorization();
  const location = useLocation();

  // NO LOGIN SCREEN - redirect directly to main app
  if (!token) {
    // Redirect directly to flows instead of any login/auth page
    return (
      <Navigate
        to="/flows"
        replace={true}
      ></Navigate>
    );
  }
  return <Navigate to={determineDefaultRoute(checkAccess)} replace></Navigate>;
};
