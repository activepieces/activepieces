import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { CircuitUserPriorityUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/circuits/v2.0/{circuit}/user-priorities/{userPriority}

export const circuitUserPriorityUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'circuitUserPriorityUpdate',
  displayName: 'Resources - Circuits - Circuit User Priority Update',
  description: 'Update a circuit\'s user priority.',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    required: true,
  }),

  userPriority: Property.Number({
    displayName: 'User Priority',
    required: true,
  }),

  targetId: Property.Number({
    displayName: 'Target Id',
    description: 'The ID of the User Group the user must be part of or the ID of the Partner from which the user must have an invite from, for the set priority apply for the session.',
    required: false,
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    required: false,
    options: {
      options: [
      { label: 'partner', value: 'partner' },
      { label: 'userGroup', value: 'userGroup' }
      ],
    },
  }),

  priority: Property.Number({
    displayName: 'Priority',
    description: 'The priority where 1 is equal to anyone else, 2 is twice as important, 0.5 is half as important.',
    required: false,
  }),
  },
  async run(context): Promise<CircuitUserPriorityUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/circuits/v2.0/{circuit}/user-priorities/{userPriority}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['targetId', 'type', 'priority']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as CircuitUserPriorityUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
