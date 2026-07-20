import { Navigate, useLocation } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { determineDefaultRoute } from '@/lib/route-utils';

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

// The /chat landing renders nothing itself — the persistent WorkspaceShell paints the
// chat panel. When chat is off the shell omits that panel, so a chat-off user who lands
// here (a stale link, a typed URL) would see an empty Stage; send them to the classic
// default surface instead.
export const ChatLandingGuard = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  if (!platform.plan.chatEnabled) {
    return <Navigate to={determineDefaultRoute({ checkAccess })} replace />;
  }
  return null;
};

const AuthenticatedDefaultRoute = () => {
  const { checkAccess } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  return (
    <Navigate
      to={determineDefaultRoute({
        checkAccess,
        chatEnabled: platform.plan.chatEnabled,
      })}
      replace
    ></Navigate>
  );
};
