import { Suspense } from 'react';

import { LoadingScreen } from '@/components/custom/loading-screen';
import { useEmbedding } from '@/components/providers/embed-provider';

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
