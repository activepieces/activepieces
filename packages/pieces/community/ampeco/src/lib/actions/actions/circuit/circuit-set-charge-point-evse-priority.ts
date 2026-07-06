import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/circuit/v2.0/{circuit}/set-charge-point-priority/{chargePoint}/evse/{evse}
export const circuitSetChargePointEvsePriorityAction = createAction({
  auth: ampecoAuth,
  name: 'circuitSetChargePointEvsePriority',
  displayName: 'Actions - Circuit - Set Charge Point EVSE Priority',
  description: 'Circuit / Set Charge Point EVSE Priority.',
  audience: 'both',
  aiMetadata: { description: 'Set the dynamic-load-management (DLM) priority for one specific EVSE of a charge point within a circuit, addressed by circuit, charge point, and EVSE IDs. Use to bias load allocation at the individual connector level rather than for a whole charge point (circuit-set-charge-point-priority) or session (circuit-set-session-priority). Idempotent: writes the priority to a fixed value.', idempotent: true },
  props: {
        
  circuit: Property.Number({
    displayName: 'Circuit',
    required: true,
  }),

  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  evse: Property.Number({
    displayName: 'Evse',
    required: true,
  }),

  priority: Property.Number({
    displayName: 'Priority',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/circuit/v2.0/{circuit}/set-charge-point-priority/{chargePoint}/evse/{evse}', context.propsValue);
      
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
