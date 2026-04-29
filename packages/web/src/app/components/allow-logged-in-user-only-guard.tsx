import { Navigate } from 'react-router-dom';

import { SocketProvider } from '@/components/providers/socket-provider';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { authenticationSession } from '../../lib/authentication-session';

import { BadgeCelebrate } from './badge-celebrate';

type AllowOnlyLoggedInUserOnlyGuardProps = {
  children: React.ReactNode;
};
export const AllowOnlyLoggedInUserOnlyGuard = ({
  children,
}: AllowOnlyLoggedInUserOnlyGuardProps) => {
  const { reset } = useTelemetry();
  if (!authenticationSession.isLoggedIn()) {
    authenticationSession.clearSession();
    reset();
    return <Navigate to="/login" replace />;
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
