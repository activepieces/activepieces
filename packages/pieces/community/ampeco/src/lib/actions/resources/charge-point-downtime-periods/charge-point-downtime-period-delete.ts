import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/charge-point-downtime-periods/v1.0/{chargePointDowntimePeriod}

export const chargePointDowntimePeriodDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointDowntimePeriodDelete',
  displayName: 'Resources - Charge Point Downtime Periods - Delete',
  description: 'Delete Manual Created Charge Point Downtime Period.',
  audience: 'both',
  aiMetadata: { description: 'Delete a manually created charge-point downtime period by its numeric ID. Only manually created periods can be removed (automatically generated ones cannot). Effectively idempotent on the target but destructive and irreversible, so confirm the ID first.', idempotent: true },
  props: {
        
  chargePointDowntimePeriod: Property.Number({
    displayName: 'Charge Point Downtime Period',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-downtime-periods/v1.0/{chargePointDowntimePeriod}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
