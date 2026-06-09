import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { SecurityEventReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/security-events/v2.0/{securityEvent}
export const securityEventReadAction = createAction({
  auth: ampecoAuth,
  name: 'securityEventRead',
  displayName: 'Resources - Security Events - Security Event Read',
  description: 'Get a Security Event.',
  props: {
        
  securityEvent: Property.Number({
    displayName: 'Security Event',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<SecurityEventReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/security-events/v2.0/{securityEvent}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as SecurityEventReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
