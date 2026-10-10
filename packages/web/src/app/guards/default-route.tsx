import { isNil } from '@activepieces/core-utils';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import {
  determineDefaultRoute,
  TRIAL_KEY_QUERY_PARAM,
} from '@/lib/route-utils';

import { NoProjectsState } from '../components/no-projects-state';
import { ProjectDashboardLayout } from '../components/project-layout';
import { synkraOnboardingHooks } from '@/features/synkra-onboarding';

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
  // If already on /onboarding, don't redirect away.
  if (location.pathname === '/onboarding') {
    return null;
  }
  return <AuthenticatedDefaultRoute />;
};

/**
 * Checks if the current user has finished or skipped onboarding.
 * Renders children only after the check. Redirects to /onboarding
 * if onboarding is pending.
 */
export const OnboardingRedirectGate = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const { data, isLoading } = synkraOnboardingHooks.useState();

  // Don't gate the onboarding page itself.
  if (location.pathname === '/onboarding') return <>{children}</>;

  // Don't gate sign-in, sign-up, public routes.
  if (
    location.pathname.startsWith('/sign-') ||
    location.pathname.startsWith('/redirect') ||
    location.pathname === '/' ||
    location.pathname === '/create-platform'
  ) {
    return <>{children}</>;
  }

  // While loading, don't redirect — avoids a flash of the wrong screen.
  if (isLoading) return <>{children}</>;

  // If not completed and not skipped, send to /onboarding.
  if (data && !data.completedAt && !data.skipped && data.step !== 'done') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const AuthenticatedDefaultRoute = () => {
  const { checkAccess } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  const location = useLocation();
  const currentProjectId = authenticationSession.getProjectId();
  const trialKey = new URLSearchParams(location.search).get(
    TRIAL_KEY_QUERY_PARAM,
  );
  if (isNil(currentProjectId)) {
    return (
      <ProjectDashboardLayout>
        <NoProjectsState />
      </ProjectDashboardLayout>
    );
  }
  return (
    <Navigate
      to={{
        pathname: determineDefaultRoute({
          checkAccess,
          chatEnabled: platform.plan.chatEnabled,
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
