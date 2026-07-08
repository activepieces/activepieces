import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/circuit/v2.0/{circuit}/set-session-priority/{session}
export const circuitSetSessionPriorityAction = createAction({
  auth: ampecoAuth,
  name: 'circuitSetSessionPriority',
  displayName: 'Actions - Circuit - Set Session Priority',
  description: 'Circuit / Set Session Priority.',
  audience: 'both',
  aiMetadata: { description: 'Set the dynamic-load-management priority for a specific active charging session within a circuit, addressed by circuit and session IDs. Use to bias load for one ongoing session rather than a whole charge point (circuit-set-charge-point-priority) or connector (circuit-set-charge-point-evse-priority). Idempotent: writes the priority to a fixed value.', idempotent: true },
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    required: true,
  }),

  session: Property.Number({
    displayName: 'Session',
    required: true,
  }),

  priority: Property.Number({
    displayName: 'Priority',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/circuit/v2.0/{circuit}/set-session-priority/{session}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['priority']
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
