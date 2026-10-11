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
import { synkraOnboardingHooks } from '@/features/synkra-onboarding/hooks';

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
  return <DefaultRouteWithOnboardingCheck />;
};

const DefaultRouteWithOnboardingCheck = () => {
  const location = useLocation();
  const { data, isLoading } = synkraOnboardingHooks.useState();

  // Skip the gate for routes that don't need it.
  if (
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/sign-') ||
    location.pathname.startsWith('/redirect') ||
    location.pathname === '/create-platform' ||
    location.pathname.startsWith('/portal/') ||
    location.pathname.startsWith('/embed')
  ) {
    return <AuthenticatedDefaultRoute />;
  }

  // Wait for onboarding state to load.
  if (isLoading) return null;

  // Redirect to onboarding if not completed and not skipped.
  if (data && !data.completedAt && !data.skipped && data.step !== 'done') {
    return <Navigate to="/onboarding" replace />;
  }

  return <AuthenticatedDefaultRoute />;
};

/**
 * Checks if the current user has finished or skipped onboarding.
 * Renders children only after the check. Redirects to /onboarding
 * if onboarding is pending.
 */
