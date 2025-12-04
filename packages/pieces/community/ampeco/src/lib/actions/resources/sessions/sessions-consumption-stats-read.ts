import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { SessionsConsumptionStatsReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const sessionsConsumptionStatsReadAction = createAction({
  auth: ampecoAuth,
  name: 'sessionsConsumptionStatsRead',
  displayName: 'Resources - Sessions - Sessions Consumption Stats Read',
  description: 'Consumption statistics may differ between active and finished sessions, as finished sessions display aggregated final data with a maximum of 300 items. (Endpoint: GET /public-api/resources/sessions/v1.0/{session}/consumption-stats)',
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
