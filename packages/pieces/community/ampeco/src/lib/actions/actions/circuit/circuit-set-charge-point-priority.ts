import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/circuit/v2.0/{circuit}/set-charge-point-priority/{chargePoint}

export const circuitSetChargePointPriorityAction = createAction({
  auth: ampecoAuth,
  name: 'circuitSetChargePointPriority',
  displayName: 'Actions - Circuit - Set Charge Point Priority',
  description: 'Circuit / Set Charge Point Priority.',
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    required: true,
  }),

  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  priority: Property.Number({
    displayName: 'Priority',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/circuit/v2.0/{circuit}/set-charge-point-priority/{chargePoint}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['priority']
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
