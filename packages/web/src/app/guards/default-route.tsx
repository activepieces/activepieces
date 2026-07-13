import { Navigate, useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import {
  determineDefaultRoute,
  resolveAuthenticatedLanding,
} from '@/lib/route-utils';

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
  const { embedState } = useEmbedding();
  const { platform } = platformHooks.useCurrentPlatform();
  // The operator app opens on the project-agnostic chat landing (Stage closed) when the
  // user has chat; otherwise (embed, or chat off for Community / EE-without-flag / Cloud
  // outside the rollout) it falls through to the classic default surface — never /chat.
  const target = resolveAuthenticatedLanding({
    projectId: authenticationSession.getProjectId(),
    isEmbedded: embedState.isEmbedded,
    chatEnabled: platform.plan.chatEnabled,
    classicRoute: determineDefaultRoute({ checkAccess }),
  });
  return <Navigate to={target} replace />;
};
