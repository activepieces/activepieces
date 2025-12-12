import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const evseDowntimePeriodDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'evseDowntimePeriodDelete',
  displayName: 'Resources - Evse Downtime Periods - Evse Downtime Period Delete',
  description: 'Delete Manual Created EVSE Downtime Period. (Endpoint: DELETE /public-api/resources/evse-downtime-periods/v1.0/{evseDowntimePeriod})',
  props: {
        
  evseDowntimePeriod: Property.Number({
    displayName: 'Evse Downtime Period',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/evse-downtime-periods/v1.0/{evseDowntimePeriod}', context.propsValue);
      
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
