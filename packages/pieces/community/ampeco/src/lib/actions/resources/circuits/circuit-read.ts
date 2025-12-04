import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { CircuitReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const circuitReadAction = createAction({
  auth: ampecoAuth,
  name: 'circuitRead',
  displayName: 'Resources - Circuits - Circuit Read',
  description: 'Get a circuit. (Endpoint: GET /public-api/resources/circuits/v2.0/{circuit})',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    description: '',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
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
