import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { EvseDowntimePeriodReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const evseDowntimePeriodReadAction = createAction({
  auth: ampecoAuth,
  name: 'evseDowntimePeriodRead',
  displayName: 'Resources - Evse Downtime Periods - Evse Downtime Period Read',
  description: 'Get EVSE Downtime Period. (Endpoint: GET /public-api/resources/evse-downtime-periods/v1.0/{evseDowntimePeriod})',
  props: {
        
  evseDowntimePeriod: Property.Number({
    displayName: 'Evse Downtime Period',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<EvseDowntimePeriodReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/evse-downtime-periods/v1.0/{evseDowntimePeriod}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as EvseDowntimePeriodReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
