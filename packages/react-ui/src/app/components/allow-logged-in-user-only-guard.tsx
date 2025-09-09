import { Navigate, useLocation } from 'react-router-dom';

import { authenticationSession } from '../../lib/authentication-session';

import { SocketProvider } from '@/components/socket-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';

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
  platformHooks.useCurrentPlatform();
  flagsHooks.useFlags();
  projectHooks.useCurrentProject();
  return <SocketProvider>{children}</SocketProvider>;
};
