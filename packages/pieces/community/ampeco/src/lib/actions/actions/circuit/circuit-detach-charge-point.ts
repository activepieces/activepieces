import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const circuitDetachChargePointAction = createAction({
  auth: ampecoAuth,
  name: 'circuitDetachChargePoint',
  displayName: 'Actions - Circuit - Circuit Detach Charge Point',
  description: 'Circuit / Detach Charge Point. (Endpoint: POST /public-api/actions/circuit/v2.0/{circuit}/detach-charge-point/{chargePoint})',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    description: '',
    required: true,
  }),

  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/circuit/v2.0/{circuit}/detach-charge-point/{chargePoint}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
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
