import { Navigate, useLocation } from 'react-router-dom';

import { SocketProvider } from '@/components/providers/socket-provider';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { authenticationSession } from '../../lib/authentication-session';

type AllowOnlyLoggedInUserOnlyGuardProps = {
  children: React.ReactNode;
  // Rendered instead of the sign-in redirect when the visitor is logged out —
  // for routes that have a public variant (e.g. shared template links) but
  // must keep this guard as their element root so their component chain stays
  // type-identical with the other guarded routes (React then preserves the
  // layout instance across navigation).
  publicFallback?: React.ReactNode;
};
export const AllowOnlyLoggedInUserOnlyGuard = ({
  children,
  publicFallback,
}: AllowOnlyLoggedInUserOnlyGuardProps) => {
  const { reset } = useTelemetry();
  const location = useLocation();
  if (!authenticationSession.isLoggedIn()) {
    if (publicFallback) {
      return <>{publicFallback}</>;
    }
    authenticationSession.logOut();
    reset();
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
  return <SocketProvider>{children}</SocketProvider>;
};
