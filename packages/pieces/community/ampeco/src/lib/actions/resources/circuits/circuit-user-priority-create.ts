import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { CircuitUserPriorityCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/circuits/v2.0/{circuit}/user-priorities

export const circuitUserPriorityCreateAction = createAction({
  auth: ampecoAuth,
  name: 'circuitUserPriorityCreate',
  displayName: 'Resources - Circuits - Circuit User Priority Create',
  description: 'Create a circuit\'s user priority.',
  audience: 'both',
  aiMetadata: { description: 'Add a user-priority rule to an AMPECO load-balancing circuit, weighting how much power a user group or partner gets during charging (priority 1 = baseline, 2 = twice as important, 0.5 = half). Not idempotent: each call creates a new priority rule. Use the circuit user priorities listing to inspect existing rules.', idempotent: false },
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    required: true,
  }),

  targetId: Property.Number({
    displayName: 'Target Id',
    description: 'The ID of the User Group the user must be part of or the ID of the Partner from which the user must have an invite from, for the set priority apply for the session.',
    required: true,
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    required: true,
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
    required: true,
  }),
  },
  async run(context): Promise<CircuitUserPriorityCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/circuits/v2.0/{circuit}/user-priorities', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['targetId', 'type', 'priority']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as CircuitUserPriorityCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
