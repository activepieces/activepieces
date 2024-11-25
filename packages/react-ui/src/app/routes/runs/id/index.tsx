import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
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

  const { data: sampleData, isLoading: isSampleDataLoading } =
    sampleDataHooks.useSampleDataForFlow(data?.flow?.version);

  if (isLoading || isSampleDataLoading) {
    return (
      <div className="bg-background flex h-screen w-screen items-center justify-center ">
        <LoadingSpinner size={50}></LoadingSpinner>
      </div>
    );
  }

  return (
    data && (
      <ReactFlowProvider>
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
      </ReactFlowProvider>
    )
  );
};

export { FlowRunPage };
