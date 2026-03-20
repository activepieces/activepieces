import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/circuit/v2.0/{circuit}/set-circuit-soc-priorities.

export const circuitSetCircuitSocPriorityAction = createAction({
  auth: ampecoAuth,
  name: 'circuitSetCircuitSocPriority',
  displayName: 'Actions - Circuit - Set Circuit SoC Priority',
  description: 'Set DLM priority based on the session\'s state of charge (SoC). The active priority will be used to either decrease or increase the energy used by the session\'s EVSE. - If the SoC exceeds the &#x60;upperThresholdPercent&#x60;, then the &#x60;highSoCPriority&#x60; will be applied.',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    required: true,
  }),

  upperThresholdPercent: Property.Number({
    displayName: 'Upper Threshold Percent',
    description: `The state of charge (SoC) percentage above which the \`highSoCPriority\` will be applied. Must have a 5% offset from the \`lowerThresholdPercent\` (if provided).\nFor example if \`lowerThresholdPercent\` is set to 50, this can have a value of 55 or higher.\nSetting this to \`null\` will remove the usage of the \`highSoCPriority\`.\n`,
    required: false,
  }),

  highSoCPriority: Property.Number({
    displayName: 'High SoC Priority',
    required: false,
  }),

  lowerThresholdPercent: Property.Number({
    displayName: 'Lower Threshold Percent',
    description: `The state of charge (SoC) percentage below which the \`lowSoCPriority\` will be applied. Must have a 5% offset from the \`upperThresholdPercent\` (if provided).\nFor example if \`upperThresholdPercent \` is set to 50, this can have a value of 45 or lower.\nSetting this to \`null\` will remove the usage of the \`lowSoCPriority\`.\n`,
    required: false,
  }),

  lowSoCPriority: Property.Number({
    displayName: 'Low SoC Priority',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/circuit/v2.0/{circuit}/set-circuit-soc-priorities', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['upperThresholdPercent', 'highSoCPriority', 'lowerThresholdPercent', 'lowSoCPriority']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
