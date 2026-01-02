import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/circuit/v2.0/{circuit}/detach-charge-point/{chargePoint}

export const circuitDetachChargePointAction = createAction({
  auth: ampecoAuth,
  name: 'circuitDetachChargePoint',
  displayName: 'Actions - Circuit - Detach Charge Point',
  description: 'Circuit / Detach Charge Point.',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    required: true,
  }),

  chargePoint: Property.Number({
    displayName: 'Charge Point',
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
