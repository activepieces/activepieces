import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointDowntimePeriodDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointDowntimePeriodDelete',
  displayName: 'Resources - Charge Point Downtime Periods - Charge Point Downtime Period Delete',
  description: 'Delete Manual Created Charge Point Downtime Period. (Endpoint: DELETE /public-api/resources/charge-point-downtime-periods/v1.0/{chargePointDowntimePeriod})',
  props: {
        
  chargePointDowntimePeriod: Property.Number({
    displayName: 'Charge Point Downtime Period',
    description: '',
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
