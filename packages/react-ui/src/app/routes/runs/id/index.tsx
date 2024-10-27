import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { BuilderPage } from '@/app/builder';
import { BuilderStateProvider } from '@/app/builder/builder-state-provider';
import { LoadingSpinner } from '@/components/ui/spinner';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { sampleDataHooks } from '@/features/flows/lib/sample-data-hooks';
import { FlowRun, PopulatedFlow } from '@activepieces/shared';

const FlowRunPage = () => {
  const { runId } = useParams();

  const { data, isLoading } = useQuery<
    {
      run: FlowRun;
      flow: PopulatedFlow;
    },
    Error
  >({
    queryKey: ['run', runId],
    queryFn: async () => {
      const flowRun = await flowRunsApi.getPopulated(runId!);
      const flow = await flowsApi.get(flowRun.flowId, {
        versionId: flowRun.flowVersionId,
      });
      return {
        run: flowRun,
        flow: flow,
      };
    },
    staleTime: 0,
    gcTime: 0,
    enabled: runId !== undefined,
  });

  const {
    data: sampleData,
    isLoading: isSampleDataLoading,
    isError: isSampleDataError,
  } = sampleDataHooks.useSampleDataForFlow(data?.flow?.version);

  if (isLoading || isSampleDataLoading) {
    return (
      <div className="bg-background flex h-screen w-screen items-center justify-center ">
        <LoadingSpinner size={50}></LoadingSpinner>
      </div>
    );
  }

  if (isSampleDataError) {
    return <p>Error loading sample data, contact support</p>;
  }

  return (
    data && (
      <BuilderStateProvider
        flow={data.flow}
        flowVersion={data.flow.version}
        readonly={true}
        canExitRun={false}
        run={data.run}
        sampleData={sampleData ?? {}}
      >
        <BuilderPage />
      </BuilderStateProvider>
    )
  );
};

export { FlowRunPage };
