import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ContactDetailsReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/contact-details/v2.0

export const contactDetailsReadAction = createAction({
  auth: ampecoAuth,
  name: 'contactDetailsRead',
  displayName: 'Resources - Contact Details - Contact Details Read',
  description: 'Get the contact details.',
  props: {
  },
  async run(context): Promise<ContactDetailsReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/contact-details/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ContactDetailsReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
