import { usePrefetchQuery, useQuery } from '@tanstack/react-query';
import { Suspense, useState, useTransition } from 'react';
import { useParams } from 'react-router-dom';

import { BuilderPage } from '@/app/builder/builder-page';
import { BuilderStateProvider } from '@/app/builder/builder-state-provider';
import { LoadingSpinner } from '@/components/ui/spinner';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { PopulatedFlow } from '@activepieces/shared';

const FlowBuilderPage = () => {
  const { flowId } = useParams();
  const [isPending, startTransition] = useTransition();
  const [shouldFetch, setShouldFetch] = useState(false);

  usePrefetchQuery<PopulatedFlow, Error>({
    queryKey: ['flow', flowId],
    queryFn: () => flowsApi.get(flowId!),
  });

  const { data: flow, isLoading } = useQuery<PopulatedFlow, Error>({
    queryKey: ['flow', flowId],
    queryFn: () => flowsApi.get(flowId!),
    enabled: shouldFetch,
  });

  if (!shouldFetch) {
    startTransition(() => {
      setShouldFetch(true);
    });
    return null;
  }

  if (isLoading || isPending) {
    return (
      <div className="bg-background flex h-screen w-screen items-center justify-center ">
        <LoadingSpinner size={50}></LoadingSpinner>
      </div>
    );
  }

  return (
    <Suspense>
      <BuilderStateProvider
        flow={flow!}
        flowVersion={flow!.version}
        readonly={false}
        run={null}
      >
        <BuilderPage />
      </BuilderStateProvider>
    </Suspense>
  );
};

export { FlowBuilderPage };
