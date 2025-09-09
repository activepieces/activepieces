import { Suspense } from 'react';

import { LoadingScreen } from '../../components/ui/loading-screen';

type InitialDataGuardProps = {
  children: React.ReactNode;
};
export const InitialDataGuard = ({ children }: InitialDataGuardProps) => {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
};
