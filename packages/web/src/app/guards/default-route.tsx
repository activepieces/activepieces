import { Navigate, useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
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
  const { embedState } = useEmbedding();
  // The operator app opens on the project-agnostic chat landing (Stage closed); the
  // user opens a flow/table from there via Browse (⌘K) or the chat itself. Embeds
  // have no chat, so they resolve to their default surface — an embed must never
  // land on /chat.
  const projectId = authenticationSession.getProjectId();
  if (projectId && !embedState.isEmbedded) {
    return <Navigate to={CHAT_ROUTE} replace />;
  }
  return <Navigate to={determineDefaultRoute({ checkAccess })} replace />;
};
