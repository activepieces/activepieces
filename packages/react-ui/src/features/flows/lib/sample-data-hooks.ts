import { useQuery, QueryClient } from '@tanstack/react-query';

import {
  flowStructureUtil,
  FlowVersion,
  SampleDataFileType,
} from '@activepieces/shared';

import { sampleDataApi } from './sample-data-api';

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
      queryFn: async () => {
        const steps = flowStructureUtil.getAllSteps(flowVersion!.trigger);
        const singleStepSampleData = await Promise.all(
          steps.map(async (step) => {
            return {
              [step.name]: await getSampleData(
                flowVersion!,
                step.name,
                projectId!,
                SampleDataFileType.OUTPUT,
              ),
            };
          }),
        );
        const sampleData: Record<string, unknown> = {};
        singleStepSampleData.forEach((stepData) => {
          Object.assign(sampleData, stepData);
        });
        return sampleData;
      },
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
        const steps = flowStructureUtil.getAllSteps(flowVersion!.trigger);
        const singleStepSampleDataInput = await Promise.all(
          steps.map(async (step) => {
            return {
              [step.name]: step.settings.sampleData?.sampleDataInputFileId
                ? await getSampleData(
                    flowVersion!,
                    step.name,
                    projectId!,
                    SampleDataFileType.INPUT,
                  )
                : undefined,
            };
          }),
        );
        const sampleDataInput: Record<string, unknown> = {};
        singleStepSampleDataInput.forEach((stepData) => {
          Object.assign(sampleDataInput, stepData);
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

async function getSampleData(
  flowVersion: FlowVersion,
  stepName: string,
  projectId: string,
  type: SampleDataFileType,
): Promise<unknown> {
  return sampleDataApi
    .get({
      flowId: flowVersion.flowId,
      flowVersionId: flowVersion.id,
      stepName,
      projectId,
      type,
    })
    .catch((error) => {
      console.error(error);
      return undefined;
    });
}
