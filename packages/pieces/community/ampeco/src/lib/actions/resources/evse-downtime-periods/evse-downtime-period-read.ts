import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { EvseDowntimePeriodReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/evse-downtime-periods/v1.0/{evseDowntimePeriod}

export const evseDowntimePeriodReadAction = createAction({
  auth: ampecoAuth,
  name: 'evseDowntimePeriodRead',
  displayName: 'Resources - Evse Downtime Periods - Read',
  description: 'Get EVSE Downtime Period.',
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
