import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { CircuitReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/circuits/v2.0/{circuit}

export const circuitReadAction = createAction({
  auth: ampecoAuth,
  name: 'circuitRead',
  displayName: 'Resources - Circuits - Read',
  description: 'Get a circuit.',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    required: false,
    options: {
      options: [
      { label: 'chargePointPriorities', value: 'chargePointPriorities' },
      { label: 'userPriorities', value: 'userPriorities' },
      { label: 'socPriorities', value: 'socPriorities' },
      { label: 'consumption', value: 'consumption' },
      { label: 'unmanagedLoad', value: 'unmanagedLoad' }
      ],
    },
  }),
  },
  async run(context): Promise<CircuitReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/circuits/v2.0/{circuit}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as CircuitReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
