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
  audience: 'both',
  aiMetadata: { description: 'Set the dynamic-load-management priority for an entire charge point within a circuit, addressed by circuit and charge point IDs. Use this for charge-point-level load bias; for a single connector use circuit-set-charge-point-evse-priority, and for an in-progress session use circuit-set-session-priority. Idempotent: writes the priority to a fixed value.', idempotent: true },
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
