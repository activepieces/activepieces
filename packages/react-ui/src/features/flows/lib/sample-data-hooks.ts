import { useQuery, QueryClient } from '@tanstack/react-query';

import { flowStructureUtil, FlowVersion, FileType } from '@activepieces/shared';

import { sampleDataApi } from './sample-data-api';

const getSampleData = async (
  flowVersion: FlowVersion,
  stepName: string,
  projectId: string,
  fileType: FileType,
) => {
  try {
    return await sampleDataApi.get({
      flowId: flowVersion!.flowId,
      flowVersionId: flowVersion!.id,
      stepName: stepName,
      projectId: projectId,
      fileType: fileType,
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
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
                FileType.SAMPLE_DATA,
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
              [step.name]: step.settings.inputUiInfo?.sampleDataInputFileId
                ? await getSampleData(
                    flowVersion!,
                    step.name,
                    projectId!,
                    FileType.SAMPLE_DATA_INPUT,
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
