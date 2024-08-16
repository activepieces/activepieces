import { Suspense } from 'react';

import { LoadingSpinner } from '@/components/ui/spinner';
import { flagsHooks } from '@/hooks/flags-hooks';

export const InitialDataGuard = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  flagsHooks.prefetchFlags();
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