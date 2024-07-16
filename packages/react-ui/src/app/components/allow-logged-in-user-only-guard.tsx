import { LoaderIcon } from 'lucide-react';
import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import { flagsHooks } from '../../hooks/flags-hooks';
import { platformHooks } from '../../hooks/platform-hooks';
import { projectHooks } from '../../hooks/project-hooks';
import { authenticationSession } from '../../lib/authentication-session';

export const AllowOnlyLoggedInUserOnlyGuard = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  if (!authenticationSession.isLoggedIn()) {
    return <Navigate to="/sign-in" replace />;
  }
  projectHooks.prefetchProject();
  flagsHooks.prefetchFlags();
  platformHooks.prefetchPlatform();
  //TODO: Add loading for prefetching
  return (
    <Suspense
      fallback={
        <div className="bg-background flex h-screen w-screen items-center justify-center ">
          <div className="animate-spin">
            <LoaderIcon height={50} width={50}></LoaderIcon>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
};
