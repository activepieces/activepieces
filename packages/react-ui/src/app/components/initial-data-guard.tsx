import { Suspense } from 'react';

import { useEmbedding } from '@/components/embed-provider';

import { LoadingScreen } from '../../components/ui/loading-screen';

type InitialDataGuardProps = {
  children: React.ReactNode;
};
export const InitialDataGuard = ({ children }: InitialDataGuardProps) => {
  const { embedState } = useEmbedding();
  return (
    <Suspense
      fallback={
        <LoadingScreen
          brightSpinner={embedState.useDarkBackground}
        ></LoadingScreen>
      }
    >
      {children}
    </Suspense>
  );
};
