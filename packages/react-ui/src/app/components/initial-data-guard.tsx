import { Suspense } from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';

import { LoadingScreen } from './loading-screen';

type InitialDataGuardProps = {
  children: React.ReactNode;
};
export const InitialDataGuard = ({ children }: InitialDataGuardProps) => {
  flagsHooks.prefetchFlags();
  return (
    <Suspense fallback={<LoadingScreen></LoadingScreen>}>{children}</Suspense>
  );
};
