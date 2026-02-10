import { Navigate, useLocation } from 'react-router-dom';

import { SocketProvider } from '@/components/socket-provider';
import { useTelemetry } from '@/components/telemetry-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';

import { authenticationSession } from '../../lib/authentication-session';

import { BadgeCelebrate } from './badge-celebrate';

type AllowOnlyLoggedInUserOnlyGuardProps = {
  children: React.ReactNode;
};
export const AllowOnlyLoggedInUserOnlyGuard = ({
  children,
}: AllowOnlyLoggedInUserOnlyGuardProps) => {
  const { reset } = useTelemetry();
  const location = useLocation();
  if (!authenticationSession.isLoggedIn()) {
    authenticationSession.logOut();
    reset();
    const searchParams = new URLSearchParams();
    searchParams.set('from', location.pathname + location.search);
    return <Navigate to={`/sign-in?${searchParams.toString()}`} replace />;
  }
  platformHooks.useCurrentPlatform();
  flagsHooks.useFlags();
  projectCollectionUtils.useCurrentProject();
  return (
    <SocketProvider>
      <BadgeCelebrate />
      {children}
    </SocketProvider>
  );
};
