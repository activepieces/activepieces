import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { SessionsConsumptionStatsReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/sessions/v1.0/{session}/consumption-stats

export const sessionsConsumptionStatsReadAction = createAction({
  auth: ampecoAuth,
  name: 'sessionsConsumptionStatsRead',
  displayName: 'Resources - Sessions - Read Sessions Consumption Stats',
  description: 'Consumption statistics may differ between active and finished sessions, as finished sessions display aggregated final data with a maximum of 300 items.',
  props: {
        
  session: Property.ShortText({
    displayName: 'Session',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<SessionsConsumptionStatsReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/sessions/v1.0/{session}/consumption-stats', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as SessionsConsumptionStatsReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
