import { Navigate } from 'react-router-dom';

import { SocketProvider } from '@/components/socket-provider';
import { useTelemetry } from '@/components/telemetry-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';

import { authenticationSession } from '../../lib/authentication-session';

type AllowOnlyLoggedInUserOnlyGuardProps = {
  children: React.ReactNode;
};
export const AllowOnlyLoggedInUserOnlyGuard = ({
  children,
}: AllowOnlyLoggedInUserOnlyGuardProps) => {
  const { reset } = useTelemetry();

  if (!authenticationSession.isLoggedIn()) {
    return <Navigate to="/sign-in" replace />;
  }
  const token = authenticationSession.getToken();
  if (!token || authenticationSession.isJwtExpired(token)) {
    authenticationSession.logOut();
    reset();
    return <Navigate to="/sign-in" replace />;
  }
  platformHooks.useCurrentPlatform();
  flagsHooks.useFlags();
  projectHooks.useCurrentProject();
  return <SocketProvider>{children}</SocketProvider>;
};
