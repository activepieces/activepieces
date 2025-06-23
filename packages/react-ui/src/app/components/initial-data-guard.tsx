import { Suspense } from 'react';

import { LoadingScreen } from './loading-screen';

type InitialDataGuardProps = {
  children: React.ReactNode;
};
export const InitialDataGuard = ({ children }: InitialDataGuardProps) => {
  return (
    <Suspense fallback={<LoadingScreen></LoadingScreen>}>{children}</Suspense>
  );
};
