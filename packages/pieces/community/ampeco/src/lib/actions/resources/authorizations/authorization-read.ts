import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { AuthorizationReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/authorizations/v2.0/{authorization}
export const authorizationReadAction = createAction({
  auth: ampecoAuth,
  name: 'authorizationRead',
  displayName: 'Resources - Authorizations - Authorization Read',
  description: 'Authorization / Read.',
  props: {
        
  authorization: Property.ShortText({
    displayName: 'Authorization',
    required: true,
  }),
  },
  async run(context): Promise<AuthorizationReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/authorizations/v2.0/{authorization}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as AuthorizationReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
