import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/circuit/v2.0/{circuit}/attach-charge-point

export const circuitAttachChargePointAction = createAction({
  auth: ampecoAuth,
  name: 'circuitAttachChargePoint',
  displayName: 'Actions - Circuit - Attach Charge Point',
  description: 'To maintain safety and compatibility, only charge points with an identical electrical configuration to the circuit can be added.',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    required: true,
  }),

  chargePointId: Property.Number({
    displayName: 'Charge Point Id',
    required: true,
  }),

  priority: Property.Number({
    displayName: 'Priority',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/circuit/v2.0/{circuit}/attach-charge-point', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['chargePointId', 'priority']
      );

      
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
