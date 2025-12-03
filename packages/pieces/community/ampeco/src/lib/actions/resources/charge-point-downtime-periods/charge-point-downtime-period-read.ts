import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointDowntimePeriodReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointDowntimePeriodReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointDowntimePeriodRead',
  displayName: 'Resources - Charge Point Downtime Periods - Charge Point Downtime Period Read',
  description: 'Get Charge Point Downtime Period. (Endpoint: GET /public-api/resources/charge-point-downtime-periods/v1.0/{chargePointDowntimePeriod})',
  props: {
        
  chargePointDowntimePeriod: Property.Number({
    displayName: 'Charge Point Downtime Period',
    description: '',
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
