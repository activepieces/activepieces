import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const circuitSetSessionPriorityAction = createAction({
  auth: ampecoAuth,
  name: 'circuitSetSessionPriority',
  displayName: 'Actions - Circuit - Circuit Set Session Priority',
  description: 'Circuit / Set Session Priority. (Endpoint: POST /public-api/actions/circuit/v2.0/{circuit}/set-session-priority/{session})',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    description: '',
    required: true,
  }),

  session: Property.Number({
    displayName: 'Session',
    description: '',
    required: true,
  }),

  priority: Property.Number({
    displayName: 'Priority',
    description: '',
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
