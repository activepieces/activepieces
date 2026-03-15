import {
  BulkActionOnRunsRequestBody,
  BulkArchiveActionOnRunsRequestBody,
  BulkCancelFlowRequestBody,
  FlowRetryStrategy,
  FlowRun,
  PopulatedFlow,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { flowsApi } from '@/features/flows/api/flows-api';

import { flowRunsApi } from '../api/flow-runs-api';

export const flowRunKeys = {
  detail: (runId: string) => ['flow-run', runId] as const,
};

export const flowRunQueries = {
  useFlowRun: (runId: string) =>
    useQuery({
      queryKey: flowRunKeys.detail(runId),
      queryFn: () => flowRunsApi.getPopulated(runId),
      refetchInterval: 15000,
    }),
};

export const flowRunMutations = {
  useRetryRun: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (result: { run: FlowRun; populatedFlow: PopulatedFlow }) => void;
    onError: (error: unknown) => void;
  }) => {
    return useMutation<
      { run: FlowRun; populatedFlow: PopulatedFlow },
      Error,
      {
        runId: string;
        flowId: string;
        projectId: string;
        retryStrategy: FlowRetryStrategy;
      }
    >({
      mutationFn: async ({ runId, flowId, projectId, retryStrategy }) => {
        const updatedRun = await flowRunsApi.retry(runId, {
          projectId,
          strategy: retryStrategy,
        });
        const populatedFlow = await flowsApi.get(flowId, {
          versionId: updatedRun.flowVersionId,
        });
        return { run: updatedRun, populatedFlow };
      },
      onSuccess,
      onError
    });
  },
  useBulkRetryRuns: ({
    onSuccess,
  }: {
    onSuccess: (runs: FlowRun[]) => void;
  }) => {
    return useMutation({
      mutationFn: (request: BulkActionOnRunsRequestBody) =>
        flowRunsApi.bulkRetry(request),
      onSuccess,
    });
  },
  useBulkCancelRuns: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: (request: BulkCancelFlowRequestBody) =>
        flowRunsApi.bulkCancel(request),
      onSuccess,
    });
  },
  useBulkArchiveRuns: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: (request: BulkArchiveActionOnRunsRequestBody) =>
        flowRunsApi.bulkArchive(request),
      onSuccess,
    });
  },
};
