import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointDowntimePeriodReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-point-downtime-periods/v1.0/{chargePointDowntimePeriod}

export const chargePointDowntimePeriodReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointDowntimePeriodRead',
  displayName: 'Resources - Charge Point Downtime Periods - Read',
  description: 'Get Charge Point Downtime Period.',
  props: {
        
  chargePointDowntimePeriod: Property.Number({
    displayName: 'Charge Point Downtime Period',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointDowntimePeriodReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-downtime-periods/v1.0/{chargePointDowntimePeriod}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointDowntimePeriodReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
