import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { SecurityEventReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const securityEventReadAction = createAction({
  auth: ampecoAuth,
  name: 'securityEventRead',
  displayName: 'Resources - Security Events - Security Event Read',
  description: 'Get a Security Event. (Endpoint: GET /public-api/resources/security-events/v2.0/{securityEvent})',
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
