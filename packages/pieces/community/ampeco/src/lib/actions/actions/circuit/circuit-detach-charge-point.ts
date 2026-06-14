import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/circuit/v2.0/{circuit}/detach-charge-point/{chargePoint}

export const circuitDetachChargePointAction = createAction({
  auth: ampecoAuth,
  name: 'circuitDetachChargePoint',
  displayName: 'Actions - Circuit - Detach Charge Point',
  description: 'Circuit / Detach Charge Point.',
  audience: 'both',
  aiMetadata: { description: 'Remove a charge point from a circuit\'s dynamic load management, addressed by circuit and charge point IDs. Inverse of circuit-attach-charge-point. Idempotent: detaching a charge point that is not on the circuit has no further effect.', idempotent: true },
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
