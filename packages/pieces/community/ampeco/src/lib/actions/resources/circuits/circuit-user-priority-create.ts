import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { CircuitUserPriorityCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const circuitUserPriorityCreateAction = createAction({
  auth: ampecoAuth,
  name: 'circuitUserPriorityCreate',
  displayName: 'Resources - Circuits - Circuit User Priority Create',
  description: 'Create a circuit&#x27;s user priority. (Endpoint: POST /public-api/resources/circuits/v2.0/{circuit}/user-priorities)',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    description: '',
    required: true,
  }),

  targetId: Property.Number({
    displayName: 'Target Id',
    description: 'The ID of the User Group the user must be part of or the ID of the Partner from which the user must have an invite from, for the set priority apply for the session.',
    required: true,
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
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
