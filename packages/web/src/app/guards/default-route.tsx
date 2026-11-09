import { isNil } from '@activepieces/core-utils';
import { Navigate, useLocation } from 'react-router-dom';

import { useChatEnabled } from '@/features/workspace/lib/use-chat-on';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import {
  determineDefaultRoute,
  TRIAL_KEY_QUERY_PARAM,
} from '@/lib/route-utils';

import { NoProjectsState } from '../components/no-projects-state';

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
  const chatOn = useChatEnabled();
  const location = useLocation();
  const currentProjectId = authenticationSession.getProjectId();
  const trialKey = new URLSearchParams(location.search).get(
    TRIAL_KEY_QUERY_PARAM,
  );
  if (isNil(currentProjectId)) {
    return <NoProjectsState />;
  }
  return (
    <Navigate
      to={{
        pathname: determineDefaultRoute({
          checkAccess,
          chatEnabled: chatOn,
        }),
        search: isNil(trialKey)
          ? ''
          : new URLSearchParams({
              [TRIAL_KEY_QUERY_PARAM]: trialKey,
            }).toString(),
      }}
      replace
    ></Navigate>
  );
};
