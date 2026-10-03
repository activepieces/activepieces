import { ErrorCode, isNil } from '@activepieces/core-utils';
import { FlowRun, PopulatedFlow } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { t } from 'i18next';
import { useParams } from 'react-router-dom';

import { BuilderPage } from '@/app/builder';
import { BuilderStateProvider } from '@/app/builder/state/builder-state-provider';
import NotFoundPage from '@/app/routes/404-page';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { LoadingSpinner } from '@/components/custom/spinner';
import { flowRunsApi } from '@/features/flow-runs';
import { flowsApi, sampleDataHooks } from '@/features/flows';
import { api } from '@/lib/api';

const isNotFoundError = (error: unknown) =>
  api.isApError(error, ErrorCode.ENTITY_NOT_FOUND);

const FlowRunPage = () => {
  const { runId, projectId } = useParams();
  const { data, error, isLoading, refetch } = useQuery<
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
    enabled: runId !== undefined,
    retry: (failureCount, error) => failureCount < 3 && !isNotFoundError(error),
    refetchInterval: (query) =>
      isNil(query.state.data) || isNotFoundError(query.state.error)
        ? false
        : 15000,
  });

  const { data: sampleData, isLoading: isSampleDataLoading } =
    sampleDataHooks.useSampleDataForFlow(data?.flow?.version, projectId);

  const { data: sampleDataInput, isLoading: isSampleDataInputLoading } =
    sampleDataHooks.useSampleDataInputForFlow(data?.flow?.version, projectId);

  if (isLoading || isSampleDataLoading || isSampleDataInputLoading) {
    return (
      <div className="bg-background flex h-full w-full items-center justify-center ">
        <LoadingSpinner isLarge={true}></LoadingSpinner>
      </div>
    );
  }

  if (isNil(data)) {
    if (isNotFoundError(error)) {
      return (
        <NotFoundPage
          title={t('Run not found')}
          description={t("This run doesn't exist or was deleted.")}
        />
      );
    }
    return (
      <DataFetchErrorState
        className="bg-background h-full"
        entity={t('this run')}
        onRetry={refetch}
      />
    );
  }

  return (
    <ReactFlowProvider>
      <BuilderStateProvider
        flow={data.flow}
        flowVersion={data.flow.version}
        readonly={true}
        hideTestWidget={false}
        run={data.run}
        outputSampleData={sampleData ?? {}}
        inputSampleData={sampleDataInput ?? {}}
      >
        <BuilderPage />
      </BuilderStateProvider>
    </ReactFlowProvider>
  );
};

export { FlowRunPage };
