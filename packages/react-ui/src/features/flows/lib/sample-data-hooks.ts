import { useQuery } from '@tanstack/react-query';

import { flowHelper, FlowVersion } from '@activepieces/shared';

import { sampleDataApi } from './sample-data-api';

export const sampleDataHooks = {
  useSampleDataForFlow: (flowVersion: FlowVersion | undefined) => {
    return useQuery({
      queryKey: ['sampleData', flowVersion?.id],
      enabled: !!flowVersion,
      staleTime: 0,
      queryFn: async () => {
        const steps = flowHelper.getAllSteps(flowVersion!.trigger);
        const singleStepSampleData = await Promise.all(
          steps.map(async (step) => {
            return {
              [step.name]: await sampleDataApi.get({
                flowId: flowVersion!.flowId,
                flowVersionId: flowVersion!.id,
                stepName: step.name,
              }),
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
};
