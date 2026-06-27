import { Navigate, useLocation } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { CHAT_ROUTE, determineDefaultRoute } from '@/lib/route-utils';

export const DefaultRoute = () => {
  const token = authenticationSession.getToken();
  const location = useLocation();
  if (!token) {
    const searchParams = new URLSearchParams();
    searchParams.set('from', location.pathname + location.search);
    return (
      <Navigate
        to={`/sign-in?${searchParams.toString()}`}
        replace={true}
      ></Navigate>
    );
  }
  if (authenticationSession.isOnboarding()) {
    return <Navigate to="/create-platform" replace />;
  }
  return <AuthenticatedDefaultRoute />;
};

const AuthenticatedDefaultRoute = () => {
  const { checkAccess } = useAuthorization();
  // Open the app on the project-agnostic chat landing (Stage closed); the user
  // opens a flow/table from there via Browse (⌘K) or the chat itself.
  const projectId = authenticationSession.getProjectId();
  if (projectId) {
    return <Navigate to={CHAT_ROUTE} replace />;
  }
  return <Navigate to={determineDefaultRoute({ checkAccess })} replace />;
};
