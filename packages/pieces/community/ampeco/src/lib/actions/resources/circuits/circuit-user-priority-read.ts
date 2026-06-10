import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { CircuitUserPriorityReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/circuits/v2.0/{circuit}/user-priorities/{userPriority}

export const circuitUserPriorityReadAction = createAction({
  auth: ampecoAuth,
  name: 'circuitUserPriorityRead',
  displayName: 'Resources - Circuits - Circuit User Priority Read',
  description: 'Get a circuit\'s user priority.',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    required: true,
  }),

  userPriority: Property.Number({
    displayName: 'User Priority',
    required: true,
  }),
  },
  async run(context): Promise<CircuitUserPriorityReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/circuits/v2.0/{circuit}/user-priorities/{userPriority}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as CircuitUserPriorityReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
