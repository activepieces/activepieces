import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import { LoadingSpinner } from '@/components/ui/spinner';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';

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
  platformHooks.prefetchPlatform();
  return (
    <Suspense
      fallback={
        <div className="bg-background flex h-screen w-screen items-center justify-center ">
          <LoadingSpinner size={50}></LoadingSpinner>
        </div>
      }
    >
      {children}
    </Suspense>
  );
};
