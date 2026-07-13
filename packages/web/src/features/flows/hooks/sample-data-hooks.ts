import {
  flowStructureUtil,
  FlowVersion,
  SampleDataFileType,
} from '@activepieces/shared';
import { useQuery, QueryClient } from '@tanstack/react-query';

import { sampleDataApi } from '../api/sample-data-api';

export const sampleDataHooks = {
  useSampleDataForFlow: (
    flowVersion: FlowVersion | undefined,
    projectId: string | undefined,
  ) => {
    return useQuery({
      queryKey: ['sampleData', flowVersion?.id],
      enabled: !!flowVersion,
      staleTime: 0,
      retry: 4,
      refetchOnWindowFocus: false,
      queryFn: () =>
        getSampleDataForFlow(
          flowVersion!,
          projectId!,
          SampleDataFileType.OUTPUT,
        ),
    });
  },
  useSampleDataInputForFlow: (
    flowVersion: FlowVersion | undefined,
    projectId: string | undefined,
  ) => {
    return useQuery({
      queryKey: ['sampleDataInput', flowVersion?.id],
      enabled: !!flowVersion,
      staleTime: 0,
      retry: 4,
      refetchOnWindowFocus: false,
      queryFn: async () => {
        const sampleDataInput = await getSampleDataForFlow(
          flowVersion!,
          projectId!,
          SampleDataFileType.INPUT,
        );
        const stepsWithoutInput = flowStructureUtil
          .getAllSteps(flowVersion!.trigger)
          .filter((step) => !step.settings.sampleData?.sampleDataInputFileId);
        stepsWithoutInput.forEach((step) => {
          sampleDataInput[step.name] = undefined;
        });
        return sampleDataInput;
      },
    });
  },
  invalidateSampleData: (flowVersionId: string, queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['sampleData', flowVersionId] });
    queryClient.invalidateQueries({
      queryKey: ['sampleDataInput', flowVersionId],
    });
  },
};

async function getSampleDataForFlow(
  flowVersion: FlowVersion,
  projectId: string,
  type: SampleDataFileType,
): Promise<Record<string, unknown>> {
  return sampleDataApi
    .getForFlow({
      flowId: flowVersion.flowId,
      flowVersionId: flowVersion.id,
      projectId,
      type,
    })
    .catch((error) => {
      console.error(error);
      return {};
    });
}
