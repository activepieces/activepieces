import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { CircuitConsumptionResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const circuitConsumptionAction = createAction({
  auth: ampecoAuth,
  name: 'circuitConsumption',
  displayName: 'Resources - Circuits - Circuit Consumption',
  description: 'Get the consumption of a circuit for each phase. (Endpoint: GET /public-api/resources/circuits/v2.0/{circuit}/consumption)',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<CircuitConsumptionResponse> {
    try {
      const url = processPathParameters('/public-api/resources/circuits/v2.0/{circuit}/consumption', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as CircuitConsumptionResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
