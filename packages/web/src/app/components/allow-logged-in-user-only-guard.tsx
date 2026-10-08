import { Navigate, useLocation } from 'react-router-dom';

import { SocketProvider } from '@/components/providers/socket-provider';
import { AutomaticTrialActivation } from '@/features/billing';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { authenticationSession } from '../../lib/authentication-session';

type AllowOnlyLoggedInUserOnlyGuardProps = {
  children: React.ReactNode;
};
export const AllowOnlyLoggedInUserOnlyGuard = ({
  children,
}: AllowOnlyLoggedInUserOnlyGuardProps) => {
  const location = useLocation();
  if (!authenticationSession.isLoggedIn()) {
    authenticationSession.logOut();
    const searchParams = new URLSearchParams();
    searchParams.set('from', location.pathname + location.search);
    return <Navigate to={`/sign-in?${searchParams.toString()}`} replace />;
  }
  if (authenticationSession.isOnboarding()) {
    return <Navigate to="/create-platform" replace />;
  }
  platformHooks.useCurrentPlatform();
  flagsHooks.useFlags();
  projectCollectionUtils.useCurrentProject();
  return (
    <SocketProvider>
      <AutomaticTrialActivation />
      {children}
    </SocketProvider>
  );
};
